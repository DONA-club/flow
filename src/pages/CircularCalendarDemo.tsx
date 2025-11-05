import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { CircularCalendar } from "@/components/CircularCalendar";
import { useSunTimes } from "@/hooks/use-sun-times";
import { StackedEphemeralLogs } from "@/components/StackedEphemeralLogs";
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

function formatDateForLog(date: Date): string {
  const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  
  const currentYear = new Date().getFullYear();
  const dateYear = date.getFullYear();
  
  const dayName = days[date.getDay()];
  const dayNumber = date.getDate();
  const monthName = months[date.getMonth()];
  
  if (dateYear !== currentYear) {
    return `${dayName} ${dayNumber} ${monthName} ${dateYear}`;
  }
  
  return `${dayName} ${dayNumber} ${monthName}`;
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

// Fonction pour calculer sunrise/sunset pour une date et position données
function calculateSunTimes(date: Date, latitude: number, longitude: number): { sunrise: number; sunset: number } {
  // Formule simplifiée basée sur l'approximation de l'équation du temps
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  
  // Déclinaison solaire
  const declination = 23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * Math.PI / 180);
  
  // Angle horaire au lever/coucher
  const latRad = latitude * Math.PI / 180;
  const declRad = declination * Math.PI / 180;
  const cosH = -Math.tan(latRad) * Math.tan(declRad);
  
  // Si le soleil ne se lève/couche pas (régions polaires)
  if (cosH > 1) return { sunrise: 0, sunset: 0 }; // Nuit polaire
  if (cosH < -1) return { sunrise: 0, sunset: 24 }; // Jour polaire
  
  const H = Math.acos(cosH) * 180 / Math.PI;
  
  // Équation du temps (approximation)
  const B = (360 / 365) * (dayOfYear - 81) * Math.PI / 180;
  const E = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  
  // Correction de longitude
  const LSTM = 15 * Math.round(longitude / 15); // Fuseau horaire standard
  const TC = 4 * (longitude - LSTM) + E;
  
  // Heures locales
  const sunrise = 12 - H / 15 - TC / 60;
  const sunset = 12 + H / 15 - TC / 60;
  
  return {
    sunrise: Math.max(0, Math.min(24, sunrise)),
    sunset: Math.max(0, Math.min(24, sunset))
  };
}

// Fonction pour obtenir les dates de changement d'heure en France pour une année donnée
function getDSTDates(year: number): { spring: Date; autumn: Date } {
  // Dernier dimanche de mars à 2h (passage à 3h)
  const march = new Date(year, 2, 31); // 31 mars
  const springDay = 31 - ((march.getDay() || 7) - 1); // Dernier dimanche
  const spring = new Date(year, 2, springDay, 2, 0, 0);
  
  // Dernier dimanche d'octobre à 3h (passage à 2h)
  const october = new Date(year, 9, 31); // 31 octobre
  const autumnDay = 31 - ((october.getDay() || 7) - 1); // Dernier dimanche
  const autumn = new Date(year, 9, autumnDay, 3, 0, 0);
  
  return { spring, autumn };
}

// Fonction pour ajuster l'heure selon le fuseau horaire et le DST
function adjustForDST(date: Date, hour: number): number {
  const year = date.getFullYear();
  const { spring, autumn } = getDSTDates(year);
  
  // Vérifier si on est en heure d'été (DST)
  const isDST = date >= spring && date < autumn;
  
  // En heure d'été, ajouter 1h (UTC+2), sinon UTC+1
  return isDST ? hour + 2 : hour + 1;
}

