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

function looksLikeGoogleToken(token: string | null): boolean {
  return !!token && token.startsWith("ya29.");
}

async function getGoogleTokens() {
  const { data: sess } = await supabase.auth.getSession();
  const session = sess?.session;
  const userId = session?.user?.id;
  if (!userId) {
    console.log("❌ Pas d'utilisateur connecté");
    return null;
  }

  // 1) Essayer la table oauth_tokens
  const { data, error } = await supabase
    .from("oauth_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .eq("provider", "google")
    .maybeSingle();

  if (!error && data) {
    console.log("✅ Tokens Google trouvés:", { hasAccess: !!data.access_token, hasRefresh: !!data.refresh_token });
    return data;
  }

  // 2) Fallback: si pas encore enregistré, tenter d'utiliser le provider_token de la session
  const accessFromSession = session?.provider_token ?? null;
  const refreshFromSession = session?.provider_refresh_token ?? null;

  // Vérifier que l'utilisateur a bien une identité Google liée
  const identities = session?.user?.identities || [];
  const hasGoogleIdentity = identities.some((i: any) => i.provider === "google");

  if (!hasGoogleIdentity) {
    console.log("⚠️ Aucune identité Google liée au compte.");
    return null;
  }

  // Si le token de session ressemble à Google, l'enregistrer pour activer le flux
  if (looksLikeGoogleToken(accessFromSession)) {
    const expiresAtUnix = session?.expires_at ?? null;
    const expiresAtIso = expiresAtUnix ? new Date(expiresAtUnix * 1000).toISOString() : null;

    const { error: upsertErr } = await supabase.from("oauth_tokens").upsert(
      {
        user_id: userId,
        provider: "google",
        access_token: accessFromSession!,
        refresh_token: refreshFromSession ?? undefined,
        expires_at: expiresAtIso,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" }
    );

    if (upsertErr) {
      console.error("❌ Erreur enregistrement token Google depuis la session:", upsertErr);
      return null;
    }

    console.log("✅ Token Google enregistré depuis la session");
    return {
      access_token: accessFromSession!,
      refresh_token: refreshFromSession ?? null,
      expires_at: expiresAtIso,
    } as any;
  }

  console.log("⚠️ Aucun token Google dans oauth_tokens et le provider_token de session ne ressemble pas à Google.");
  return null;
}

async function refreshGoogleToken(refreshToken: string) {
  console.log("🔄 Tentative de refresh du token Google...");
  
  const { data: sess } = await supabase.auth.getSession();
  const session = sess?.session;
  const supaAccess = session?.access_token;
  if (!supaAccess) {
    console.error("❌ Pas de token Supabase pour appeler la fonction edge");
    return null;
  }

  const { data, error } = await supabase.functions.invoke("google-token-refresh", {
    body: { refresh_token: refreshToken },
    headers: { Authorization: `Bearer ${supaAccess}` },
  });

  if (error) {
    console.error("❌ Erreur refresh token Google:", error);
    return null;
  }
  
  if (!data?.access_token) {
    console.error("❌ Pas de nouveau token dans la réponse");
    return null;
  }

  console.log("✅ Token Google refreshé avec succès");
  
  // Sauvegarder le nouveau token
  const userId = session?.user?.id;
  await supabase.from("oauth_tokens").upsert(
    {
      user_id: userId,
      provider: "google",
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? undefined,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" }
  );

  return data.access_token;
}

export function useGoogleCalendar(options?: Options): Result {
  const enabled = options?.enabled ?? true;

  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [connected, setConnected] = React.useState(false);

  const fetchEvents = React.useCallback(async () => {
    if (!enabled) {
      console.log("⏸️ Google Calendar désactivé");
      return;
    }

    console.log("📅 Chargement Google Calendar...");
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
      setError("Google non connecté. Cliquez sur le logo Google sur la page d'accueil.");
      console.log("❌ Impossible de récupérer un access token Google");
      return;
    }

    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(
      timeMin
    )}&timeMax=${encodeURIComponent(timeMax)}&maxResults=50`;

    console.log("🌐 Appel API Google Calendar...");
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 401 && tokens?.refresh_token) {
      console.log("🔄 Token expiré, tentative de refresh...");
      const newToken = await refreshGoogleToken(tokens.refresh_token);
      if (newToken) {
        return fetchEvents();
      }
    }

    if (!res.ok) {
      setEvents([]);
      setLoading(false);
      setConnected(false);
      const errorMsg = `Erreur Google Calendar (${res.status})`;
      setError(errorMsg);
      console.error("❌", errorMsg);
      return;
    }

    setConnected(true);
    const json = await res.json();
    const items: any[] = json?.items ?? [];

    console.log(`✅ ${items.length} événements Google récupérés`);

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