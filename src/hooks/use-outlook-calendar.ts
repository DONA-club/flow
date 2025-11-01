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
  connected: boolean;
  refresh: () => void;
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

async function getSavedMicrosoftTokens(): Promise<TokenRow | null> {
  const { data: sess } = await supabase.auth.getSession();
  const userId = (sess?.session as any)?.user?.id ?? null;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("oauth_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .eq("provider", "microsoft")
    .maybeSingle();

  if (error) return null;
  return (data as any) ?? null;
}

async function refreshAccessTokenViaEdge(refreshToken: string, supaAccess: string): Promise<string | null> {
  const scopes = "Calendars.Read offline_access openid profile email";
  const { data: resp, error } = await supabase.functions.invoke(
    "microsoft-token-refresh",
    {
      body: { refresh_token: refreshToken, scope: scopes },
      headers: {
        Authorization: `Bearer ${supaAccess}`,
      },
    }
  );
  if (error) return null;
  const accessToken: string | undefined = (resp as any)?.access_token;
  return accessToken || null;
}

export function useOutlookCalendar(options?: Options): Result {
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

    // 1) Récupère tokens persistés
    let tokens = await getSavedMicrosoftTokens();
    let token = tokens?.access_token ?? null;

    // 2) Pas d’access_token → tenter refresh si possible
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
            provider: "microsoft",
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
      setError("Aucun jeton Microsoft disponible. Cliques sur Microsoft (seul) pour consenter, puis reviens ici.");
      return;
    }

    // Fenêtre de 3 jours via calendarView
    const now = new Date();
    const end = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const startISO = now.toISOString();
    const endISO = end.toISOString();
    const url =
      "https://graph.microsoft.com/v1.0/me/calendarview" +
      `?startDateTime=${encodeURIComponent(startISO)}` +
      `&endDateTime=${encodeURIComponent(endISO)}` +
      "&$orderby=start/dateTime" +
      "&$select=subject,organizer,start,end,location,webLink";

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (res.status === 401 || res.status === 403) {
      setConnected(false);
      setEvents([]);
      setLoading(false);
      setError("Jeton Microsoft invalide/expiré. Clique Microsoft pour re-consentir.");
      return;
    }

    if (!res.ok) {
      setEvents([]);
      setLoading(false);
      setError(`Erreur Outlook (${res.status})`);
      return;
    }

    setConnected(true);
    const json = await res.json();
    const items: any[] = json?.value ?? [];

    const mapped: CalendarEvent[] = items
      .map((item) => {
        const title = item.subject || "Événement";
        const place =
          item.location?.displayName ||
          item.organizer?.emailAddress?.name ||
          "Agenda";
        const startIso = item.start?.dateTime;
        const endIso = item.end?.dateTime;
        if (!startIso || !endIso) return null;

        const startDec = toHourDecimal(startIso);
        const endDec = toHourDecimal(endIso);

        return {
          title,
          place,
          start: startDec,
          end: endDec,
          url: item.webLink,
          raw: item,
        };
      })
      .filter(Boolean) as CalendarEvent[];

    const nowRef = new Date();
    const upcoming = mapped.filter((e) => {
      const startDate =
        (e.raw?.start?.dateTime && new Date(e.raw.start.dateTime)) || null;
      return startDate ? startDate.getTime() >= nowRef.getTime() : true;
    });

    setEvents(upcoming);
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
    connected,
    refresh: fetchEvents,
  };
}