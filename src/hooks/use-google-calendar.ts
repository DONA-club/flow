"use client";

import React from "react";
import { supabase } from "@/integrations/supabase/client";

export type CalendarEvent = {
  title: string;
  place: string;
  start: number; // heure décimale (0-23)
  end: number;   // heure décimale (0-23)
  url?: string;
  raw?: any;
};

type Result = {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  connected: boolean;
};

function toHourDecimal(iso: string): number {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

async function resolveGoogleAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const session: any = data?.session ?? null;
  const fromProviderToken: string | null = session?.provider_token ?? null;
  if (fromProviderToken) return fromProviderToken;

  const identities: any[] = session?.user?.identities ?? [];
  const googleIdentity = identities.find((i) => i?.provider === "google");
  const fromIdentities: string | null = googleIdentity?.identity_data?.access_token ?? null;
  return fromIdentities || null;
}

async function resolveGoogleRefreshToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const session: any = data?.session ?? null;

  // Quelques environnements exposent provider_refresh_token
  const fromProviderRefresh: string | null = session?.provider_refresh_token ?? null;
  if (fromProviderRefresh) return fromProviderRefresh;

  // Ou via identities[].identity_data.refresh_token suivant la config
  const identities: any[] = session?.user?.identities ?? [];
  const googleIdentity = identities.find((i) => i?.provider === "google");
  const fromIdentities: string | null = googleIdentity?.identity_data?.refresh_token ?? null;
  return fromIdentities || null;
}

async function refreshAccessTokenViaEdge(): Promise<string | null> {
  const refreshToken = await resolveGoogleRefreshToken();
  if (!refreshToken) return null;

  const { data, error } = await supabase.functions.invoke("google-token-refresh", {
    body: { refresh_token: refreshToken },
  });

  if (error) return null;
  const accessToken: string | undefined = (data as any)?.access_token;
  return accessToken || null;
}

export function useGoogleCalendar(): Result {
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [connected, setConnected] = React.useState(false);

  const fetchEvents = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(
      timeMin
    )}&timeMax=${encodeURIComponent(timeMax)}&maxResults=50`;

    let token = await resolveGoogleAccessToken();
    if (!token) {
      // Essaie un refresh silencieux via Edge Function
      const refreshed = await refreshAccessTokenViaEdge();
      if (refreshed) {
        token = refreshed;
        setConnected(true);
      } else {
        setConnected(false);
        setEvents([]);
        setLoading(false);
        setError("Jeton Google manquant/expiré. Veuillez réautoriser l’accès au calendrier.");
        return;
      }
    } else {
      setConnected(true);
    }

    const doFetch = async (tkn: string) => {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${tkn}` },
      });
      return res;
    };

    let res = await doFetch(token);
    if (!res.ok && (res.status === 401 || res.status === 403)) {
      const refreshed = await refreshAccessTokenViaEdge();
      if (refreshed) {
        token = refreshed;
        setConnected(true);
        res = await doFetch(token);
      }
    }

    if (!res.ok) {
      setEvents([]);
      setLoading(false);
      setError(`Erreur Google Calendar (${res.status})`);
      return;
    }

    const json = await res.json();
    const items: any[] = json?.items ?? [];

    const mapped: CalendarEvent[] = items
      .map((item) => {
        const title = item.summary || "Événement";
        const place = item.location || (item.organizer?.displayName ?? "Agenda");
        const startIso = item.start?.dateTime || item.start?.date;
        const endIso = item.end?.dateTime || item.end?.date;
        if (!startIso || !endIso) return null;

        const startDec = toHourDecimal(startIso);
        const endDec = toHourDecimal(endIso);

        return {
          title,
          place,
          start: startDec,
          end: endDec,
          url: item.htmlLink,
          raw: item,
        };
      })
      .filter(Boolean) as CalendarEvent[];

    setEvents(mapped);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  React.useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(() => {
      fetchEvents();
    });
    return () => data.subscription.unsubscribe();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    refresh: fetchEvents,
    connected,
  };
}