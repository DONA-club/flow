"use client";

import React from "react";
import { supabase } from "@/integrations/supabase/client";

type Result = {
  wakeHour: number | null;
  bedHour: number | null;
  totalSleepHours: number | null;
  loading: boolean;
  error: string | null;
  connected: boolean;
  refresh: () => void;
  getSleepForDate: (date: Date) => Promise<{ wakeHour: number | null; bedHour: number | null; totalSleepHours: number | null }>;
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

type SleepSession = {
  startMs: number;
  endMs: number;
};

async function fetchSleepSessions(accessToken: string, startDate: Date, endDate: Date): Promise<SleepSession[]> {
  const url = `https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=${encodeURIComponent(
    startDate.toISOString()
  )}&endTime=${encodeURIComponent(endDate.toISOString())}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) return [];

  const json = await res.json();
  const sessions: any[] = Array.isArray(json?.session) ? json.session : [];

  return sessions
    .filter((s) => Number(s?.activityType) === 72 && s?.startTimeMillis && s?.endTimeMillis)
    .map((s) => ({
      startMs: Number(s.startTimeMillis),
      endMs: Number(s.endTimeMillis),
    }))
    .sort((a, b) => a.startMs - b.startMs);
}

function calculateSleepForDay(sessions: SleepSession[], targetDate: Date): { 
  wakeHour: number | null; 
  bedHour: number | null; 
  totalSleepHours: number | null;
} {
  if (sessions.length === 0) {
    return { wakeHour: null, bedHour: null, totalSleepHours: null };
  }

  // Définir les limites de la journée cible (de 12h la veille à 12h le jour même)
  const dayStart = new Date(targetDate);
  dayStart.setHours(12, 0, 0, 0);
  dayStart.setDate(dayStart.getDate() - 1); // 12h la veille
  
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(12, 0, 0, 0); // 12h le jour même

  // Filtrer les sessions qui se terminent dans cette période
  const daySessions = sessions.filter(s => {
    const endTime = s.endMs;
    return endTime >= dayStart.getTime() && endTime < dayEnd.getTime();
  });

  if (daySessions.length === 0) {
    return { wakeHour: null, bedHour: null, totalSleepHours: null };
  }

  // Première heure de coucher (début de la première session)
  const firstBedHour = toLocalDecimalHourFromMillis(daySessions[0].startMs);
  
  // Dernière heure de réveil (fin de la dernière session)
  const lastWakeHour = toLocalDecimalHourFromMillis(daySessions[daySessions.length - 1].endMs);
  
  // Calculer la somme totale des heures de sommeil
  const totalSleepMs = daySessions.reduce((sum, s) => sum + (s.endMs - s.startMs), 0);
  const totalSleepHours = totalSleepMs / (1000 * 60 * 60);

  return {
    wakeHour: Number(lastWakeHour.toFixed(4)),
    bedHour: Number(firstBedHour.toFixed(4)),
    totalSleepHours: Number(totalSleepHours.toFixed(2)),
  };
}

export function useGoogleFitSleep(options?: Options): Result {
  const enabled = options?.enabled ?? true;

  const [wakeHour, setWakeHour] = React.useState<number | null>(null);
  const [bedHour, setBedHour] = React.useState<number | null>(null);
  const [totalSleepHours, setTotalSleepHours] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [connected, setConnected] = React.useState<boolean>(false);
  const [allSessions, setAllSessions] = React.useState<SleepSession[]>([]);

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
      setTotalSleepHours(null);
      setLoading(false);
      setConnected(false);
      setError("Google non connecté. Connectez Google depuis la page d'accueil.");
      return;
    }

    // Récupérer les sessions des 7 derniers jours
    const end = new Date();
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    const sessions = await fetchSleepSessions(accessToken, start, end);

    if (sessions.length === 0) {
      setWakeHour(null);
      setBedHour(null);
      setTotalSleepHours(null);
      setLoading(false);
      setConnected(true);
      setError("Aucune session de sommeil trouvée dans Google Fit.");
      return;
    }

    setConnected(true);
    setAllSessions(sessions);

    // Calculer pour aujourd'hui
    const today = new Date();
    const todaySleep = calculateSleepForDay(sessions, today);
    
    setWakeHour(todaySleep.wakeHour);
    setBedHour(todaySleep.bedHour);
    setTotalSleepHours(todaySleep.totalSleepHours);
    setLoading(false);
  }, [enabled]);

  const getSleepForDate = React.useCallback(async (date: Date) => {
    if (!enabled || allSessions.length === 0) {
      // Si pas de sessions en cache, essayer de les récupérer
      const tokens = await getGoogleTokens();
      let accessToken = tokens?.access_token;

      if (!accessToken && tokens?.refresh_token) {
        accessToken = await refreshGoogleToken(tokens.refresh_token);
      }

      if (!accessToken) {
        return { wakeHour: null, bedHour: null, totalSleepHours: null };
      }

      // Récupérer les sessions autour de la date demandée (±3 jours)
      const start = new Date(date);
      start.setDate(start.getDate() - 3);
      const end = new Date(date);
      end.setDate(end.getDate() + 3);

      const sessions = await fetchSleepSessions(accessToken, start, end);
      return calculateSleepForDay(sessions, date);
    }

    return calculateSleepForDay(allSessions, date);
  }, [enabled, allSessions]);

  React.useEffect(() => {
    if (!enabled) return;
    fetchSleep();
  }, [enabled, fetchSleep]);

  return { 
    wakeHour, 
    bedHour, 
    totalSleepHours,
    loading, 
    error, 
    connected, 
    refresh: fetchSleep,
    getSleepForDate,
  };
}