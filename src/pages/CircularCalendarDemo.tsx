import React, { useEffect, useState, useCallback } from "react";
import { CircularCalendar } from "@/components/CircularCalendar";
import { useSunTimes } from "@/hooks/use-sun-times";
import { StackedEphemeralLogs } from "@/components/StackedEphemeralLogs";
import { useGoogleCalendar } from "@/hooks/use-google-calendar";
import { useOutlookCalendar } from "@/hooks/use-outlook-calendar";
import { useGoogleFitSleep } from "@/hooks/use-google-fit";
import FontLoader from "@/components/FontLoader";
import UpcomingEventsList from "@/components/UpcomingEventsList";
import { useMultiProviderAuth } from "@/hooks/use-multi-provider-auth";
import { useNavigate } from "react-router-dom";
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

type LogType = "info" | "success" | "error";

type CalendarEvent = {
  title: string;
  place: string;
  start: number;
  end: number;
  url?: string;
  raw?: any;
};

function toHourDecimal(iso: string): number {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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

const CircularCalendarDemo = () => {
  const navigate = useNavigate();
  const { sunrise, sunset, loading: sunLoading, error: sunError } = useSunTimes();
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
    loading: fitLoading,
    error: fitError,
    connected: fitConnected,
    refresh: refreshFit,
  } = useGoogleFitSleep({ enabled: googleEnabled });

  const [displaySunrise, setDisplaySunrise] = useState(DEFAULT_SUNRISE);
  const [displaySunset, setDisplaySunset] = useState(DEFAULT_SUNSET);
  const size = useGoldenCircleSize();

  const [logs, setLogs] = useState<{ message: string; type?: LogType }[]>([]);
  const [selectedEventFromList, setSelectedEventFromList] = useState<any>(null);

  const [eventsByDay, setEventsByDay] = useState<Map<string, CalendarEvent[]>>(new Map());
  const [loadingDays, setLoadingDays] = useState<Set<string>>(new Set());

  const SIM_WAKE = 7 + 47 / 60;
  const SIM_BED = 22 + 32 / 60;

  const effectiveWake = fitConnected && wakeHour != null && bedHour != null ? wakeHour : SIM_WAKE;
  const effectiveBed = fitConnected && wakeHour != null && bedHour != null ? bedHour : SIM_BED;

  useEffect(() => {
    document.title = "DONA.club Visualiser";
  }, []);

  useEffect(() => {
    if (authLoading) return;
    const hasAnyConnection = Object.values(connectedProviders || {}).some(Boolean);
    if (!hasAnyConnection) {
      navigate("/", { replace: true });
    }
  }, [authLoading, connectedProviders, navigate]);

  useEffect(() => {
    if (sunrise !== null && sunset !== null && !sunLoading && !sunError) {
      setDisplaySunrise(sunrise);
      setDisplaySunset(sunset);
    }
  }, [sunrise, sunset, sunLoading, sunError]);

  // Gestion des logs de localisation - remplacer "..." par résultat final
  useEffect(() => {
    if (sunLoading) {
      // Ne pas afficher de log pendant le chargement
      return;
    } else if (sunError) {
      setLogs([{ message: "Position approximative", type: "info" }]);
    } else if (sunrise !== null && sunset !== null) {
      setLogs([{ message: "Position détectée", type: "success" }]);
    }
  }, [sunLoading, sunError, sunrise, sunset]);

  // Gestion des logs Google Calendar - remplacer "..." par résultat final
  useEffect(() => {
    if (gLoading) {
      // Ne pas afficher de log pendant le chargement
      return;
    } else if (gError && gError.includes("non connecté")) {
      return;
    } else if (gError) {
      setLogs([{ message: "Google indisponible", type: "error" }]);
    } else if (gConnected && gEvents.length > 0) {
      setLogs([{ message: `${gEvents.length} événement${gEvents.length > 1 ? 's' : ''} Google`, type: "success" }]);
    } else if (gConnected && gEvents.length === 0) {
      setLogs([{ message: "Google synchronisé", type: "success" }]);
    }
  }, [gLoading, gError, gConnected, gEvents.length]);

  // Gestion des logs Outlook Calendar - remplacer "..." par résultat final
  useEffect(() => {
    if (oLoading) {
      // Ne pas afficher de log pendant le chargement
      return;
    } else if (oError && oError.includes("non connecté")) {
      return;
    } else if (oError) {
      setLogs([{ message: "Outlook indisponible", type: "error" }]);
    } else if (oConnected && oEvents.length > 0) {
      setLogs([{ message: `${oEvents.length} événement${oEvents.length > 1 ? 's' : ''} Outlook`, type: "success" }]);
    } else if (oConnected && oEvents.length === 0) {
      setLogs([{ message: "Outlook synchronisé", type: "success" }]);
    }
  }, [oLoading, oError, oConnected, oEvents.length]);

  // Gestion des logs Google Fit - remplacer "..." par résultat final
  useEffect(() => {
    if (fitLoading) {
      // Ne pas afficher de log pendant le chargement
      return;
    } else if (fitError && fitError.includes("non connecté")) {
      return;
    } else if (fitError && fitError.includes("Aucune session")) {
      return;
    } else if (fitError) {
      setLogs([{ message: "Sommeil indisponible", type: "info" }]);
    } else if (fitConnected && wakeHour != null && bedHour != null) {
      setLogs([{ message: "Sommeil synchronisé", type: "success" }]);
    }
  }, [fitLoading, fitError, fitConnected, wakeHour, bedHour]);

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

      // Log uniquement si des événements sont trouvés
      if (allEvents.length > 0) {
        const dateObj = new Date(date);
        const dayName = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][dateObj.getDay()];
        setLogs([{ message: `${dayName} ${dateObj.getDate()}: ${allEvents.length} événement${allEvents.length > 1 ? 's' : ''}`, type: "success" }]);
      }
    } catch (err) {
      // Pas de log d'erreur pour ne pas surcharger
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

  // Rafraîchissement silencieux toutes les minutes
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
        className="fixed inset-0 calendar-light-bg" 
        style={{ zIndex: 0 }}
        id="calendar-page-container"
      />

      <div style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none" }}>
        <StackedEphemeralLogs logs={logs} fadeOutDuration={5000} />
      </div>

      {hasAnyConnection && (
        <UpcomingEventsList
          events={combinedEvents}
          onSelect={(evt) => {
            setSelectedEventFromList(evt);
          }}
        />
      )}

      <div 
        className="flex flex-col items-center justify-center min-h-screen py-8" 
        style={{ position: "relative", zIndex: 10 }}
      >
        <div
          className="relative flex items-center justify-center"
          style={{ width: size + outerPad * 2, height: size + outerPad * 2 }}
        >
          <CircularCalendar
            sunrise={displaySunrise}
            sunset={displaySunset}
            events={combinedEvents}
            size={size}
            wakeHour={effectiveWake}
            bedHour={effectiveBed}
            externalSelectedEvent={selectedEventFromList}
            onEventBubbleClosed={() => setSelectedEventFromList(null)}
            onDayChange={handleDayChange}
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

export default CircularCalendarDemo;