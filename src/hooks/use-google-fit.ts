"use client";

import React from "react";
import { supabase } from "@/integrations/supabase/client";

type Result = {
  wakeHour: number | null; // heure décimale locale (0-24)
  bedHour: number | null;  // heure décimale locale (0-24) estimée pour ce soir (basée sur la dernière session)
  loading: boolean;
  error: string | null;
  connected: boolean;
  refresh: () => void;
};

function toLocalDecimalHourFromMillis(ms: number): number {
  const d = new Date(ms);
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

async function getGoogleAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const session: any = data?.session ?? null;
  const fromProviderToken: string | null = session?.provider_token ?? null;
  if (fromProviderToken) return fromProviderToken;

  const identities: any[] = session?.user?.identities ?? [];
  const googleIdentity = identities.find((i) => i?.provider === "google");
  const fromIdentities: string | null = googleIdentity?.identity_data?.access_token ?? null;
  return fromIdentities || null;
}

export function useGoogleFitSleep(): Result {
  const [wakeHour, setWakeHour] = React.useState<number | null>(null);
  const [bedHour, setBedHour] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [connected, setConnected] = React.useState<boolean>(false);

  const fetchSleep = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    const token = await getGoogleAccessToken();
    setConnected(!!token);

    if (!token) {
      setWakeHour(null);
      setBedHour(null);
      setLoading(false);
      setError("Autorisation Google Fit manquante. Reconnectez Google avec l’accès Sommeil.");
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
      setError(
        res.status === 403
          ? "Accès Google Fit refusé. Autorisez l’accès au sommeil et réessayez."
          : `Erreur Google Fit (${res.status})`
      );
      return;
    }

    const json = await res.json();
    const sessions: any[] = Array.isArray(json?.session) ? json.session : [];

    // Filtre sessions de sommeil (activityType 72)
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

    // On prend la dernière session complétée (la plus récente)
    const last = sleepSessions[sleepSessions.length - 1];
    const lastStartHour = toLocalDecimalHourFromMillis(last.startMs);
    const lastEndHour = toLocalDecimalHourFromMillis(last.endMs);

    // Heures locales décimales:
    // - wakeHour = heure de fin de la dernière session (lever)
    // - bedHour = heure de début de la dernière session, projetée pour ce soir (même heure)
    //   (simple estimation: heure de coucher typique basée sur la veille)
    setWakeHour(Number(lastEndHour.toFixed(4)));
    setBedHour(Number(lastStartHour.toFixed(4)));
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchSleep();
  }, [fetchSleep]);

  React.useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(() => {
      fetchSleep();
    });
    return () => data.subscription.unsubscribe();
  }, [fetchSleep]);

  return { wakeHour, bedHour, loading, error, connected, refresh: fetchSleep };
}