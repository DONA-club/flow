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

type MicrosoftTokens = {
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
};

async function getMicrosoftTokens(): Promise<MicrosoftTokens | null> {
  const { data: sess } = await supabase.auth.getSession();
  const userId = sess?.session?.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("oauth_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .eq("provider", "microsoft")
    .maybeSingle();

  if (error) {
    console.error("❌ Outlook Calendar: Erreur lecture tokens:", error);
    return null;
  }
  
  if (!data) return null;
  
  return {
    access_token: data.access_token ?? null,
    refresh_token: data.refresh_token ?? null,
    expires_at: data.expires_at ?? null,
  };
}

type RefreshResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

async function refreshMicrosoftToken(refreshToken: string): Promise<RefreshResponse | null> {
  const { data: sess } = await supabase.auth.getSession();
  const supaAccess = sess?.session?.access_token;
  if (!supaAccess) return null;

  const { data, error } = await supabase.functions.invoke("microsoft-token-refresh", {
    body: {
      refresh_token: refreshToken,
      scope: "https://graph.microsoft.com/Calendars.Read offline_access openid profile email",
    },
    headers: { Authorization: `Bearer ${supaAccess}` },
  });

  if (error || !data) {
    console.error("❌ Outlook Calendar: Erreur refresh token:", error);
    return null;
  }

  const payload = data as RefreshResponse;

  if (!payload.access_token) return null;

  const newExpiresAtIso = new Date(Date.now() + (payload.expires_in ?? 3600) * 1000).toISOString();
  
  const userId = sess?.session?.user?.id;
  await supabase.from("oauth_tokens").upsert(
    {
      user_id: userId!,
      provider: "microsoft",
      access_token: payload.access_token,
      refresh_token: payload.refresh_token ?? refreshToken,
      expires_at: newExpiresAtIso,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" }
  );

  return payload;
}

function isExpiredOrNear(expIso: string | null, skewMs = 60_000) {
  if (!expIso) return false;
  const exp = Date.parse(expIso);
  if (Number.isNaN(exp)) return false;
  return Date.now() + skewMs >= exp;
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

    const tokens = await getMicrosoftTokens();
    let accessToken = tokens?.access_token ?? null;
    let refreshToken = tokens?.refresh_token ?? null;

    if (refreshToken && (!accessToken || isExpiredOrNear(tokens?.expires_at ?? null))) {
      const refreshed = await refreshMicrosoftToken(refreshToken);
      if (refreshed?.access_token) {
        accessToken = refreshed.access_token;
        refreshToken = refreshed.refresh_token ?? refreshToken;
      }
    }

    if (!accessToken) {
      setConnected(false);
      setEvents([]);
      setLoading(false);
      setError("Microsoft non connecté. Connectez Microsoft depuis la page d'accueil.");
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
      "&$select=subject,organizer,start,end,location,webLink,body,onlineMeeting";

    async function runGraphCall(tryRefreshOn401: boolean) {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      if (res.status === 401 && tryRefreshOn401 && refreshToken) {
        const refreshed = await refreshMicrosoftToken(refreshToken);
        if (refreshed?.access_token) {
          accessToken = refreshed.access_token;
          const retryRes = await fetch(url, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          });
          return retryRes;
        }
      }

      return res;
    }

    const res = await runGraphCall(true);

    if (!res.ok) {
      setEvents([]);
      setLoading(false);
      setConnected(false);

      let errMsg = `Erreur Outlook (${res.status})`;
      try {
        const json = await res.json();
        if (json?.error) {
          errMsg += `: ${typeof json.error === "string" ? json.error : JSON.stringify(json.error)}`;
        }
      } catch {
        // ignore parse error
      }
      setError(errMsg);
      console.error("❌ Outlook Calendar:", errMsg);
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

  return {
    events,
    loading,
    error,
    connected,
    refresh: fetchEvents,
  };
}