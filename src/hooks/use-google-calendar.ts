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

type Options = {
  enabled?: boolean;
};

function toHourDecimal(iso: string): number {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

function isGoogleActive(session: any) {
  const p = session?.user?.app_metadata?.provider;
  return p === "google";
}

async function resolveGoogleAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const session: any = data?.session ?? null;

  const identities: any[] = session?.user?.identities ?? [];
  const googleIdentity = identities.find((i) => i?.provider === "google");
  const fromIdentities: string | null =
    googleIdentity?.identity_data?.access_token ?? null;

  if (fromIdentities) return fromIdentities;

  // Si la session active est Google, autoriser l’usage du provider_token
  if (isGoogleActive(session)) {
    return session?.provider_token ?? null;
  }

  return null;
}

async function resolveGoogleRefreshToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const session: any = data?.session ?? null;

  const identities: any[] = session?.user?.identities ?? [];
  const googleIdentity = identities.find((i) => i?.provider === "google");
  const fromIdentities: string | null =
    googleIdentity?.identity_data?.refresh_token ?? null;

  if (fromIdentities) return fromIdentities;

  // Si la session active est Google, autoriser l’usage du provider_refresh_token
  if (isGoogleActive(session)) {
    return session?.provider_refresh_token ?? null;
  }

  return null;
}

async function refreshAccessTokenViaEdge(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const session: any = data?.session ?? null;
  const refreshToken = await resolveGoogleRefreshToken();
  const supaAccess = session?.access_token;

  if (!refreshToken || !supaAccess) return null;

  const { data: resp, error } = await supabase.functions.invoke("google-token-refresh", {
    body: { refresh_token: refreshToken },
    headers: {
      Authorization: `Bearer ${supaAccess}`,
    },
  });

  if (error) return null;
  const accessToken: string | undefined = (resp as any)?.access_token;
  return accessToken || null;
}

export function useGoogleCalendar(options?: Options): Result {
  const enabled = options?.enabled ?? true;

  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [connected, setConnected] = React.useState(false);

  const fetchEvents = React.useCallback(async () => {
    if (!enabled) return;

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
      const refreshed = await refreshAccessTokenViaEdge();
      if (refreshed) {
        token = refreshed;
        setConnected(true);
      } else {
        setConnected(false);
        setEvents([]);
        setLoading(false);
        setError("Jeton Google manquant/expiré. Cliquez sur Google pour re-consentir (offline) et accorder Calendar.Readonly.");
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
      } else {
        setConnected(false);
        setEvents([]);
        setLoading(false);
        setError("Session Google expirée et refresh indisponible. Reconnectez Google pour récupérer les événements sur 3 jours.");
        return;
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
  }, [enabled]);

  React.useEffect(() => {
    if (!enabled) return;
    fetchEvents();
  }, [enabled, fetchEvents]);

  React.useEffect(() => {
    if (!enabled) return;
    const { data } = supabase.auth.onAuthStateChange(() => {
      fetchEvents();
    });
    return () => data.subscription.unsubscribe();
  }, [enabled, fetchEvents]);

  return {
    events,
    loading,
    error,
    refresh: fetchEvents,
    connected,
  };
}