// Fonction pour calculer la couleur du fond basée sur le cycle circadien avec ondes de 2h
function getCircadianGradient(
  currentHour: number,
  wakeHour: number,
  bedHour: number,
  isDarkMode: boolean
): string {
  // Normaliser les heures pour gérer le cycle qui traverse minuit
  let normalizedCurrent = currentHour;
  let normalizedBed = bedHour;
  
  if (bedHour < wakeHour) {
    normalizedBed += 24;
    if (currentHour < wakeHour) {
      normalizedCurrent += 24;
    }
  }

  // Calculer la progression dans le cycle (0 = réveil, 1 = coucher)
  const cycleLength = normalizedBed - wakeHour;
  const progress = Math.max(0, Math.min(1, (normalizedCurrent - wakeHour) / cycleLength));

  // Créer des oscillations sinusoïdales avec période de 2h
  const hoursFromWake = normalizedCurrent - wakeHour;
  const waveFrequency = Math.PI / 2; // Période de 2h (π/2 rad/h)
  const wave = Math.sin(hoursFromWake * waveFrequency) * 0.15; // Amplitude de 15%

  if (isDarkMode) {
    // Mode sombre : variations de violet/bleu profond avec oscillations
    const baseColors = [
      { h: 270, s: 60, l: 15 }, // Réveil - Violet profond
      { h: 265, s: 58, l: 17 }, // +25% - Violet-bleu
      { h: 260, s: 55, l: 20 }, // +50% - Bleu-violet (midi)
      { h: 255, s: 53, l: 19 }, // +75% - Bleu-indigo
      { h: 250, s: 50, l: 18 }, // Coucher - Violet-indigo
    ];

    // Interpolation entre les couleurs de base
    const segmentIndex = Math.floor(progress * (baseColors.length - 1));
    const segmentProgress = (progress * (baseColors.length - 1)) % 1;
    const color1 = baseColors[Math.min(segmentIndex, baseColors.length - 1)];
    const color2 = baseColors[Math.min(segmentIndex + 1, baseColors.length - 1)];

    const h = color1.h + (color2.h - color1.h) * segmentProgress;
    const s = color1.s + (color2.s - color1.s) * segmentProgress;
    const l = (color1.l + (color2.l - color1.l) * segmentProgress) * (1 + wave);

    return `radial-gradient(circle at 50% 50%, hsl(${h}, ${s}%, ${l + 5}%) 0%, hsl(${h}, ${s}%, ${l}%) 55%, #181c2a 100%)`;
  } else {
    // Mode clair : variations de turquoise/cyan avec oscillations
    const baseColors = [
      { h: 180, s: 70, l: 85 }, // Réveil - Turquoise très clair
      { h: 182, s: 72, l: 78 }, // +25% - Turquoise-cyan
      { h: 185, s: 75, l: 70 }, // +50% - Cyan moyen (midi)
      { h: 188, s: 77, l: 65 }, // +75% - Cyan-bleu
      { h: 190, s: 80, l: 60 }, // Coucher - Bleu cyan
    ];

    // Interpolation entre les couleurs de base
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

const Visualiser = () => {
  const navigate = useNavigate();
  const { sunrise: todaySunrise, sunset: todaySunset, loading: sunLoading, error: sunError, latitude, longitude } = useSunTimes();
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [backgroundGradient, setBackgroundGradient] = useState("");
  const [virtualDateTime, setVirtualDateTime] = useState<Date | null>(null);

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

  // Mise à jour des heures de lever/coucher pour aujourd'hui
  useEffect(() => {
    if (todaySunrise !== null && todaySunset !== null && !sunLoading && !sunError) {
      setDisplaySunrise(todaySunrise);
      setDisplaySunset(todaySunset);
    }
  }, [todaySunrise, todaySunset, sunLoading, sunError]);

  // Mise à jour dynamique des heures de lever/coucher selon la date virtuelle
  useEffect(() => {
    if (!virtualDateTime || !latitude || !longitude) return;

    const today = new Date();
    const isToday = 
      virtualDateTime.getDate() === today.getDate() &&
      virtualDateTime.getMonth() === today.getMonth() &&
      virtualDateTime.getFullYear() === today.getFullYear();

    // Si c'est aujourd'hui, utiliser les valeurs actuelles
    if (isToday) {
      if (todaySunrise !== null && todaySunset !== null) {
        setDisplaySunrise(todaySunrise);
        setDisplaySunset(todaySunset);
      }
      return;
    }

    // Sinon, calculer pour la date virtuelle
    const { sunrise, sunset } = calculateSunTimes(virtualDateTime, latitude, longitude);
    const adjustedSunrise = adjustForDST(virtualDateTime, sunrise);
    const adjustedSunset = adjustForDST(virtualDateTime, sunset);
    
    console.log(`📅 Date virtuelle: ${virtualDateTime.toLocaleDateString()}`);
    console.log(`🌅 Sunrise calculé: ${adjustedSunrise.toFixed(2)}h`);
    console.log(`🌇 Sunset calculé: ${adjustedSunset.toFixed(2)}h`);
    
    setDisplaySunrise(adjustedSunrise);
    setDisplaySunset(adjustedSunset);
  }, [virtualDateTime, latitude, longitude, todaySunrise, todaySunset]);

  // Détection du thème
  useEffect(() => {
    const updateTheme = () => {
      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDarkMode(dark);
    };
    
    updateTheme();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => updateTheme();
    
    if (mq.addEventListener) {
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, []);

  // Mise à jour du gradient basé sur virtualDateTime (curseur) ou l'heure actuelle
  useEffect(() => {
    const updateGradient = () => {
      const referenceTime = virtualDateTime || new Date();
      const currentHour = referenceTime.getHours() + referenceTime.getMinutes() / 60;
      const gradient = getCircadianGradient(currentHour, effectiveWake, effectiveBed, isDarkMode);
      setBackgroundGradient(gradient);
    };

    updateGradient();
    
    // Si pas de virtualDateTime, mettre à jour toutes les minutes
    if (!virtualDateTime) {
      const interval = setInterval(updateGradient, 60000);
      return () => clearInterval(interval);
    }
  }, [effectiveWake, effectiveBed, isDarkMode, virtualDateTime]);

  // Callback pour recevoir les changements de virtualDateTime depuis CircularCalendar
  const handleVirtualDateTimeChange = useCallback((newDateTime: Date | null) => {
    setVirtualDateTime(newDateTime);
  }, []);

  // Gestion des logs de localisation - remplacer "..." par résultat final
  useEffect(() => {
    if (sunLoading) {
      // Ne pas afficher de log pendant le chargement
      return;
    } else if (sunError) {
      setLogs([{ message: "Position approximative", type: "info" }]);
    } else if (todaySunrise !== null && todaySunset !== null) {
      setLogs([{ message: "Position détectée", type: "success" }]);
    }
  }, [sunLoading, sunError, todaySunrise, todaySunset]);

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
        const formattedDate = formatDateForLog(date);
        setLogs([{ message: `${formattedDate} : ${allEvents.length} événement${allEvents.length > 1 ? 's' : ''}`, type: "success" }]);
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
        className="fixed inset-0 transition-all duration-[2000ms] ease-in-out" 
        style={{ 
          zIndex: 0,
          background: backgroundGradient || (isDarkMode 
            ? 'radial-gradient(circle at 50% 50%, #6d28d9 0%, #312e81 55%, #181c2a 100%)'
            : 'radial-gradient(circle at 50% 50%, #e0f7fa 0%, #80deea 25%, #4dd0e1 45%, #26c6da 65%, #00acc1 80%, #0097a7 100%)'
          )
        }}
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