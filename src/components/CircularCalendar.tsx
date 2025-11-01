import React from "react";

type Event = {
  title: string;
  place: string;
  start: number; // hour (0-23)
  end: number;   // hour (0-23)
  url?: string;
};

type Props = {
  sunrise: number; // hour (0-23)
  sunset: number;  // hour (0-23)
  events: Event[];
  season?: "spring" | "summer" | "autumn" | "winter";
  onEventClick?: (event: Event) => void;
};

const SIZE = 320; // SVG size in px
const RADIUS = 140; // Outer radius

// Calcul du rayon intérieur selon le nombre d'or
const PHI = 1.618;
const RING_THICKNESS = RADIUS / PHI; // épaisseur de l'anneau
const INNER_RADIUS = RADIUS - RING_THICKNESS; // rayon intérieur

const SEASON_COLORS: Record<string, string> = {
  spring: "#4ade80", // green-400
  summer: "#fde047", // yellow-300
  autumn: "#fb923c", // orange-400
  winter: "#7dd3fc", // sky-300 (ice blue)
};

function getWedgePath(cx: number, cy: number, r1: number, r2: number, startAngle: number, endAngle: number) {
  // Convert angles to radians
  const startRad = (Math.PI / 180) * startAngle;
  const endRad = (Math.PI / 180) * endAngle;

  // Points on outer arc
  const x1 = cx + r1 * Math.cos(startRad);
  const y1 = cy + r1 * Math.sin(startRad);
  const x2 = cx + r1 * Math.cos(endRad);
  const y2 = cy + r1 * Math.sin(endRad);

  // Points on inner arc
  const x3 = cx + r2 * Math.cos(endRad);
  const y3 = cy + r2 * Math.sin(endRad);
  const x4 = cx + r2 * Math.cos(startRad);
  const y4 = cy + r2 * Math.sin(startRad);

  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${x1} ${y1}`,
    `A ${r1} ${r1} 0 ${largeArc} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${r2} ${r2} 0 ${largeArc} 0 ${x4} ${y4}`,
    "Z"
  ].join(" ");
}

function getCurrentOrNextEvent(events: Event[], now: number): Event | undefined {
  // Find current event
  const current = events.find(e => now >= e.start && now < e.end);
  if (current) return current;
  // Find next event
  return events.find(e => e.start > now);
}

function getSeason(date: Date): "spring" | "summer" | "autumn" | "winter" {
  const m = date.getMonth() + 1;
  if (m >= 3 && m < 6) return "spring";
  if (m >= 6 && m < 9) return "summer";
  if (m >= 9 && m < 12) return "autumn";
  return "winter";
}

export const CircularCalendar: React.FC<Props> = ({
  sunrise,
  sunset,
  events,
  season,
  onEventClick,
}) => {
  const now = new Date();
  const hour = now.getHours();
  const currentSeason = season || getSeason(now);

  const event = getCurrentOrNextEvent(events, hour);

  // For each hour, calculate start/end angle (0 at top, clockwise)
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const blockAngle = 360 / 24;

  // Handle sunrise/sunset wrap (e.g. sunset < sunrise)
  function isDay(i: number) {
    if (sunrise < sunset) {
      return i >= sunrise && i < sunset;
    } else {
      return i >= sunrise || i < sunset;
    }
  }

  // Cursor line
  const cursorAngle = ((hour / 24) * 360) - 90;
  const cursorRad = (Math.PI / 180) * cursorAngle;
  const cursorX1 = cx + INNER_RADIUS * Math.cos(cursorRad);
  const cursorY1 = cy + INNER_RADIUS * Math.sin(cursorRad);
  const cursorX2 = cx + RADIUS * Math.cos(cursorRad);
  const cursorY2 = cy + RADIUS * Math.sin(cursorRad);

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Hour wedges */}
        {Array.from({ length: 24 }).map((_, i) => {
          const startAngle = -90 + i * blockAngle;
          const endAngle = startAngle + blockAngle;
          return (
            <path
              key={i}
              d={getWedgePath(cx, cy, RADIUS, INNER_RADIUS, startAngle, endAngle)}
              fill={isDay(i) ? SEASON_COLORS[currentSeason] : "#d1d5db"}
              stroke={isDay(i) ? "#fff" : "#9ca3af"}
              strokeWidth={1.5}
              opacity={1}
            />
          );
        })}
        {/* Hour numbers */}
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = ((i / 24) * 2 * Math.PI) - Math.PI / 2;
          const r = (RADIUS + INNER_RADIUS) / 2;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle) + 4;
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              fontSize="13"
              fontWeight={i === hour ? "bold" : "normal"}
              fill={i === hour ? "#2563eb" : "#374151"}
              style={{ pointerEvents: "none", userSelect: "none" }}
            >
              {i}
            </text>
          );
        })}
        {/* Cursor line */}
        <line
          x1={cursorX1}
          y1={cursorY1}
          x2={cursorX2}
          y2={cursorY2}
          stroke="#2563eb"
          strokeWidth={3}
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 4px #2563eb88)" }}
        />
      </svg>
      {/* Center info */}
      <div
        className="absolute left-1/2 top-1/2 flex flex-col items-center justify-center text-center"
        style={{
          transform: `translate(-50%, -50%)`,
          position: "absolute",
          width: INNER_RADIUS * 1.5,
          maxWidth: "80%",
          pointerEvents: event ? "auto" : "none",
          top: `calc(50% + 0px)`,
          left: `calc(50% + 0px)`,
          cursor: event ? "pointer" : "default",
        }}
        onClick={() => event && onEventClick && onEventClick(event)}
        tabIndex={event ? 0 : -1}
        role={event ? "button" : undefined}
        aria-label={event ? `Open event: ${event.title}` : undefined}
      >
        <div className={event ? "text-lg font-bold mb-1 underline text-blue-700" : "text-lg font-bold mb-1"}>
          {event ? event.title : "No events"}
        </div>
        <div className="text-sm text-gray-600">
          {event ? event.place : "Enjoy your time!"}
        </div>
      </div>
    </div>
  );
};