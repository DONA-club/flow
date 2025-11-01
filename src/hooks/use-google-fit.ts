"use client";

import React from "react";
import { supabase } from "@/integrations/supabase/client";

type Result = {
  wakeHour: number | null;
  bedHour: number | null;
  loading: boolean;
  error: string | null;
  connected: boolean;
  refresh: () => void;
};

type Options = {
  enabled?: boolean;
};

type TokenRow = {
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
};

function toLocalDecimalHourFromMillis(ms: number): number {
  const d = new Date(ms);
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

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

export function useGoogleFitSleep(options?: Options): Result {
  const enabled = options?.enabled ?? true;

  const [wakeHour, setWakeHour] = React.useState<number | null>(null);
  const [bedHour, setBedHour] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [connected, setConnected] = React.useState<boolean>(false);

  const fetchSleep = React.useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    const { data: s } = await supabase.auth.getSession();
    const supaAccess = (s?.session as any)?.access_token ?? null;

    let tokens = await getSavedGoogleTokens();
    let token = tokens?.access_token ?? null;

    if (!token && tokens?.refresh_token && supaAccess) {
      const refreshed = await refreshAccessTokenViaEdge(tokens.refresh_token, supaAccess);
      if (refreshed) {
        token = refreshed;
        setConnected(true);
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
      setWakeHour(null);
      setBedHour(null);
      setLoading(false);
      setConnected(false);
      setError("Autorisation Google Fit manquante/expirée. Reconnecte Google avec l’accès Sommeil.");
      return;
    }

    // Fenêtre: les 7 derniers jours
    const end = new Date();
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    const url = `https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=${encodeURIComponent(
      start.toISOString()
    )}&endTime=${encodeURIComponent(end.toISOString())}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      setWakeHour(null);
      setBedHour(null);
      setLoading(false);
      setConnected(false);
      setError(
        res.status === 403
          ? "Accès Google Fit refusé. Autorise l’accès au sommeil et réessaye."
          : `Erreur Google Fit (${res.status})`
      );
      return;
    }

    setConnected(true);
    const json = await res.json();
    const sessions: any[] = Array.isArray(json?.session) ? json.session : [];

    const sleepSessions = sessions
      .filter((s) => Number(s?.activityType) === 72 && s?.startTimeMillis && s?.endTimeMillis)
      .map((s) => ({
        startMs: Number(s.startTimeMillis),
        endMs: Number(s.endTimeMillis),
      }))
      .sort((a, b) => a.endMs - b.endMs);

    if (sleepSessions.length === 0) {
      setWakeHour(null);
      setBedHour(null);
      setLoading(false);
      setError("Aucune session de sommeil trouvée dans Google Fit.");
      return;
    }

    const last = sleepSessions[sleepSessions.length - 1];
    const lastStartHour = toLocalDecimalHourFromMillis(last.startMs);
    const lastEndHour = toLocalDecimalHourFromMillis(last.endMs);

    setWakeHour(Number(lastEndHour.toFixed(4)));
    setBedHour(Number(lastStartHour.toFixed(4)));
    setLoading(false);
  }, [enabled]);

  React.useEffect(() => {
    if (!enabled) return;
    fetchSleep();
  }, [enabled, fetchSleep]);

  React.useEffect(() => {
    if (!enabled) return;
    const { data } = supabase.auth.onAuthStateChange(() => {
      fetchSleep();
    });
    return () => data.subscription.unsubscribe();
  }, [enabled, fetchSleep]);

  return { wakeHour, bedHour, loading, error, connected, refresh: fetchSleep };
}