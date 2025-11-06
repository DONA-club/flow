"use client";

import React from "react";
import { supabase } from "@/integrations/supabase/client";

type SleepSession = {
  bedHour: number;
  wakeHour: number;
};

type SleepDebtOrCapital = {
  type: "capital" | "debt";
  hours: number;
  daysCount: number;
};

type Result = {
  wakeHour: number | null;
  bedHour: number | null;
  totalSleepHours: number | null;
  sleepSessions: SleepSession[] | null;
  sleepDebtOrCapital: SleepDebtOrCapital | null;
  idealBedHour: number | null;
  loading: boolean;
  error: string | null;
  connected: boolean;
  refresh: () => void;
  getSleepForDate: (date: Date) => Promise<{ 
    wakeHour: number | null; 
    bedHour: number | null; 
    totalSleepHours: number | null;
    sleepSessions: SleepSession[] | null;
  }>;
  getDebtOrCapitalForDate: (date: Date) => Promise<SleepDebtOrCapital | null>;
};

type Options = {
  enabled?: boolean;
};

const RECOMMENDED_SLEEP_HOURS = 9;

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

async function clearInvalidGoogleTokens() {
  const { data: sess } = await supabase.auth.getSession();
  const userId = sess?.session?.user?.id;
  if (!userId) return;

  await supabase
    .from("oauth_tokens")
    .delete()
    .eq("user_id", userId)
    .eq("provider", "google");
}

type RawSleepSession = {
  startMs: number;
  endMs: number;
};

