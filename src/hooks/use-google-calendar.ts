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

type TokenRow = {
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
};

async function getSavedGoogleTokens(): Promise<TokenRow | null> {
  const { data: sess } = await supabase.auth.getSession();
  const userId = (sess?.session as any)?.user?.id ?? null;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("oauth_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .eq("provider", "google")
    .maybeSingle();

  if (error) return null;
  return (data as any) ?? null;
}

async function refreshAccessTokenViaEdge(refreshToken: string, supaAccess: string): Promise<string | null> {
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

    const { data: s } = await supabase.auth.getSession();
    const supaAccess = (s?.session as any)?.access_token ?? null;

    // 1) Récupération des tokens persistés
    let tokens = await getSavedGoogleTokens();
    let token = tokens?.access_token ?? null;

    // 2) Si pas d’access_token → tenter refresh
    if (!token && tokens?.refresh_token && supaAccess) {
      const refreshed = await refreshAccessTokenViaEdge(tokens.refresh_token, supaAccess);
      if (refreshed) {
        token = refreshed;
        setConnected(true);
        // Upsert l’access token rafraîchi
        const userId = (s?.session as any)?.user?.id;
        await supabase.from("oauth_tokens").upsert(
          {
            user_id: userId,
            provider: "google",
            access_token: refreshed,
          },
          { onConflict: "user_id,provider" }
        );
      }
    }

    if (!token) {
      setConnected(false);
      setEvents([]);
      setLoading(false);
      setError("Aucun jeton Google disponible. Clique Google et consent offline + calendar.readonly.");
      return;
    }

    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(
      timeMin
    )}&timeMax=${encodeURIComponent(timeMax)}&maxResults=50`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401 || res.status === 403) {
      setConnected(false);
      setEvents([]);
      setLoading(false);
      setError("Jeton Google invalide/expiré. Clique Google pour re-consentir.");
      return;
    }

    if (!res.ok) {
      setEvents([]);
      setLoading(false);
      setError(`Erreur Google Calendar (${res.status})`);
      return;
    }

    setConnected(true);
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