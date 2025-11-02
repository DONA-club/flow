"use client";

import React from "react";
import { supabase } from "@/integrations/supabase/client";

export type CalendarEvent = {
  title: string;
  place: string;
  start: number;
  end: number;
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

async function getGoogleTokens() {
  const { data: sess } = await supabase.auth.getSession();
  const userId = sess?.session?.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("oauth_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .eq("provider", "google")
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

async function refreshGoogleToken(refreshToken: string) {
  const { data: sess } = await supabase.auth.getSession();
  const supaAccess = sess?.session?.access_token;
  if (!supaAccess) return null;

  const { data, error } = await supabase.functions.invoke("google-token-refresh", {
    body: { refresh_token: refreshToken },
    headers: { Authorization: `Bearer ${supaAccess}` },
  });

  if (error || !data) return null;
  
  const newAccessToken = data.access_token;
  if (!newAccessToken) return null;

  // Sauvegarder le nouveau token
  const userId = sess?.session?.user?.id;
  await supabase.from("oauth_tokens").upsert(
    {
      user_id: userId,
      provider: "google",
      access_token: newAccessToken,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" }
  );

  return newAccessToken;
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

    const tokens = await getGoogleTokens();
    let accessToken = tokens?.access_token;

    if (!accessToken && tokens?.refresh_token) {
      accessToken = await refreshGoogleToken(tokens.refresh_token);
    }

    if (!accessToken) {
      setConnected(false);
      setEvents([]);
      setLoading(false);
      setError("Google non connecté. Connectez Google depuis la page d'accueil.");
      return;
    }

    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(
      timeMin
    )}&timeMax=${encodeURIComponent(timeMax)}&maxResults=50`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 401 && tokens?.refresh_token) {
      const newToken = await refreshGoogleToken(tokens.refresh_token);
      if (newToken) {
        return fetchEvents();
      }
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

  return {
    events,
    loading,
    error,
    refresh: fetchEvents,
    connected,
  };
}