async function fetchSleepSessions(accessToken: string, startDate: Date, endDate: Date): Promise<RawSleepSession[]> {
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

function calculateSleepForDay(sessions: RawSleepSession[], targetDate: Date): { 
  wakeHour: number | null; 
  bedHour: number | null; 
  totalSleepHours: number | null;
  sleepSessions: SleepSession[] | null;
} {
  if (sessions.length === 0) {
    return { wakeHour: null, bedHour: null, totalSleepHours: null, sleepSessions: null };
  }

  const dayStart = new Date(targetDate);
  dayStart.setHours(12, 0, 0, 0);
  dayStart.setDate(dayStart.getDate() - 1);
  
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(12, 0, 0, 0);

  const daySessions = sessions.filter(s => {
    const endTime = s.endMs;
    return endTime >= dayStart.getTime() && endTime < dayEnd.getTime();
  });

  if (daySessions.length === 0) {
    return { wakeHour: null, bedHour: null, totalSleepHours: null, sleepSessions: null };
  }

  const firstBedHour = toLocalDecimalHourFromMillis(daySessions[0].startMs);
  const lastWakeHour = toLocalDecimalHourFromMillis(daySessions[daySessions.length - 1].endMs);
  const totalSleepMs = daySessions.reduce((sum, s) => sum + (s.endMs - s.startMs), 0);
  const totalSleepHours = totalSleepMs / (1000 * 60 * 60);

  const sleepSessions: SleepSession[] = daySessions.map(s => ({
    bedHour: Number(toLocalDecimalHourFromMillis(s.startMs).toFixed(4)),
    wakeHour: Number(toLocalDecimalHourFromMillis(s.endMs).toFixed(4)),
  }));

  return {
    wakeHour: Number(lastWakeHour.toFixed(4)),
    bedHour: Number(firstBedHour.toFixed(4)),
    totalSleepHours: Number(totalSleepHours.toFixed(2)),
    sleepSessions,
  };
}

function calculateSleepDebtOrCapitalForDate(sessions: RawSleepSession[], referenceDate: Date): SleepDebtOrCapital | null {
  const daysData: number[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const refDay = new Date(referenceDate);
  refDay.setHours(0, 0, 0, 0);
  
  const maxDate = refDay.getTime() > now.getTime() ? now : refDay;
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(maxDate);
    date.setDate(date.getDate() - i);
    
    const dayData = calculateSleepForDay(sessions, date);
    if (dayData.totalSleepHours !== null) {
      daysData.push(dayData.totalSleepHours);
    }
  }

  if (daysData.length === 0) return null;

  const average = daysData.reduce((sum, h) => sum + h, 0) / daysData.length;

  if (average >= RECOMMENDED_SLEEP_HOURS) {
    const capital = daysData.reduce((sum, h) => sum + Math.max(0, h - RECOMMENDED_SLEEP_HOURS), 0);
    return { type: "capital", hours: Number(capital.toFixed(2)), daysCount: daysData.length };
  } else {
    const debt = daysData.reduce((sum, h) => sum + Math.max(0, RECOMMENDED_SLEEP_HOURS - h), 0);
    return { type: "debt", hours: Number(debt.toFixed(2)), daysCount: daysData.length };
  }
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function useGoogleFitSleep(options?: Options): Result {
  const enabled = options?.enabled ?? true;

  const [wakeHour, setWakeHour] = React.useState<number | null>(null);
  const [bedHour, setBedHour] = React.useState<number | null>(null);
  const [totalSleepHours, setTotalSleepHours] = React.useState<number | null>(null);
  const [sleepSessions, setSleepSessions] = React.useState<SleepSession[] | null>(null);
  const [sleepDebtOrCapital, setSleepDebtOrCapital] = React.useState<SleepDebtOrCapital | null>(null);
  const [idealBedHour, setIdealBedHour] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [connected, setConnected] = React.useState<boolean>(false);
  const [allSessions, setAllSessions] = React.useState<RawSleepSession[]>([]);

  const fetchSleep = React.useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    window.dispatchEvent(new CustomEvent("app-log", { 
      detail: { message: "Récupération données sommeil Google Fit...", type: "info" } 
    }));

    const tokens = await getGoogleTokens();
    let accessToken = tokens?.access_token;

    if (!accessToken && tokens?.refresh_token) {
      accessToken = await refreshGoogleToken(tokens.refresh_token);
      if (!accessToken) {
        await clearInvalidGoogleTokens();
        setWakeHour(null);
        setBedHour(null);
        setTotalSleepHours(null);
        setSleepSessions(null);
        setSleepDebtOrCapital(null);
        setIdealBedHour(null);
        setLoading(false);
        setConnected(false);
        setError("Google non connecté. Veuillez reconnecter votre compte Google.");
        return;
      }
    }

    if (!accessToken) {
      setWakeHour(null);
      setBedHour(null);
      setTotalSleepHours(null);
      setSleepSessions(null);
      setSleepDebtOrCapital(null);
      setIdealBedHour(null);
      setLoading(false);
      setConnected(false);
      setError("Google non connecté. Connectez Google depuis la page d'accueil.");
      return;
    }

    const end = new Date();
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    const sessions = await fetchSleepSessions(accessToken, start, end);

    if (sessions.length === 0) {
      setWakeHour(null);
      setBedHour(null);
      setTotalSleepHours(null);
      setSleepSessions(null);
      setSleepDebtOrCapital(null);
      setIdealBedHour(null);
      setLoading(false);
      setConnected(true);
      setError("Aucune session de sommeil trouvée dans Google Fit.");
      return;
    }

    setConnected(true);
    setAllSessions(sessions);

    const today = new Date();
    const todaySleep = calculateSleepForDay(sessions, today);
    
    setWakeHour(todaySleep.wakeHour);
    setBedHour(todaySleep.bedHour);
    setTotalSleepHours(todaySleep.totalSleepHours);
    setSleepSessions(todaySleep.sleepSessions);

    const debtOrCapital = calculateSleepDebtOrCapitalForDate(sessions, today);
    setSleepDebtOrCapital(debtOrCapital);

    // Calcul heure idéale de coucher : première heure de coucher - (9h - somme des périodes de sommeil)
    if (todaySleep.bedHour !== null && todaySleep.totalSleepHours !== null) {
      const missingSleep = Math.max(0, RECOMMENDED_SLEEP_HOURS - todaySleep.totalSleepHours);
      const ideal = (todaySleep.bedHour - missingSleep + 24) % 24;
      setIdealBedHour(Number(ideal.toFixed(4)));
    } else {
      setIdealBedHour(null);
    }

    setLoading(false);
  }, [enabled]);

  const getSleepForDate = React.useCallback(async (date: Date) => {
    if (!enabled || allSessions.length === 0) {
      const tokens = await getGoogleTokens();
      let accessToken = tokens?.access_token;

      if (!accessToken && tokens?.refresh_token) {
        accessToken = await refreshGoogleToken(tokens.refresh_token);
      }

      if (!accessToken) {
        return { wakeHour: null, bedHour: null, totalSleepHours: null, sleepSessions: null };
      }

      const start = new Date(date);
      start.setDate(start.getDate() - 3);
      const end = new Date(date);
      end.setDate(end.getDate() + 3);

      const sessions = await fetchSleepSessions(accessToken, start, end);
      const result = calculateSleepForDay(sessions, date);
      
      return result;
    }

    const result = calculateSleepForDay(allSessions, date);
    return result;
  }, [enabled, allSessions]);

  const getDebtOrCapitalForDate = React.useCallback(async (date: Date) => {
    if (!enabled || allSessions.length === 0) {
      const tokens = await getGoogleTokens();
      let accessToken = tokens?.access_token;

      if (!accessToken && tokens?.refresh_token) {
        accessToken = await refreshGoogleToken(tokens.refresh_token);
      }

      if (!accessToken) {
        return null;
      }

      const end = new Date(date);
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

      const sessions = await fetchSleepSessions(accessToken, start, end);
      return calculateSleepDebtOrCapitalForDate(sessions, date);
    }

    return calculateSleepDebtOrCapitalForDate(allSessions, date);
  }, [enabled, allSessions]);

  React.useEffect(() => {
    if (!enabled) return;
    fetchSleep();
  }, [enabled, fetchSleep]);

  return { 
    wakeHour, 
    bedHour, 
    totalSleepHours,
    sleepSessions,
    sleepDebtOrCapital,
    idealBedHour,
    loading, 
    error, 
    connected, 
    refresh: fetchSleep,
    getSleepForDate,
    getDebtOrCapitalForDate,
  };
}