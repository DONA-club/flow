"use client";

import React from "react";
import { supabase } from "@/integrations/supabase/client";

type Result = {
  wakeHour: number | null; // heure décimale locale (0-24)
  bedHour: number | null;  // heure décimale locale (0-24) estimée pour ce soir
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

async function getGoogleAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const session: any = data?.session ?? null;

  // IMPORTANT: ne plus utiliser session.provider_token (peut être celui d’un autre provider)
  const identities: any[] = session?.user?.identities ?? [];
  const googleIdentity = identities.find((i) => i?.provider === "google");
  const fromIdentities: string | null = googleIdentity?.identity_data?.access_token ?? null;
  return fromIdentities || null;
}

async function getGoogleRefreshToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const session: any = data?.session ?? null;

  // IMPORTANT: ne plus utiliser session.provider_refresh_token
  const identities: any[] = session?.user?.identities ?? [];
  const googleIdentity = identities.find((i) => i?.provider === "google");
  const fromIdentities: string | null = googleIdentity?.identity_data?.refresh_token ?? null;
  return fromIdentities || null;
}

async function refreshAccessTokenViaEdge(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const session: any = data?.session ?? null;
  const refreshToken = await getGoogleRefreshToken();
  const supaAccess = session?.access_token;

  if (!refreshToken) {
    return null;
  }
  if (!supaAccess) {
    return null;
  }

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

    // Fenêtre: les 7 derniers jours
    const end = new Date();
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    const url = `https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=${encodeURIComponent(
      start.toISOString()
    )}&endTime=${encodeURIComponent(end.toISOString())}`;

    let token = await getGoogleAccessToken();
    if (!token) {
      const refreshed = await refreshAccessTokenViaEdge();
      if (refreshed) {
        token = refreshed;
        setConnected(true);
      } else {
        setWakeHour(null);
        setBedHour(null);
        setLoading(false);
        setConnected(false);
        setError("Autorisation Google Fit manquante/expirée. Reconnectez Google avec l’accès Sommeil.");
        return;
      }
    } else {
      setConnected(true);
    }

    const doFetch = async (tkn: string) => {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${tkn}` },
      });
      return res;
    };

    let res = await doFetch(token);
    if (!res.ok && (res.status === 401 || res.status === 403)) {
      const refreshed = await refreshAccessTokenViaEdge();
      if (refreshed) {
        token = refreshed;
        setConnected(true);
        res = await doFetch(token);
      } else {
        // Évite les appels refresh 400 en boucle
        setWakeHour(null);
        setBedHour(null);
        setLoading(false);
        setConnected(false);
        setError("Session Google expirée et refresh indisponible. Cliquez sur Google pour re-consentir (offline).");
        return;
      }
    }

    if (!res.ok) {
      setWakeHour(null);
      setBedHour(null);
      setLoading(false);
      setError(
        res.status === 403
          ? "Accès Google Fit refusé. Autorisez l’accès au sommeil et réessayez."
          : `Erreur Google Fit (${res.status})`
      );
      return;
    }

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