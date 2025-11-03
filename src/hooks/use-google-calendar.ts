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

type GoogleTokens = {
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
};

async function getGoogleTokens(): Promise<GoogleTokens | null> {
  const { data: sess } = await supabase.auth.getSession();
  const userId = sess?.session?.user?.id;
  if (!userId) {
    console.log("❌ Google Calendar: Pas d'utilisateur connecté");
    return null;
  }

  // IMPORTANT: Lire UNIQUEMENT depuis oauth_tokens, jamais depuis la session
  const { data, error } = await supabase
    .from("oauth_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .eq("provider", "google")
    .maybeSingle();

  if (error) {
    console.error("❌ Google Calendar: Erreur lecture tokens:", error);
    return null;
  }
  
  if (!data) {
    console.log("⚠️ Google Calendar: Aucun token trouvé dans oauth_tokens");
    return null;
  }

  console.log("✅ Google Calendar: Tokens trouvés dans oauth_tokens:", { 
    hasAccess: !!data.access_token, 
    hasRefresh: !!data.refresh_token,
    expires_at: data.expires_at
  });
  
  return {
    access_token: data.access_token ?? null,
    refresh_token: data.refresh_token ?? null,
    expires_at: data.expires_at ?? null,
  };
}

type RefreshResponse = {
  access_token: string;
  expires_in: number;
  scope?: string;
  token_type?: string;
};

function isExpiredOrNear(expIso: string | null, skewMs = 60_000) {
  if (!expIso) return false;
  const exp = Date.parse(expIso);
  if (Number.isNaN(exp)) return false;
  return Date.now() + skewMs >= exp;
}

async function refreshGoogleToken(refreshToken: string): Promise<RefreshResponse | null> {
  console.log("🔄 Google Calendar: Tentative de refresh du token...");
  
  const { data: sess } = await supabase.auth.getSession();
  const supaAccess = sess?.session?.access_token;
  if (!supaAccess) {
    console.error("❌ Google Calendar: Pas de token Supabase pour appeler la fonction edge");
    return null;
  }

  const { data, error } = await supabase.functions.invoke("google-token-refresh", {
    body: { refresh_token: refreshToken },
    headers: { Authorization: `Bearer ${supaAccess}` },
  });

  if (error || !data) {
    console.error("❌ Google Calendar: Erreur refresh token:", error, data);
    return null;
  }
  
  const payload = data as RefreshResponse;

  if (!payload?.access_token) {
    console.error("❌ Google Calendar: Pas de nouveau token dans la réponse");
    return null;
  }

  const newExpiresAtIso = new Date(Date.now() + (payload.expires_in ?? 3600) * 1000).toISOString();

  console.log("✅ Google Calendar: Token refreshé avec succès (nouvelle expiration):", newExpiresAtIso);
  
  const userId = sess?.session?.user?.id;
  await supabase.from("oauth_tokens").upsert(
    {
      user_id: userId!,
      provider: "google",
      access_token: payload.access_token,
      expires_at: newExpiresAtIso,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" }
  );

  return payload;
}

export function useGoogleCalendar(options?: Options): Result {
  const enabled = options?.enabled ?? true;

  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [connected, setConnected] = React.useState(false);

  const fetchEvents = React.useCallback(async () => {
    if (!enabled) {
      console.log("⏸️ Google Calendar: Désactivé");
      return;
    }

    console.log("📅 Google Calendar: Chargement...");
    setLoading(true);
    setError(null);

    const tokens = await getGoogleTokens();
    let accessToken = tokens?.access_token ?? null;
    let refreshToken = tokens?.refresh_token ?? null;

    // Refresh proactif si token expiré ou proche de l'expiration
    if (refreshToken && (!accessToken || isExpiredOrNear(tokens?.expires_at ?? null))) {
      const refreshed = await refreshGoogleToken(refreshToken);
      if (refreshed?.access_token) {
        accessToken = refreshed.access_token;
      }
    }

    if (!accessToken) {
      setConnected(false);
      setEvents([]);
      setLoading(false);
      setError("Google non connecté. Cliquez sur le logo Google sur la page d'accueil.");
      console.log("❌ Google Calendar: Impossible de récupérer un access token");
      return;
    }

    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(
      timeMin
    )}&timeMax=${encodeURIComponent(timeMax)}&maxResults=50`;

    async function runGoogleCall(tryRefreshOn401: boolean) {
      console.log("🌐 Google Calendar: Appel API...");
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.status === 401 && tryRefreshOn401 && refreshToken) {
        console.log("🔄 Google Calendar: 401 détecté, tentative de refresh et retry...");
        const refreshed = await refreshGoogleToken(refreshToken);
        if (refreshed?.access_token) {
          accessToken = refreshed.access_token;
          const retryRes = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          return retryRes;
        }
      }

      return res;
    }

    const res = await runGoogleCall(true);

    if (!res.ok) {
      setEvents([]);
      setLoading(false);
      setConnected(false);
      const errorMsg = `Erreur Google Calendar (${res.status})`;
      setError(errorMsg);
      console.error("❌ Google Calendar:", errorMsg);
      return;
    }

    setConnected(true);
    const json = await res.json();
    const items: any[] = json?.items ?? [];

    console.log(`✅ Google Calendar: ${items.length} événements récupérés`);

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