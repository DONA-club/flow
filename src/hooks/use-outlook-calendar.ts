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

async function getMicrosoftTokens() {
  const { data: sess } = await supabase.auth.getSession();
  const userId = sess?.session?.user?.id;
  if (!userId) {
    console.log("❌ Pas d'utilisateur connecté");
    return null;
  }

  const { data, error } = await supabase
    .from("oauth_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .eq("provider", "microsoft")
    .maybeSingle();

  if (error) {
    console.error("❌ Erreur lecture tokens Microsoft:", error);
    return null;
  }
  
  if (!data) {
    console.log("⚠️ Aucun token Microsoft trouvé dans oauth_tokens");
    return null;
  }

  console.log("✅ Tokens Microsoft trouvés:", { 
    hasAccess: !!data.access_token, 
    hasRefresh: !!data.refresh_token 
  });
  
  return data;
}

async function refreshMicrosoftToken(refreshToken: string) {
  console.log("🔄 Tentative de refresh du token Microsoft...");
  
  const { data: sess } = await supabase.auth.getSession();
  const supaAccess = sess?.session?.access_token;
  if (!supaAccess) {
    console.error("❌ Pas de token Supabase pour appeler la fonction edge");
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
    console.error("❌ Erreur refresh token Microsoft:", error);
    return null;
  }

  const newAccessToken = data.access_token;
  if (!newAccessToken) {
    console.error("❌ Pas de nouveau token dans la réponse");
    return null;
  }

  console.log("✅ Token Microsoft refreshé avec succès");
  
  // Sauvegarder le nouveau token
  const userId = sess?.session?.user?.id;
  await supabase.from("oauth_tokens").upsert(
    {
      user_id: userId,
      provider: "microsoft",
      access_token: newAccessToken,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" }
  );

  return newAccessToken;
}

export function useOutlookCalendar(options?: Options): Result {
  const enabled = options?.enabled ?? true;

  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [connected, setConnected] = React.useState(false);

  const fetchEvents = React.useCallback(async () => {
    if (!enabled) {
      console.log("⏸️ Microsoft Calendar désactivé");
      return;
    }

    console.log("📅 Chargement Microsoft Calendar...");
    setLoading(true);
    setError(null);

    const tokens = await getMicrosoftTokens();
    let accessToken = tokens?.access_token ?? null;

    if (!accessToken && tokens?.refresh_token) {
      accessToken = await refreshMicrosoftToken(tokens.refresh_token);
    }

    if (!accessToken) {
      setConnected(false);
      setEvents([]);
      setLoading(false);
      setError("Microsoft non connecté. Connectez Microsoft depuis la page d'accueil.");
      console.log("❌ Impossible de récupérer un access token Microsoft");
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

    console.log("🌐 Appel API Microsoft Graph...");
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (res.status === 401 && tokens?.refresh_token) {
      console.log("🔄 Token expiré, tentative de refresh...");
      const newToken = await refreshMicrosoftToken(tokens.refresh_token);
      if (newToken) {
        return fetchEvents();
      }
    }

    if (!res.ok) {
      setEvents([]);
      setLoading(false);
      setConnected(false);
      const errorMsg = `Erreur Outlook (${res.status})`;
      setError(errorMsg);
      console.error("❌", errorMsg);
      return;
    }

    setConnected(true);
    const json = await res.json();
    const items: any[] = json?.value ?? [];

    console.log(`✅ ${items.length} événements Microsoft récupérés`);

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

  return {
    events,
    loading,
    error,
    connected,
    refresh: fetchEvents,
  };
}