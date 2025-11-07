"use client";

import React from "react";
import { ChevronDown, Calendar, Clock, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type EventLike = {
  title: string;
  place?: string;
  start?: number;
  end?: number;
  url?: string;
  raw?: any;
};

type Props = {
  events: EventLike[];
  onSelect?: (e: EventLike) => void;
  maxItems?: number;
  className?: string;
  chatkitExpanded?: boolean;
};

function getEventStartDate(e: EventLike, nowRef: Date): Date | null {
  const raw = (e as any)?.raw;
  const iso = raw?.start?.dateTime || raw?.start?.date || null;
  if (iso) return new Date(iso);
  if (typeof e.start !== "number") return null;
  const base = new Date(nowRef);
  const hours = Math.floor(e.start || 0);
  const minutes = Math.round(((e.start || 0) % 1) * 60);
  base.setHours(hours, minutes, 0, 0);
  return base;
}

function getEventEndDate(e: EventLike, startDate: Date): Date | null {
  const raw = (e as any)?.raw;
  const iso = raw?.end?.dateTime || raw?.end?.date || null;
  if (iso) return new Date(iso);
  if (typeof e.end !== "number") return null;
  const end = new Date(startDate);
  const hours = Math.floor(e.end || 0);
  const minutes = Math.round(((e.end || 0) % 1) * 60);
  end.setHours(hours, minutes, 0, 0);
  return end;
}

function formatHour(decimal: number) {
  const h = Math.floor(decimal).toString().padStart(2, "0");
  const m = Math.round((decimal % 1) * 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function getDayLabel(date: Date, nowRef: Date) {
  const startMid = new Date(date);
  startMid.setHours(0, 0, 0, 0);
  const nowMid = new Date(nowRef);
  nowMid.setHours(0, 0, 0, 0);
  const diffDays = Math.round((startMid.getTime() - nowMid.getTime()) / 86_400_000);

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Demain";
  const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  return days[startMid.getDay()];
}

function getDaysDifference(date1: Date, date2: Date): number {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.round((d1.getTime() - d2.getTime()) / (24 * 60 * 60 * 1000));
}

const PREFERENCE_KEY = "upcoming_events_panel_open";
const INTERACTION_THRESHOLD_MS = 3000;

async function loadPreference(): Promise<boolean> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) {
      const stored = localStorage.getItem(PREFERENCE_KEY);
      return stored === "true";
    }

    const { data, error } = await supabase
      .from("user_preferences")
      .select("preference_value")
      .eq("user_id", session.session.user.id)
      .eq("preference_key", PREFERENCE_KEY)
      .maybeSingle();

    if (error) {
      console.warn("Failed to load preference from Supabase:", error);
      const stored = localStorage.getItem(PREFERENCE_KEY);
      return stored === "true";
    }

    if (data?.preference_value) {
      return data.preference_value.open === true;
    }

    return false;
  } catch (err) {
    console.warn("Error loading preference:", err);
    return false;
  }
}

async function savePreference(open: boolean): Promise<void> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) {
      localStorage.setItem(PREFERENCE_KEY, String(open));
      return;
    }

    const { error } = await supabase
      .from("user_preferences")
      .upsert({
        user_id: session.session.user.id,
        preference_key: PREFERENCE_KEY,
        preference_value: { open },
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,preference_key"
      });

    if (error) {
      console.warn("Failed to save preference to Supabase:", error);
      localStorage.setItem(PREFERENCE_KEY, String(open));
    }
  } catch (err) {
    console.warn("Error saving preference:", err);
    localStorage.setItem(PREFERENCE_KEY, String(open));
  }
}

