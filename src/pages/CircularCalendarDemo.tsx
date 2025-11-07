import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import { CircularCalendar } from "@/components/CircularCalendar";
import { useSunTimes } from "@/hooks/use-sun-times";
import ChatInterface from "@/components/ChatInterface";
import ChatkitWidget from "@/components/ChatkitWidget";
import { useGoogleCalendar } from "@/hooks/use-google-calendar";
import { useOutlookCalendar } from "@/hooks/use-outlook-calendar";
import { useGoogleFitSleep } from "@/hooks/use-google-fit";
import FontLoader from "@/components/FontLoader";
import UpcomingEventsList from "@/components/UpcomingEventsList";
import { useMultiProviderAuth } from "@/hooks/use-multi-provider-auth";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_SUNRISE = 6.0;
const DEFAULT_SUNSET = 21.0;
const GOLDEN_RATIO = 1.618;

function useGoldenCircleSize() {
  const [size, setSize] = useState(320);

  useEffect(() => {
    function updateSize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      
      if (w <= 640) {
        setSize(Math.floor(w * 0.92));
        return;
      }
      
      const minDim = Math.min(w, h);
      const available = minDim - 32;
      const golden = Math.floor(available / GOLDEN_RATIO);
      setSize(Math.max(180, Math.min(golden, 600)));
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return size;
}

type CalendarEvent = {
  title: string;
  place: string;
  start: number;
  end: number;
  url?: string;
  raw?: any;
};

type SleepSession = {
  bedHour: number;
  wakeHour: number;
};

type SleepDebtOrCapital = {
  type: "capital" | "debt";
  hours: number;
  daysCount: number;
};

function toHourDecimal(iso: string): number {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(date: Date, includeYear: boolean = false): string {
  const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  
  if (includeYear) {
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }
  
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

function formatHour(decimal: number): string {
  const h = Math.floor(decimal);
  const m = Math.round((decimal % 1) * 60);
  return `${h}h${m.toString().padStart(2, '0')}`;
}

async function fetchGoogleEventsForDay(date: Date): Promise<CalendarEvent[]> {
  const { data: sess } = await supabase.auth.getSession();
  const userId = sess?.session?.user?.id;
  if (!userId) return [];

  const { data: tokens } = await supabase
    .from("oauth_tokens")
    .select("access_token, refresh_token")
    .eq("user_id", userId)
    .eq("provider", "google")
    .maybeSingle();

  if (!tokens?.access_token) return [];

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(
    dayStart.toISOString()
  )}&timeMax=${encodeURIComponent(dayEnd.toISOString())}&maxResults=50&fields=items(summary,description,location,start,end,htmlLink,conferenceData,hangoutLink,organizer)`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!res.ok) return [];

  const json = await res.json();
  const items: any[] = json?.items ?? [];

  return items
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
}

async function fetchOutlookEventsForDay(date: Date): Promise<CalendarEvent[]> {
  const { data: sess } = await supabase.auth.getSession();
  const userId = sess?.session?.user?.id;
  if (!userId) return [];

  const { data: tokens } = await supabase
    .from("oauth_tokens")
    .select("access_token, refresh_token")
    .eq("user_id", userId)
    .eq("provider", "microsoft")
    .maybeSingle();

  if (!tokens?.access_token) return [];

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const url =
    "https://graph.microsoft.com/v1.0/me/calendarview" +
    `?startDateTime=${encodeURIComponent(dayStart.toISOString())}` +
    `&endDateTime=${encodeURIComponent(dayEnd.toISOString())}` +
    "&$orderby=start/dateTime" +
    "&$select=subject,organizer,start,end,location,webLink,body,onlineMeeting";

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) return [];

  const json = await res.json();
  const items: any[] = json?.value ?? [];

  return items
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
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function getTimezoneOffsetForDate(date: Date): number {
  return -date.getTimezoneOffset() / 60;
}

function calculateSunTimesFromBase(
  targetDate: Date,
  todayDate: Date,
  todaySunrise: number,
  todaySunset: number,
  latitude: number,
  todayTimezoneOffset: number
): { sunrise: number; sunset: number } {
  const targetDay = new Date(targetDate);
  targetDay.setHours(0, 0, 0, 0);
  const today = new Date(todayDate);
  today.setHours(0, 0, 0, 0);
  
  if (targetDay.getTime() === today.getTime()) {
    return { sunrise: todaySunrise, sunset: todaySunset };
  }

  const targetTimezoneOffset = getTimezoneOffsetForDate(targetDate);
  const offsetDiff = targetTimezoneOffset - todayTimezoneOffset;

  const todayDayOfYear = getDayOfYear(todayDate);
  const targetDayOfYear = getDayOfYear(targetDate);
  
  const isNorthern = latitude >= 0;
  
  const summerSolstice = isNorthern ? 172 : 355;
  const winterSolstice = isNorthern ? 355 : 172;
  
  const latFactor = Math.abs(latitude) / 90;
  const maxVariation = 6 * latFactor;
  
  const calculateDayLength = (dayOfYear: number) => {
    const angle = ((dayOfYear - summerSolstice) / 365.25) * 2 * Math.PI;
    const variation = Math.cos(angle) * maxVariation;
    return 12 + variation;
  };
  
  const todayDayLength = calculateDayLength(todayDayOfYear);
  const targetDayLength = calculateDayLength(targetDayOfYear);
  
  const currentDayLength = todaySunset - todaySunrise;
  
  const calibrationRatio = currentDayLength / todayDayLength;
  
  const targetDayLengthCalibrated = targetDayLength * calibrationRatio;
  
  const todayMidpoint = (todaySunrise + todaySunset) / 2;
  
  const targetSunrise = todayMidpoint - targetDayLengthCalibrated / 2 + offsetDiff;
  const targetSunset = todayMidpoint + targetDayLengthCalibrated / 2 + offsetDiff;
  
  return {
    sunrise: Math.max(0, Math.min(24, targetSunrise)),
    sunset: Math.max(0, Math.min(24, targetSunset))
  };
}

function getCircadianGradient(
  currentHour: number,
  wakeHour: number,
  bedHour: number,
  isDarkMode: boolean
): string {
  let normalizedCurrent = currentHour;
  let normalizedBed = bedHour;
  
  if (bedHour < wakeHour) {
    normalizedBed += 24;
    if (currentHour < wakeHour) {
      normalizedCurrent += 24;
    }
  }

  const cycleLength = normalizedBed - wakeHour;
  const progress = Math.max(0, Math.min(1, (normalizedCurrent - wakeHour) / cycleLength));

  const hoursFromWake = normalizedCurrent - wakeHour;
  const waveFrequency = Math.PI / 2;
  const wave = Math.sin(hoursFromWake * waveFrequency) * 0.15;

  if (isDarkMode) {
    const baseColors = [
      { h: 270, s: 60, l: 15 },
      { h: 265, s: 58, l: 17 },
      { h: 260, s: 55, l: 20 },
      { h: 255, s: 53, l: 19 },
      { h: 250, s: 50, l: 18 },
    ];

    const segmentIndex = Math.floor(progress * (baseColors.length - 1));
    const segmentProgress = (progress * (baseColors.length - 1)) % 1;
    const color1 = baseColors[Math.min(segmentIndex, baseColors.length - 1)];
    const color2 = baseColors[Math.min(segmentIndex + 1, baseColors.length - 1)];

    const h = color1.h + (color2.h - color1.h) * segmentProgress;
    const s = color1.s + (color2.s - color1.s) * segmentProgress;
    const l = (color1.l + (color2.l - color1.l) * segmentProgress) * (1 + wave);

    return `radial-gradient(circle at 50% 50%, hsl(${h}, ${s}%, ${l + 5}%) 0%, hsl(${h}, ${s}%, ${l}%) 55%, #181c2a 100%)`;
  } else {
    const baseColors = [
      { h: 180, s: 70, l: 85 },
      { h: 182, s: 72, l: 78 },
      { h: 185, s: 75, l: 70 },
      { h: 188, s: 77, l: 65 },
      { h: 190, s: 80, l: 60 },
    ];

    const segmentIndex = Math.floor(progress * (baseColors.length - 1));
    const segmentProgress = (progress * (baseColors.length - 1)) % 1;
    const color1 = baseColors[Math.min(segmentIndex, baseColors.length - 1)];
    const color2 = baseColors[Math.min(segmentIndex + 1, baseColors.length - 1)];

    const h = color1.h + (color2.h - color1.h) * segmentProgress;
    const s = color1.s + (color2.s - color1.s) * segmentProgress;
    const l = (color1.l + (color2.l - color1.l) * segmentProgress) * (1 + wave);

    return `radial-gradient(circle at var(--calendar-center-x, 50%) var(--calendar-center-y, 50%), hsl(${h}, ${s}%, ${l + 10}%) 0%, hsl(${h}, ${s}%, ${l + 5}%) 25%, hsl(${h}, ${s}%, ${l}%) 45%, hsl(${h}, ${s}%, ${l - 5}%) 65%, hsl(${h}, ${s}%, ${l - 10}%) 80%, hsl(${h}, ${s}%, ${l - 15}%) 100%)`;
  }
}

function getVignetteGradient(isDarkMode: boolean): string {
  if (isDarkMode) {
    return 'radial-gradient(ellipse 70% 70% at var(--calendar-center-x, 50%) var(--calendar-center-y, 50%), transparent 0%, rgba(0, 0, 0, 0.3) 100%)';
  } else {
    return 'radial-gradient(ellipse 70% 70% at var(--calendar-center-x, 50%) var(--calendar-center-y, 50%), transparent 0%, rgba(0, 151, 167, 0.25) 100%)';
  }
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isTomorrow(date: Date, reference: Date): boolean {
  const tomorrow = new Date(reference);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameDay(date, tomorrow);
}

const Visualiser = () => {
  const navigate = useNavigate();
  const { sunrise: todaySunrise, sunset: todaySunset, loading: sunLoading, error: sunError, latitude, longitude, timezoneOffset } = useSunTimes();
  const { connectedProviders, loading: authLoading } = useMultiProviderAuth();

  const googleEnabled = connectedProviders?.google ?? false;
  const msEnabled = connectedProviders?.microsoft ?? false;

  const {
    events: gEvents,
    loading: gLoading,
    error: gError,
    connected: gConnected,
    refresh: refreshGoogle,
  } = useGoogleCalendar({ enabled: googleEnabled });

  const {
    events: oEvents,
    loading: oLoading,
    error: oError,
    connected: oConnected,
    refresh: refreshOutlook,
  } = useOutlookCalendar({ enabled: msEnabled });

  const {
    wakeHour,
    bedHour,
    totalSleepHours,
    sleepSessions,
    sleepDebtOrCapital,
    idealBedHour,
    loading: fitLoading,
    error: fitError,
    connected: fitConnected,
    refresh: refreshFit,
    getSleepForDate,
    getDebtOrCapitalForDate,
  } = useGoogleFitSleep({ enabled: googleEnabled });

  const [displaySunrise, setDisplaySunrise] = useState(DEFAULT_SUNRISE);
  const [displaySunset, setDisplaySunset] = useState(DEFAULT_SUNSET);
  const size = useGoldenCircleSize();

  const [selectedEventFromList, setSelectedEventFromList] = useState<any>(null);

  const [eventsByDay, setEventsByDay] = useState<Map<string, CalendarEvent[]>>(new Map());
  const [loadingDays, setLoadingDays] = useState<Set<string>>(new Set());
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [backgroundGradient, setBackgroundGradient] = useState("");
  const [vignetteGradient, setVignetteGradient] = useState("");
  const [virtualDateTime, setVirtualDateTime] = useState<Date | null>(null);
  
  const [currentDayWake, setCurrentDayWake] = useState<number | null>(null);
  const [currentDayBed, setCurrentDayBed] = useState<number | null>(null);
  const [currentDayTotalSleep, setCurrentDayTotalSleep] = useState<number | null>(null);
  const [currentDaySleepSessions, setCurrentDaySleepSessions] = useState<SleepSession[] | null>(null);
  const [currentDayDebtOrCapital, setCurrentDayDebtOrCapital] = useState<SleepDebtOrCapital | null>(null);
  const [isHoveringRing, setIsHoveringRing] = useState(false);
  const [initialSleepLogShown, setInitialSleepLogShown] = useState(false);
  const lastLoggedDateRef = useRef<string | null>(null);

  // État d'expansion du ChatKit
  const [chatkitExpanded, setChatkitExpanded] = useState(false);

  const SIM_WAKE = 7 + 47 / 60;
  const SIM_BED = 22 + 32 / 60;

  const now = new Date();
  const displayDate = virtualDateTime || now;
  const isToday = isSameDay(displayDate, now);
  const isTomorrowDay = isTomorrow(displayDate, now);

  let effectiveWake: number | null = null;
  let effectiveBed: number | null = null;
  let effectiveTotalSleep: number | null = null;
  let effectiveSleepSessions: SleepSession[] | null = null;
  let effectiveDebtOrCapital: SleepDebtOrCapital | null = null;

  if (isToday) {
    if (currentDayWake !== null && currentDayBed !== null) {
      effectiveWake = currentDayWake;
      effectiveBed = currentDayBed;
      effectiveTotalSleep = currentDayTotalSleep;
      effectiveSleepSessions = currentDaySleepSessions;
      effectiveDebtOrCapital = currentDayDebtOrCapital;
    } else if (fitConnected && wakeHour !== null && bedHour !== null) {
      effectiveWake = wakeHour;
      effectiveBed = bedHour;
      effectiveTotalSleep = totalSleepHours;
      effectiveSleepSessions = sleepSessions;
      effectiveDebtOrCapital = sleepDebtOrCapital;
    }
  } else if (isTomorrowDay) {
    if (fitConnected && wakeHour !== null && bedHour !== null) {
      effectiveWake = wakeHour;
      effectiveBed = bedHour;
      effectiveTotalSleep = totalSleepHours;
      effectiveSleepSessions = sleepSessions;
      effectiveDebtOrCapital = sleepDebtOrCapital;
    }
  } else {
    if (currentDayWake !== null && currentDayBed !== null) {
      effectiveWake = currentDayWake;
      effectiveBed = currentDayBed;
      effectiveTotalSleep = currentDayTotalSleep;
      effectiveSleepSessions = currentDaySleepSessions;
      effectiveDebtOrCapital = currentDayDebtOrCapital;
    }
  }

  useEffect(() => {
    document.title = "DONA.club Visualiser";
    document.body.classList.add("visualiser-page");
    
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
    
    return () => {
      document.body.classList.remove("visualiser-page");
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    const hasAnyConnection = Object.values(connectedProviders || {}).some(Boolean);
    if (!hasAnyConnection) {
      navigate("/", { replace: true });
    }
  }, [authLoading, connectedProviders, navigate]);

  useEffect(() => {
    if (todaySunrise !== null && todaySunset !== null && !sunLoading && !sunError) {
      if (!virtualDateTime) {
        setDisplaySunrise(todaySunrise);
        setDisplaySunset(todaySunset);
      }
    }
  }, [todaySunrise, todaySunset, sunLoading, sunError, virtualDateTime]);

  useEffect(() => {
    if (!virtualDateTime || !latitude || !longitude || todaySunrise === null || todaySunset === null) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const virtualDay = new Date(virtualDateTime);
    virtualDay.setHours(0, 0, 0, 0);
    
    const isToday = virtualDay.getTime() === today.getTime();

    if (isToday) {
      setDisplaySunrise(todaySunrise);
      setDisplaySunset(todaySunset);
      return;
    }

    const { sunrise, sunset } = calculateSunTimesFromBase(
      virtualDay,
      today,
      todaySunrise,
      todaySunset,
      latitude,
      timezoneOffset
    );
    
    setDisplaySunrise(Number(sunrise.toFixed(2)));
    setDisplaySunset(Number(sunset.toFixed(2)));
  }, [virtualDateTime, latitude, longitude, todaySunrise, todaySunset, timezoneOffset]);

  useEffect(() => {
    const updateTheme = () => {
      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDarkMode(dark);
      setVignetteGradient(getVignetteGradient(dark));
    };
    
    updateTheme();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => updateTheme();
    
    if (mq.addEventListener) {
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, []);

  useEffect(() => {
    const updateGradient = () => {
      const referenceTime = virtualDateTime || new Date();
      const currentHour = referenceTime.getHours() + referenceTime.getMinutes() / 60;
      
      const gradientWake = effectiveWake ?? SIM_WAKE;
      const gradientBed = effectiveBed ?? SIM_BED;
      
      const gradient = getCircadianGradient(currentHour, gradientWake, gradientBed, isDarkMode);
      setBackgroundGradient(gradient);
    };

    updateGradient();
    
    if (!virtualDateTime) {
      const interval = setInterval(updateGradient, 60000);
      return () => clearInterval(interval);
    }
  }, [effectiveWake, effectiveBed, isDarkMode, virtualDateTime]);

  useEffect(() => {
    if (!initialSleepLogShown && fitConnected && wakeHour !== null && bedHour !== null && totalSleepHours !== null && sleepDebtOrCapital) {
      const sleepStr = formatHour(totalSleepHours);
      const debtStr = sleepDebtOrCapital.type === "debt" 
        ? `Dette : ${formatHour(sleepDebtOrCapital.hours)}`
        : `Capital : ${formatHour(sleepDebtOrCapital.hours)}`;
      const bedStr = formatHour(bedHour);
      
      window.dispatchEvent(new CustomEvent("app-log", { 
        detail: { message: `Sommeil : ${sleepStr} | ${debtStr} | Coucher : ${bedStr}`, type: "success" } 
      }));
      
      setInitialSleepLogShown(true);
      lastLoggedDateRef.current = formatDateKey(new Date());
    }
  }, [fitConnected, wakeHour, bedHour, totalSleepHours, sleepDebtOrCapital, initialSleepLogShown]);

  useEffect(() => {
    if (!isHoveringRing) return;

    const currentDate = virtualDateTime || new Date();
    const dateKey = formatDateKey(currentDate);
    
    if (lastLoggedDateRef.current === dateKey) return;

    if (effectiveTotalSleep !== null && effectiveDebtOrCapital && effectiveBed !== null) {
      const sleepStr = formatHour(effectiveTotalSleep);
      
      const today = new Date();
      const isCurrentDay = isSameDay(currentDate, today);
      
      if (isCurrentDay) {
        const debtStr = effectiveDebtOrCapital.type === "debt" 
          ? `Dette : ${formatHour(effectiveDebtOrCapital.hours)}`
          : `Capital : ${formatHour(effectiveDebtOrCapital.hours)}`;
        const bedStr = formatHour(effectiveBed);
        
        window.dispatchEvent(new CustomEvent("app-log", { 
          detail: { message: `Sommeil : ${sleepStr} | ${debtStr} | Coucher : ${bedStr}`, type: "success" } 
        }));
      } else {
        const debtStr = effectiveDebtOrCapital.type === "debt" 
          ? `Dette : ${formatHour(effectiveDebtOrCapital.hours)} sur ${effectiveDebtOrCapital.daysCount} jours`
          : `Capital : ${formatHour(effectiveDebtOrCapital.hours)} sur ${effectiveDebtOrCapital.daysCount} jours`;
        
        window.dispatchEvent(new CustomEvent("app-log", { 
          detail: { message: `Sommeil : ${sleepStr} | ${debtStr}`, type: "success" } 
        }));
      }
      
      lastLoggedDateRef.current = dateKey;
    }
  }, [isHoveringRing, effectiveTotalSleep, effectiveDebtOrCapital, effectiveBed, virtualDateTime]);

  const handleVirtualDateTimeChange = useCallback(async (newDateTime: Date | null) => {
    setVirtualDateTime(newDateTime);
    
    if (newDateTime && fitConnected && getSleepForDate && getDebtOrCapitalForDate) {
      const sleepData = await getSleepForDate(newDateTime);
      const debtOrCapital = await getDebtOrCapitalForDate(newDateTime);
      
      setCurrentDayWake(sleepData.wakeHour);
      setCurrentDayBed(sleepData.bedHour);
      setCurrentDayTotalSleep(sleepData.totalSleepHours);
      setCurrentDaySleepSessions(sleepData.sleepSessions);
      setCurrentDayDebtOrCapital(debtOrCapital);
    } else {
      setCurrentDayWake(null);
      setCurrentDayBed(null);
      setCurrentDayTotalSleep(null);
      setCurrentDaySleepSessions(null);
      setCurrentDayDebtOrCapital(null);
    }
  }, [fitConnected, getSleepForDate, getDebtOrCapitalForDate]);

  useEffect(() => {
    const today = new Date();
    const newCache = new Map<string, CalendarEvent[]>();

    const allInitialEvents = [...gEvents, ...oEvents];
    
    for (let i = -1; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const key = formatDateKey(date);
      
      const dayEvents = allInitialEvents.filter((e) => {
        const raw = e.raw;
        const startIso = raw?.start?.dateTime || raw?.start?.date;
        if (!startIso) return false;
        const eventDate = new Date(startIso);
        return formatDateKey(eventDate) === key;
      });
      
      newCache.set(key, dayEvents);
    }

    setEventsByDay(newCache);
  }, [gEvents, oEvents]);

  const loadEventsForDay = useCallback(async (date: Date) => {
    const key = formatDateKey(date);
    
    if (eventsByDay.has(key) || loadingDays.has(key)) {
      return;
    }

    setLoadingDays((prev) => new Set(prev).add(key));

    try {
      const [googleEvents, outlookEvents] = await Promise.all([
        googleEnabled ? fetchGoogleEventsForDay(date) : Promise.resolve([]),
        msEnabled ? fetchOutlookEventsForDay(date) : Promise.resolve([]),
      ]);

      const allEvents = [...googleEvents, ...outlookEvents];

      setEventsByDay((prev) => {
        const newMap = new Map(prev);
        newMap.set(key, allEvents);
        return newMap;
      });
      
      if (allEvents.length > 0) {
        const today = new Date();
        const includeYear = date.getFullYear() !== today.getFullYear();
        const dateLabel = formatDateLabel(date, includeYear);
        const eventCount = allEvents.length;
        const eventWord = eventCount > 1 ? "événements" : "événement";
        window.dispatchEvent(new CustomEvent("app-log", { 
          detail: { message: `${dateLabel} : ${eventCount} ${eventWord}`, type: "info" } 
        }));
      }
    } catch (err) {
      // Pas de log d'erreur
    } finally {
      setLoadingDays((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  }, [eventsByDay, loadingDays, googleEnabled, msEnabled]);

  const handleDayChange = useCallback((date: Date) => {
    loadEventsForDay(date);
    
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    loadEventsForDay(nextDay);
    
    const prevDay = new Date(date);
    prevDay.setDate(prevDay.getDate() - 1);
    loadEventsForDay(prevDay);
  }, [loadEventsForDay]);

  const combinedEvents = Array.from(eventsByDay.values()).flat();

  const outerPad = Math.max(8, Math.round(size * 0.03));

  useEffect(() => {
    const id = window.setInterval(() => {
      if (googleEnabled) {
        refreshGoogle();
        refreshFit();
      }
      if (msEnabled) {
        refreshOutlook();
      }
    }, 60_000);
    return () => window.clearInterval(id);
  }, [googleEnabled, msEnabled, refreshGoogle, refreshOutlook, refreshFit]);

  const hasAnyConnection = Object.values(connectedProviders || {}).some(Boolean);

  return (
    <>
      <FontLoader />

      <div 
        className="fixed inset-0 transition-all ease-in-out" 
        style={{ 
          zIndex: 0,
          background: backgroundGradient || (isDarkMode 
            ? 'radial-gradient(circle at 50% 50%, #6d28d9 0%, #312e81 55%, #181c2a 100%)'
            : 'radial-gradient(circle at 50% 50%, #e0f7fa 0%, #80deea 25%, #4dd0e1 45%, #26c6da 65%, #00acc1 80%, #0097a7 100%)'
          ),
          transitionDuration: '2000ms'
        }}
        id="calendar-page-container"
      />

      <div 
        className="fixed inset-0 pointer-events-none transition-all ease-in-out"
        style={{ 
          zIndex: 0.5,
          background: vignetteGradient,
          transitionDuration: '2000ms'
        }}
      />

      <ChatkitWidget 
        isExpanded={chatkitExpanded}
        onToggle={() => setChatkitExpanded(!chatkitExpanded)}
      />

      <ChatInterface 
        onWorkflowTrigger={() => setChatkitExpanded(true)}
      />

      {hasAnyConnection && (
        <UpcomingEventsList
          events={combinedEvents}
          onSelect={(evt) => {
            setSelectedEventFromList(evt);
          }}
        />
      )}

      <div 
        className="flex flex-col items-center justify-center min-h-screen"
        style={{ position: "relative", zIndex: 10 }}
      >
        <div
          className="relative flex items-center justify-center"
          style={{ width: size + outerPad * 2, height: size + outerPad * 2 }}
          onMouseEnter={() => setIsHoveringRing(true)}
          onMouseLeave={() => setIsHoveringRing(false)}
        >
          <CircularCalendar
            sunrise={displaySunrise}
            sunset={displaySunset}
            events={combinedEvents}
            size={size}
            wakeHour={effectiveWake}
            bedHour={effectiveBed}
            totalSleepHours={effectiveTotalSleep}
            sleepSessions={effectiveSleepSessions}
            externalSelectedEvent={selectedEventFromList}
            onEventBubbleClosed={() => setSelectedEventFromList(null)}
            onDayChange={handleDayChange}
            onVirtualDateTimeChange={handleVirtualDateTimeChange}
          />
          {sunError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 text-red-500 gap-2 rounded-full">
              <span className="text-sm text-center px-4">{sunError}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Visualiser;