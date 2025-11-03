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

async function refreshMicrosoftToken(refreshToken: string) {
  console.log("🔄 [Microsoft] Tentative de refresh du token...");
  
  const { data: sess } = await supabase.auth.getSession();
  const supaAccess = sess?.session?.access_token;
  if (!supaAccess) {
    console.error("❌ [Microsoft] Pas de token Supabase pour appeler la fonction edge");
    return null;
  }

  const { data, error } = await supabase.functions.invoke("microsoft-token-refresh", {
    body: {
      refresh_token: refreshToken,
      scope: "Calendars.Read offline_access openid profile email",
    },
    headers: { Authorization: `Bearer ${supaAccess}` },
  });

  if (error || !data) {
    console.error("❌ [Microsoft] Erreur refresh token:", error);
    return null;
  }

  const newAccessToken = data.access_token;
  if (!newAccessToken) {
    console.error("❌ [Microsoft] Pas de nouveau token dans la réponse");
    return null;
  }

  console.log("✅ [Microsoft] Token refreshé avec succès");
  return newAccessToken;
}

export function useOutlookCalendar(options?: Options): Result {
  const enabled = options?.enabled ?? true;
  const { getToken, saveToken } = useSessionGroup();

  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [connected, setConnected] = React.useState(false);

  const fetchEvents = React.useCallback(async () => {
    if (!enabled) {
      console.log("⏸️ [Microsoft] Calendar désactivé");
      return;
    }

    console.log("📅 [Microsoft] Chargement Calendar...");
    setLoading(true);
    setError(null);

    // Récupérer le token depuis le groupe de sessions
    const tokenData = await getToken("microsoft");
    let accessToken = tokenData?.access_token ?? null;

    if (!accessToken && tokenData?.refresh_token) {
      const newToken = await refreshMicrosoftToken(tokenData.refresh_token);
      if (newToken) {
        // Sauvegarder le nouveau token
        await saveToken(
          "microsoft",
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
      setError("Microsoft non connecté. Connectez Microsoft depuis la page d'accueil.");
      console.log("❌ [Microsoft] Impossible de récupérer un access token");
      return;
    }

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

    console.log("🌐 [Microsoft] Appel API Graph...");
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    // Si expiré, tenter un refresh puis relancer
    if (res.status === 401 && tokenData?.refresh_token) {
      console.log("🔄 [Microsoft] Token expiré, tentative de refresh...");
      const newToken = await refreshMicrosoftToken(tokenData.refresh_token);
      if (newToken) {
        // Sauvegarder le nouveau token
        await saveToken(
          "microsoft",
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
      const errorMsg = `Erreur Outlook (${res.status})`;
      setError(errorMsg);
      console.error("❌ [Microsoft]", errorMsg);
      return;
    }

    setConnected(true);
    const json = await res.json();
    const items: any[] = json?.value ?? [];

    console.log(`✅ [Microsoft] ${items.length} événements récupérés`);

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
  }, [enabled, getToken, saveToken]);

  React.useEffect(() => {
    if (!enabled) return;
    fetchEvents();
  }, [enabled, fetchEvents]);

  return {
    events,
    loading,
    error,
    connected,
    refresh: fetchEvents,
  };
}