const UpcomingEventsList: React.FC<Props> = ({ events, onSelect, maxItems = 6, className, chatkitExpanded = false }) => {
  const [open, setOpen] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const mountTimeRef = React.useRef<number>(Date.now());
  const prevChatkitExpandedRef = React.useRef(chatkitExpanded);

  React.useEffect(() => {
    const checkTheme = () => {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDarkMode(isDark);
    };
    checkTheme();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => checkTheme();
    if (mq.addEventListener) {
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, []);

  React.useEffect(() => {
    loadPreference().then((isOpen) => {
      setOpen(isOpen);
      setLoading(false);
    });
  }, []);

  // Auto-close when ChatKit opens
  React.useEffect(() => {
    const wasCollapsed = !prevChatkitExpandedRef.current;
    const isNowExpanded = chatkitExpanded;
    
    if (wasCollapsed && isNowExpanded && open) {
      // ChatKit just opened and we're currently open -> close
      setIsAnimating(true);
      setOpen(false);
      savePreference(false);
      setTimeout(() => setIsAnimating(false), 400);
    }
    
    prevChatkitExpandedRef.current = chatkitExpanded;
  }, [chatkitExpanded, open]);

  const upcoming = React.useMemo(() => {
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const mapped = events
      .map((e) => {
        const start = getEventStartDate(e, now);
        const end = start ? getEventEndDate(e, start) : null;
        return { e, start, end };
      })
      .filter(Boolean) as { e: EventLike; start: Date; end: Date | null }[];

    return mapped
      .filter(
        (x) =>
          x.start.getTime() >= now.getTime() &&
          x.start.getTime() <= threeDaysLater.getTime()
      )
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [events, maxItems]);

  const handleEventClick = (evt: EventLike) => {
    if (onSelect) {
      onSelect(evt);
    }
  };

  const handleToggle = () => {
    const newState = !open;
    const timeSinceMount = Date.now() - mountTimeRef.current;
    
    if (timeSinceMount <= INTERACTION_THRESHOLD_MS) {
      savePreference(newState);
    }
    
    setIsAnimating(true);
    setOpen(newState);
    setTimeout(() => setIsAnimating(false), 400);
  };

  if (loading || upcoming.length === 0) return null;

  const cursorColor = isDarkMode ? "#bfdbfe" : "#1d4ed8";
  const nowRef = new Date();

  // When manually opened, appear above ChatKit (z-index 10000)
  // When collapsed, stay at z-index 50
  const zIndex = open ? 10000 : 50;

  if (!open) {
    return (
      <div 
        className="fixed top-4 left-4 pointer-events-none"
        style={{ zIndex }}
      >
        <button
          type="button"
          onClick={handleToggle}
          className={[
            "glass px-3 py-2 backdrop-blur-md rounded-lg pointer-events-auto",
            "flex items-center gap-2 text-slate-100 hover:bg-white/20 transition-colors",
            "relative overflow-hidden",
            className || "",
          ].join(" ").trim()}
          aria-label="Afficher les événements à venir"
        >
          {isAnimating && (
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              style={{
                animation: "shimmer-once 0.4s ease-out forwards"
              }}
            />
          )}
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-semibold tracking-tight">A venir</span>
        </button>
      </div>
    );
  }

  return (
    <div 
      className="fixed top-4 left-4 pointer-events-none"
      style={{ zIndex }}
    >
      <div
        className={[
          "pointer-events-auto",
          "glass p-3 sm:p-4 backdrop-blur-md rounded-lg",
          "relative overflow-hidden",
          className || "",
        ].join(" ").trim()}
        style={{
          width: "400px",
          maxWidth: "calc(100vw - 2rem)",
        }}
        aria-label="Événements à venir"
      >
        {isAnimating && (
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
            style={{
              animation: "shimmer-once 0.4s ease-out forwards"
            }}
          />
        )}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-slate-200">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-semibold tracking-tight">A venir</span>
          </div>
          <button
            type="button"
            onClick={handleToggle}
            className="p-1 rounded-md hover:bg-white/10 text-slate-300 transition-transform"
            aria-label="Fermer la liste des événements"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <ul className="space-y-2">
          {upcoming.map(({ e, start, end }, idx) => {
            const title = e.title || "Événement";
            const place =
              e.place ||
              e?.raw?.location?.displayName ||
              e?.raw?.organizer?.emailAddress?.name ||
              "Agenda";

            const startHour =
              typeof e.start === "number"
                ? formatHour(e.start)
                : start
                ? start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "";
            const endHour =
              typeof e.end === "number"
                ? formatHour(e.end!)
                : end
                ? end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "";
            const range = startHour && endHour ? `${startHour} - ${endHour}` : startHour;

            const dayLabel = start ? getDayLabel(start, nowRef) : "";
            const dayDiff = start ? getDaysDifference(start, nowRef) : 0;

            let EventIcon = Clock;
            let iconColor = cursorColor;
            
            if (dayDiff === 0) {
              EventIcon = Clock;
              iconColor = cursorColor;
            } else if (dayDiff === 1) {
              EventIcon = Calendar;
              iconColor = "currentColor";
            } else {
              EventIcon = CalendarDays;
              iconColor = "currentColor";
            }

            return (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => handleEventClick(e)}
                  className="w-full flex items-start gap-3 rounded-lg bg-white/6 hover:bg-white/10 transition-colors px-3 py-2 text-left"
                  aria-label={`Ouvrir l'événement: ${title}`}
                >
                  <div className="shrink-0 mt-0.5">
                    <EventIcon className="w-4 h-4" style={{ color: iconColor }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-slate-100 text-sm font-medium truncate">{title}</div>
                    <div className="text-slate-300 text-xs truncate">{place}</div>
                    <div className="text-slate-400 text-xs mt-0.5">
                      {dayLabel}{range ? ` - ${range}` : ""}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default UpcomingEventsList;