import React from "react";

type Event = {
  title: string;
  place: string;
  start: number; // hour (0-23)
  end: number;   // hour (0-23)
  url?: string;
};

type Props = {
  sunrise: number; // heure décimale (ex: 6.5 pour 6h30)
  sunset: number;  // heure décimale (ex: 20.25 pour 20h15)
  events: Event[];
  season?: "spring" | "summer" | "autumn" | "winter";
  onEventClick?: (event: Event) => void;
  size?: number; // diamètre du cercle en px
  eventIcon?: React.ReactNode;
};

const DEFAULT_SIZE = 320;
const RING_THICKNESS = 32;

const SEASON_COLORS: Record<string, string> = {
  spring: "#4ade80", // green-400
  summer: "#fde047", // yellow-300
  autumn: "#fb923c", // orange-400
  winter: "#7dd3fc", // sky-300 (ice blue)
};

const NIGHT_COLOR = "#d1d5db";

// Couleur de fond du projet (bg-gray-50)
const BACKGROUND_COLOR = "#f9fafb";

// Découpage en 1440 segments (1 par minute)
const SEGMENTS = 1440;

function getWedgePath(
  cx: number,
  cy: number,
  r1: number,
  r2: number,
  startAngle: number,
  endAngle: number
) {
  const startRad = (Math.PI / 180) * startAngle;
  const endRad = (Math.PI / 180) * endAngle;

  const x1 = cx + r1 * Math.cos(startRad);
  const y1 = cy + r1 * Math.sin(startRad);
  const x2 = cx + r1 * Math.cos(endRad);
  const y2 = cy + r1 * Math.sin(endRad);

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
    "Z",
  ].join(" ");
}

function getCurrentOrNextEvent(events: Event[], now: number): Event | undefined {
  const current = events.find((e) => now >= e.start && now < e.end);
  if (current) return current;
  return events.find((e) => e.start > now);
}

function getSeason(date: Date): "spring" | "summer" | "autumn" | "winter" {
  const m = date.getMonth() + 1;
  if (m >= 3 && m < 6) return "spring";
  if (m >= 6 && m < 9) return "summer";
  if (m >= 9 && m < 12) return "autumn";
  return "winter";
}

// Précision à la minute près
function isDayMinute(minute: number, sunrise: number, sunset: number) {
  // minute: 0 à 1439
  const hour = minute / 60;
  if (sunrise < sunset) {
    return hour >= sunrise && hour < sunset;
  } else {
    // Cas où le jour traverse minuit
    return hour >= sunrise || hour < sunset;
  }
}

export const CircularCalendar: React.FC<Props> = ({
  sunrise,
  sunset,
  events,
  season,
  onEventClick,
  size = DEFAULT_SIZE,
  eventIcon,
}) => {
  const now = new Date();
  const hourDecimal =
    now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  const hour = now.getHours();
  const currentSeason = season || getSeason(now);

  const event = getCurrentOrNextEvent(events, hour);

  const SIZE = size;
  const RADIUS = SIZE / 2 - 8; // 8px de marge intérieure
  const INNER_RADIUS = RADIUS - RING_THICKNESS;

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const blockAngle = 360 / SEGMENTS;

  // 1440 blocs (1 par minute)
  const wedges = Array.from({ length: SEGMENTS }).map((_, i) => {
    const startAngle = -90 + i * blockAngle;
    const endAngle = startAngle + blockAngle;

    // Séparation visuelle à chaque heure pile : transparent
    if (i % 60 === 0) {
      return {
        d: getWedgePath(cx, cy, RADIUS, INNER_RADIUS, startAngle, endAngle),
        fill: "none", // transparent
        key: i,
      };
    }

    const isDayBlock = isDayMinute(i, sunrise, sunset);
    return {
      d: getWedgePath(cx, cy, RADIUS, INNER_RADIUS, startAngle, endAngle),
      fill: isDayBlock ? SEASON_COLORS[currentSeason] : NIGHT_COLOR,
      key: i,
    };
  });

  // Ligne de curseur
  const cursorAngle = (hourDecimal / 24) * 360 - 90;
  const cursorRad = (Math.PI / 180) * cursorAngle;
  const cursorX1 = cx + INNER_RADIUS * Math.cos(cursorRad);
  const cursorY1 = cy + INNER_RADIUS * Math.sin(cursorRad);
  const cursorX2 = cx + RADIUS * Math.cos(cursorRad);
  const cursorY2 = cy + RADIUS * Math.sin(cursorRad);

  // 24 séparateurs horaires (traits fins, couleur de fond)
  const hourDividers = Array.from({ length: 24 }).map((_, i) => {
    const angle = ((i / 24) * 2 * Math.PI) - Math.PI / 2;
    const x1 = cx + INNER_RADIUS * Math.cos(angle);
    const y1 = cy + INNER_RADIUS * Math.sin(angle);
    const x2 = cx + RADIUS * Math.cos(angle);
    const y2 = cy + RADIUS * Math.sin(angle);
    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={BACKGROUND_COLOR}
        strokeWidth={2}
        opacity={1}
      />
    );
  });

  // Chiffres horaires fusionnés avec l’anneau, police Inter sans serif
  const hourNumbers = Array.from({ length: 24 }).map((_, i) => {
    const angle = ((i / 24) * 2 * Math.PI) - Math.PI / 2;
    const r = RADIUS - RING_THICKNESS / 2 + 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle) + 4;

    const isCurrent = i === hour;
    return (
      <text
        key={i}
        x={x}
        y={y}
        textAnchor="middle"
        fontSize="15"
        fontWeight={isCurrent ? "bold" : "600"}
        fill="#fff"
        style={{
          pointerEvents: "none",
          userSelect: "none",
          filter: isCurrent
            ? "drop-shadow(0 0 6px #2563ebcc) drop-shadow(0 1px 0 #0008)"
            : "drop-shadow(0 1px 0 #0008)",
          opacity: isCurrent ? 1 : 0.92,
          fontFamily: "'Inter', 'Montserrat', Arial, Helvetica, sans-serif",
          paintOrder: "stroke",
          stroke: "#000",
          strokeWidth: isCurrent ? 0.7 : 0.5,
        }}
      >
        {i}
      </text>
    );
  });

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Segments horaires à la minute près, avec séparation nette chaque heure */}
        {wedges.map((w) => (
          <path
            key={w.key}
            d={w.d}
            fill={w.fill}
            stroke="none"
          />
        ))}
        {/* Séparateurs horaires */}
        {hourDividers}
        {/* Chiffres horaires fusionnés avec l’anneau */}
        {hourNumbers}
        {/* Ligne de curseur */}
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
      {/* Centre info */}
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
        <div className={event ? "text-lg font-bold mb-1 underline text-blue-700 flex items-center justify-center" : "text-lg font-bold mb-1"}>
          {event && eventIcon}
          {event ? event.title : "No events"}
        </div>
        <div className="text-sm text-gray-600">
          {event ? event.place : "Enjoy your time!"}
        </div>
      </div>
    </div>
  );
};