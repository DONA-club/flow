"use client";

import React from "react";
import { Calendar, Clock } from "lucide-react";

type EventLike = {
  title: string;
  place?: string;
  start?: number; // heure décimale locale (0-23)
  end?: number;   // heure décimale locale (0-23)
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

const UpcomingEventsList: React.FC<Props> = ({ events, onSelect, maxItems = 6, className }) => {
  const upcoming = React.useMemo(() => {
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const mapped = events
      .map((e) => {
        const start = getEventStartDate(e, now);
        const end = start ? getEventEndDate(e, start) : null;
        return { e, start, end };
      })
      .filter((x) => x.start) as { e: EventLike; start: Date; end: Date | null }[];

    return mapped
      .filter(
        (x) =>
          x.start.getTime() >= now.getTime() &&
          x.start.getTime() <= threeDaysLater.getTime()
      )
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    // Plus de slice: on affiche tous les événements dans les 3 prochains jours
  }, [events, maxItems]);

  if (upcoming.length === 0) return null;

  return (
    <div
      className={[
        "fixed top-4 left-4 z-20 w-[88vw] sm:w-[320px] md:w-[360px]",
        "glass p-3 sm:p-4 backdrop-blur-md",
        className || "",
      ].join(" ").trim()}
      aria-label="Événements à venir"
    >
      <div className="flex items-center gap-2 mb-2 text-slate-200">
        <Calendar className="w-4 h-4 text-blue-200" />
        <span className="text-sm font-semibold tracking-tight">À venir</span>
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
          const range = startHour && endHour ? `${startHour} — ${endHour}` : startHour;

          return (
            <li key={idx}>
              <button
                type="button"
                onClick={() => onSelect && onSelect(e)}
                className="w-full flex items-start gap-3 rounded-lg bg-white/6 hover:bg-white/10 transition-colors px-3 py-2 text-left"
                aria-label={`Ouvrir l'événement: ${title}`}
              >
                <div className="shrink-0 mt-0.5">
                  <Clock className="w-4 h-4 text-blue-300" />
                </div>
                <div className="min-w-0">
                  <div className="text-slate-100 text-sm font-medium truncate">{title}</div>
                  <div className="text-slate-300 text-xs truncate">{place}</div>
                  {range && <div className="text-slate-400 text-xs mt-0.5">{range}</div>}
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