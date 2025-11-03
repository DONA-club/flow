"use client";

import React from "react";
import { X } from "lucide-react";

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

const UpcomingEventsList: React.FC<Props> = ({ events, onSelect, maxItems = 6, className }) => {
  const [open, setOpen] = React.useState(true);

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
  }, [events, maxItems]);

  if (upcoming.length === 0) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          "fixed top-4 left-4 z-20 glass px-3 py-2 backdrop-blur-md rounded-lg",
          "flex items-center gap-2 text-slate-100 hover:bg-white/20 transition-colors",
          className || "",
        ].join(" ").trim()}
        aria-label="Afficher les événements à venir"
      >
        <span className="text-sm font-semibold tracking-tight">[+] A venir</span>
      </button>
    );
  }

  const nowRef = new Date();

  return (
    <div
      className={[
        "fixed top-4 left-4 z-20 w-[88vw] sm:w-[320px] md:w-[360px]",
        "glass p-3 sm:p-4 backdrop-blur-md rounded-lg",
        className || "",
      ].join(" ").trim()}
      aria-label="Événements à venir"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-slate-200">
          <span className="text-sm font-semibold tracking-tight">A venir</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="p-1 rounded-md hover:bg-white/10 text-slate-300"
          aria-label="Fermer la liste des événements"
        >
          <X className="w-4 h-4" />
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

          return (
            <li key={idx}>
              <button
                type="button"
                onClick={() => onSelect && onSelect(e)}
                className="w-full flex items-start gap-3 rounded-lg bg-white/6 hover:bg-white/10 transition-colors px-3 py-2 text-left"
                aria-label={`Ouvrir l'événement: ${title}`}
              >
                <div className="shrink-0 mt-0.5">
                  <span className="text-blue-300 text-xs">[*]</span>
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