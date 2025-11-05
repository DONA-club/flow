"use client";

import React from "react";
import { ChevronDown, Calendar, Clock, CalendarDays } from "lucide-react";

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

const UpcomingEventsList: React.FC<Props> = ({ events, onSelect, maxItems = 6, className }) => {
  const [open, setOpen] = React.useState(true);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);

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
    setIsAnimating(true);
    setOpen(!open);
    setTimeout(() => setIsAnimating(false), 400);
  };

  if (upcoming.length === 0) return null;

  const cursorColor = isDarkMode ? "#bfdbfe" : "#1d4ed8";
  const nowRef = new Date();

  if (!open) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        className={[
          "fixed top-4 left-4 glass px-3 py-2 backdrop-blur-md rounded-lg",
          "flex items-center gap-2 text-slate-100 hover:bg-white/20 transition-colors",
          "relative overflow-hidden",
          className || "",
        ].join(" ").trim()}
        style={{ zIndex: 100 }}
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
    );
  }

  return (
    <div
      className={[
        "fixed top-4 left-4 w-[88vw] sm:w-[320px] md:w-[360px]",
        "glass p-3 sm:p-4 backdrop-blur-md rounded-lg",
        "relative overflow-hidden",
        className || "",
      ].join(" ").trim()}
      style={{ zIndex: 100 }}
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

          // Choisir l'icône selon le jour
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
  );
};

export default UpcomingEventsList;