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

function toLocalDecimalHourFromMillis(ms: number): number {
  const d = new Date(ms);
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

async function getGoogleTokens() {
  const { data: sess } = await supabase.auth.getSession();
  const userId = sess?.session?.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("oauth_tokens")
    .select("access_token, refresh_token")
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

  if (error || !data?.access_token) return null;

  // Sauvegarder le nouveau token
  const userId = sess?.session?.user?.id;
  await supabase.from("oauth_tokens").upsert(
    {
      user_id: userId,
      provider: "google",
      access_token: data.access_token,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" }
  );

  return data.access_token;
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

    const tokens = await getGoogleTokens();
    let accessToken = tokens?.access_token;

    if (!accessToken && tokens?.refresh_token) {
      accessToken = await refreshGoogleToken(tokens.refresh_token);
    }

    if (!accessToken) {
      setWakeHour(null);
      setBedHour(null);
      setLoading(false);
      setConnected(false);
      setError("Google non connecté. Connectez Google depuis la page d'accueil.");
      return;
    }

    const end = new Date();
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    const url = `https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=${encodeURIComponent(
      start.toISOString()
    )}&endTime=${encodeURIComponent(end.toISOString())}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 401 && tokens?.refresh_token) {
      const newToken = await refreshGoogleToken(tokens.refresh_token);
      if (newToken) {
        return fetchSleep();
      }
    }

    if (!res.ok) {
      setWakeHour(null);
      setBedHour(null);
      setLoading(false);
      setConnected(false);
      setError(
        res.status === 403
          ? "Accès Google Fit refusé. Reconnectez Google avec l'accès au sommeil."
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

  return { wakeHour, bedHour, loading, error, connected, refresh: fetchSleep };
}