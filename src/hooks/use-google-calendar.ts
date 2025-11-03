"use client";

import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSessionGroup } from "@/hooks/use-session-group";

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

async function refreshGoogleToken(refreshToken: string) {
  console.log("🔄 [Google] Tentative de refresh du token...");
  
  const { data: sess } = await supabase.auth.getSession();
  const session = sess?.session;
  const supaAccess = session?.access_token;
  if (!supaAccess) {
    console.error("❌ [Google] Pas de token Supabase pour appeler la fonction edge");
    return null;
  }

  const { data, error } = await supabase.functions.invoke("google-token-refresh", {
    body: { refresh_token: refreshToken },
    headers: { Authorization: `Bearer ${supaAccess}` },
  });

  if (error) {
    console.error("❌ [Google] Erreur refresh token:", error);
    return null;
  }
  
  if (!data?.access_token) {
    console.error("❌ [Google] Pas de nouveau token dans la réponse");
    return null;
  }

  console.log("✅ [Google] Token refreshé avec succès");
  return data.access_token;
}

export function useGoogleCalendar(options?: Options): Result {
  const enabled = options?.enabled ?? true;
  const { getToken, saveToken } = useSessionGroup();

  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [connected, setConnected] = React.useState(false);

  const fetchEvents = React.useCallback(async () => {
    if (!enabled) {
      console.log("⏸️ [Google] Calendar désactivé");
      return;
    }

    console.log("📅 [Google] Chargement Calendar...");
    setLoading(true);
    setError(null);

    // Récupérer le token depuis le groupe de sessions
    const tokenData = await getToken("google");
    let accessToken = tokenData?.access_token;

    if (!accessToken && tokenData?.refresh_token) {
      const newToken = await refreshGoogleToken(tokenData.refresh_token);
      if (newToken) {
        // Sauvegarder le nouveau token
        await saveToken(
          "google",
          newToken,
          tokenData.refresh_token,
          new Date(Date.now() + 3600000).toISOString() // +1h
        );
        accessToken = newToken;
      }
    }

    if (!accessToken) {
      setConnected(false);
      setEvents([]);
      setLoading(false);
      setError("Google non connecté. Cliquez sur le logo Google sur la page d'accueil.");
      console.log("❌ [Google] Impossible de récupérer un access token");
      return;
    }

    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(
      timeMin
    )}&timeMax=${encodeURIComponent(timeMax)}&maxResults=50`;

    console.log("🌐 [Google] Appel API Calendar...");
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 401 && tokenData?.refresh_token) {
      console.log("🔄 [Google] Token expiré, tentative de refresh...");
      const newToken = await refreshGoogleToken(tokenData.refresh_token);
      if (newToken) {
        // Sauvegarder le nouveau token
        await saveToken(
          "google",
          newToken,
          tokenData.refresh_token,
          new Date(Date.now() + 3600000).toISOString() // +1h
        );
        return fetchEvents();
      }
    }

    if (!res.ok) {
      setEvents([]);
      setLoading(false);
      setConnected(false);
      const errorMsg = `Erreur Google Calendar (${res.status})`;
      setError(errorMsg);
      console.error("❌ [Google]", errorMsg);
      return;
    }

    setConnected(true);
    const json = await res.json();
    const items: any[] = json?.items ?? [];

    console.log(`✅ [Google] ${items.length} événements récupérés`);

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
  }, [enabled, getToken, saveToken]);

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