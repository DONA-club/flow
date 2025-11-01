import React from "react";
import { Sunrise, Sunset } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

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
  latitude?: number;
  longitude?: number;
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
const BACKGROUND_COLOR = "#f9fafb";
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

function isDayMinute(minute: number, sunrise: number, sunset: number) {
  const hour = minute / 60;
  if (sunrise < sunset) {
    return hour >= sunrise && hour < sunset;
  } else {
    return hour >= sunrise || hour < sunset;
  }
}

function formatHour(decimal: number) {
  const h = Math.floor(decimal)
    .toString()
    .padStart(2, "0");
  const m = Math.round((decimal % 1) * 60)
    .toString()
    .padStart(2, "0");
  return `${h}:${m}`;
}

function formatCoord(coord?: number, type: "lat" | "lon" = "lat") {
  if (typeof coord !== "number") return "";
  const abs = Math.abs(coord).toFixed(5);
  const dir =
    type === "lat"
      ? coord >= 0
        ? "N"
        : "S"
      : coord >= 0
      ? "E"
      : "W";
  return `${abs}°${dir}`;
}

export const CircularCalendar: React.FC<Props> = ({
  sunrise,
  sunset,
  events,
  season,
  onEventClick,
  size = DEFAULT_SIZE,
  eventIcon,
  latitude,
  longitude,
}) => {
  const now = new Date();
  const hourDecimal =
    now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  const hour = now.getHours();
  const currentSeason = season || getSeason(now);

  const event = getCurrentOrNextEvent(events, hour);

  const SIZE = size;
  const RADIUS = SIZE / 2 - 8;
  const INNER_RADIUS = RADIUS - RING_THICKNESS;

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const blockAngle = 360 / SEGMENTS;

  // 1440 blocs (1 par minute)
  const wedges = Array.from({ length: SEGMENTS }).map((_, i) => {
    const startAngle = -90 + i * blockAngle;
    const endAngle = startAngle + blockAngle;

    if (i % 60 === 0) {
      return {
        d: getWedgePath(cx, cy, RADIUS, INNER_RADIUS, startAngle, endAngle),
        fill: "none",
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

  // Position des icônes sunrise/sunset sur la graduation
  const rMid = (INNER_RADIUS + RADIUS) / 2;
  const angleFromHour = (time: number) => (time / 24) * 360 - 90;
  const toPoint = (angleDeg: number, r: number) => {
    const rad = (Math.PI / 180) * angleDeg;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const sunriseAngle = angleFromHour(sunrise);
  const sunsetAngle = angleFromHour(sunset);
  const sunrisePt = toPoint(sunriseAngle, rMid);
  const sunsetPt = toPoint(sunsetAngle, rMid);
  const sunriseRotation = sunriseAngle + 90;
  const sunsetRotation = sunsetAngle + 90;

  // 24 séparateurs horaires
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

  // Chiffres horaires centrés, police réduite
  const scale = SIZE / (DEFAULT_SIZE || 1);
  // Taille proportionnelle au diamètre, bornée pour rester lisible
  const hourFontSize = Math.max(8, Math.min(RING_THICKNESS * scale * 0.72, SIZE * 0.045));
  // Épaisseur du contour du texte qui suit l'échelle
  const strokeWidthCurrent = Math.max(0.4, 0.7 * scale);
  const strokeWidthNormal = Math.max(0.3, 0.5 * scale);
  // Tailles du texte central proportionnelles à la taille du cercle (caps pour lisibilité)
  const titleFontSize = Math.max(12, Math.min(18 * scale, 18)); // équiv. text-lg max
  const subFontSize = Math.max(10, Math.min(14 * scale, 14));   // équiv. text-sm max
  const metaFontSize = Math.max(9, Math.min(12 * scale, 12));   // équiv. text-xs max
  const metaIconSize = Math.round(Math.max(12, Math.min(16 * scale, 16))); // icônes sunrise/sunset

  const hourNumbers = Array.from({ length: 24 }).map((_, i) => {
    const angle = ((i / 24) * 2 * Math.PI) - Math.PI / 2;
    const r = (RADIUS + INNER_RADIUS) / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);

    const isCurrent = i === hour;
    return (
      <text
        key={i}
        x={x}
        y={y}
        textAnchor="middle"
        fontSize={hourFontSize}
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
          strokeWidth: isCurrent ? strokeWidthCurrent : strokeWidthNormal,
        }}
        alignmentBaseline="middle"
        dominantBaseline="middle"
      >
        {i}
      </text>
    );
  });

  return (
    <div className="flex flex-col items-center justify-center">
      <div style={{ position: "relative", width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <defs>
            <filter
              id="ringEdgeBlur"
              filterUnits="userSpaceOnUse"
              x={cx - (RADIUS + RING_THICKNESS)}
              y={cy - (RADIUS + RING_THICKNESS)}
              width={(RADIUS + RING_THICKNESS) * 2}
              height={(RADIUS + RING_THICKNESS) * 2}
            >
              <feGaussianBlur stdDeviation={Math.max(2, RING_THICKNESS * 0.15)} />
            </filter>
            <mask
              id="ringFadeMask"
              maskUnits="userSpaceOnUse"
              maskContentUnits="userSpaceOnUse"
              x={0}
              y={0}
              width={SIZE}
              height={SIZE}
            >
              {/* Base du masque: invisible par défaut */}
              <rect x={0} y={0} width={SIZE} height={SIZE} fill="black" />
              {/* Anneau blanc (visible) avec flou sur les bords */}
              <g filter="url(#ringEdgeBlur)">
                <circle
                  cx={cx}
                  cy={cy}
                  r={(INNER_RADIUS + RADIUS) / 2}
                  stroke="white"
                  strokeWidth={RING_THICKNESS}
                  fill="none"
                />
              </g>
            </mask>
          </defs>

          {/* Appliquer le masque aux secteurs de l'anneau */}
          <g mask="url(#ringFadeMask)">
            {wedges.map((w) => (
              <path
                key={w.key}
                d={w.d}
                fill={w.fill}
                stroke="none"
              />
            ))}
          </g>

          {hourDividers}
          {hourNumbers}
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
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
          onClick={() => event && onEventClick && onEventClick(event)}
          tabIndex={event ? 0 : -1}
          role={event ? "button" : undefined}
          aria-label={event ? `Open event: ${event.title}` : undefined}
        >
          <div
            className={event ? "text-lg font-bold mb-1 underline text-blue-700 flex items-center justify-center" : "text-lg font-bold mb-1"}
            style={{ fontSize: titleFontSize, lineHeight: 1.15 }}
          >
            {event && eventIcon}
            {event ? event.title : "No events"}
          </div>
          <div className="text-sm text-gray-600" style={{ fontSize: subFontSize, lineHeight: 1.25 }}>
            {event ? event.place : "Enjoy your time!"}
          </div>
        </div>

        {/* Icône Sunrise alignée sur sa graduation avec tooltip */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="absolute"
              style={{
                left: sunrisePt.x - metaIconSize / 2,
                top: sunrisePt.y - metaIconSize / 2,
                transform: `rotate(${sunriseRotation}deg)`,
                transformOrigin: "center",
              }}
              aria-label={`Sunrise at ${formatHour(sunrise)}`}
            >
              <Sunrise
                className="text-yellow-400"
                size={metaIconSize}
                style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.35))" }}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            {formatHour(sunrise)}
          </TooltipContent>
        </Tooltip>

        {/* Icône Sunset alignée sur sa graduation avec tooltip */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="absolute"
              style={{
                left: sunsetPt.x - metaIconSize / 2,
                top: sunsetPt.y - metaIconSize / 2,
                transform: `rotate(${sunsetRotation}deg)`,
                transformOrigin: "center",
              }}
              aria-label={`Sunset at ${formatHour(sunset)}`}
            >
              <Sunset
                className="text-orange-400"
                size={metaIconSize}
                style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.35))" }}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            {formatHour(sunset)}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};