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
  wakeHour?: number | null; // heure décimale locale
  bedHour?: number | null;  // heure décimale locale
};

const DEFAULT_SIZE = 320;
const RING_THICKNESS = 32;

const SEASON_COLORS: Record<string, string> = {
  spring: "#4ade80",
  summer: "#fde047",
  autumn: "#fb923c",
  winter: "#7dd3fc",
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

function getArcPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const startRad = (Math.PI / 180) * startAngle;
  const endRad = (Math.PI / 180) * endAngle;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const delta = ((endAngle - startAngle + 360) % 360);
  const largeArc = delta > 180 ? 1 : 0;
  const sweep = 1;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} ${sweep} ${x2} ${y2}`;
}

function getEventStartDate(e: any, nowRef: Date): Date | null {
  const raw = (e as any)?.raw;
  const iso = raw?.start?.dateTime || raw?.start?.date || null;
  if (iso) return new Date(iso);
  const base = new Date(nowRef);
  const hours = Math.floor(e.start || 0);
  const minutes = Math.round(((e.start || 0) % 1) * 60);
  base.setHours(hours, minutes, 0, 0);
  return base;
}

function getEventEndDate(e: any, startDate: Date): Date | null {
  const raw = (e as any)?.raw;
  const iso = raw?.end?.dateTime || raw?.end?.date || null;
  if (iso) return new Date(iso);
  const end = new Date(startDate);
  const hours = Math.floor(e.end || 0);
  const minutes = Math.round(((e.end || 0) % 1) * 60);
  end.setHours(hours, minutes, 0, 0);
  return end;
}

function getCurrentOrNextEvent(events: Event[], nowDate: Date): Event | undefined {
  const nowMs = nowDate.getTime();
  const withDates = events
    .map((e) => {
      const start = getEventStartDate(e, nowDate);
      const end = start ? getEventEndDate(e, start) : null;
      return { e, start, end };
    })
    .filter((x) => x.start) as { e: Event; start: Date; end: Date | null }[];

  const current = withDates.find((x) => {
    const s = x.start.getTime();
    const e = x.end ? x.end.getTime() : s;
    return nowMs >= s && nowMs < e;
  });
  if (current) return current.e;

  const upcoming = withDates
    .filter((x) => x.start.getTime() >= nowMs)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  return upcoming.length > 0 ? upcoming[0].e : undefined;
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
  wakeHour,
  bedHour,
}) => {
  const now = new Date();
  const hourDecimal =
    now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  const hour = now.getHours();
  const currentSeason = season || getSeason(now);

  const event = getCurrentOrNextEvent(events, now);
  let dayBadge: string | null = null;
  if (event) {
    const startDate = getEventStartDate(event as any, now);
    if (startDate) {
      const startStartOfDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
      const nowStartOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const diffDays = Math.round((startStartOfDay - nowStartOfDay) / (24 * 60 * 60 * 1000));
      if (diffDays > 0) {
        dayBadge = diffDays === 1 ? "Demain" : `Dans ${diffDays} jours`;
      }
    }
  }

  const SIZE = size;
  const RADIUS = SIZE / 2 - 8;
  const INNER_RADIUS = RADIUS - RING_THICKNESS;

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const blockAngle = 360 / SEGMENTS;

  const scale = SIZE / (DEFAULT_SIZE || 1);
  const hourFontSize = Math.max(8, Math.min(RING_THICKNESS * scale * 0.72, SIZE * 0.045));
  const strokeWidthCurrent = Math.max(0.4, 0.7 * scale);
  const strokeWidthNormal = Math.max(0.3, 0.5 * scale);
  const titleFontSize = Math.max(12, Math.min(18 * scale, 18));
  const subFontSize = Math.max(10, Math.min(14 * scale, 14));
  const metaFontSize = Math.max(9, Math.min(12 * scale, 12));
  const metaIconSize = Math.round(Math.max(12, Math.min(16 * scale, 16)));

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

  const cursorAngle = (hourDecimal / 24) * 360 - 90;
  const cursorRad = (Math.PI / 180) * cursorAngle;
  const cursorX1 = cx + INNER_RADIUS * Math.cos(cursorRad);
  const cursorY1 = cy + INNER_RADIUS * Math.sin(cursorRad);
  const cursorX2 = cx + RADIUS * Math.cos(cursorRad);
  const cursorY2 = cy + RADIUS * Math.sin(cursorRad);

  const [hoverRing, setHoverRing] = React.useState(false);

  const angleFromHour = (time: number) => (time / 24) * 360 - 90;
  const toPoint = (angleDeg: number, r: number) => {
    const rad = (Math.PI / 180) * angleDeg;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    };
  const sunriseAngle = angleFromHour(sunrise);
  const sunsetAngle = angleFromHour(sunset);
  const iconGap = Math.max(2, Math.round(metaIconSize * 0.12));
  const iconRadius = Math.max(0, INNER_RADIUS - metaIconSize / 2 - iconGap);
  const sunrisePt = toPoint(sunriseAngle, iconRadius);
  const sunsetPt = toPoint(sunsetAngle, iconRadius);
  const sunriseRotation = sunriseAngle + 90;
  const sunsetRotation = sunsetAngle + 90;

  // Arcs concentriques:
  // - ARC PASSÉ (écoulé depuis le lever) près du bord intérieur
  // - ARC FUTUR (restant jusqu’au coucher) à l’extérieur du ring
  const innerInset = Math.max(2, Math.round(RING_THICKNESS * 0.18));
  const innerArcRadius = Math.max(INNER_RADIUS + innerInset, INNER_RADIUS + 2);
  const outerOutset = Math.max(6, Math.round(RING_THICKNESS * 0.22));
  const outsideArcRadius = RADIUS + outerOutset;
  const arcStroke = Math.max(2, Math.round(3 * scale));

  const nowAngleDeg = angleFromHour(hourDecimal);
  let pastArc: { start: number; end: number } | null = null;
  let futureArc: { start: number; end: number } | null = null;

  if (typeof wakeHour === "number" && typeof bedHour === "number") {
    let w = wakeHour;
    let b = bedHour;
    let n = hourDecimal;
    if (b <= w) b += 24;
    if (n < w) n += 24;

    const wAngle = angleFromHour(wakeHour % 24);
    const bAngle = angleFromHour(bedHour % 24);
    const nAngle = angleFromHour(hourDecimal % 24);

    if (n <= w) {
      // Avant le lever
      futureArc = { start: wAngle, end: bAngle };
    } else if (n >= b) {
      // Après le coucher
      pastArc = { start: wAngle, end: bAngle };
    } else {
      // Entre lever et coucher
      pastArc = { start: wAngle, end: nAngle };
      futureArc = { start: nAngle, end: bAngle };
    }
  } else {
    // Fallback: arcs liés au jour (sunrise/sunset)
    if (sunrise < sunset) {
      if (hourDecimal <= sunrise) {
        futureArc = { start: sunriseAngle, end: sunsetAngle };
      } else if (hourDecimal >= sunset) {
        pastArc = { start: sunriseAngle, end: sunsetAngle };
      } else {
        pastArc = { start: sunriseAngle, end: nowAngleDeg };
        futureArc = { start: nowAngleDeg, end: sunsetAngle };
      }
    }
  }

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

  const hourNumbers = Array.from({ length: 24 }).map((_, i) => {
    const angle = ((i / 24) * 2 * Math.PI) - Math.PI / 2;
    const angleDeg = (i / 24) * 360 - 90;
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
        transform={`rotate(${angleDeg + 90} ${x} ${y})`}
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
          fontFamily: "'Montserrat', 'Inter', Arial, Helvetica, sans-serif",
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
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ overflow: "visible" }}
        >
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
              <rect x={0} y={0} width={SIZE} height={SIZE} fill="black" />
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

          <g
            mask="url(#ringFadeMask)"
            onMouseEnter={() => setHoverRing(true)}
            onMouseLeave={() => setHoverRing(false)}
          >
            {wedges.map((w) => (
              <path
                key={w.key}
                d={w.d}
                fill={w.fill}
                stroke="none"
              />
            ))}
          </g>

          {/* Arc écoulé (intérieur) */}
          {hoverRing && pastArc && (
            <path
              d={getArcPath(cx, cy, innerArcRadius, pastArc.start, pastArc.end)}
              fill="none"
              stroke={SEASON_COLORS[currentSeason]}
              strokeOpacity={0.95}
              strokeWidth={arcStroke}
              strokeLinecap="round"
            />
          )}

          {/* Arc restant (extérieur) */}
          {hoverRing && futureArc && (
            <path
              d={getArcPath(cx, cy, outsideArcRadius, futureArc.start, futureArc.end)}
              fill="none"
              stroke={SEASON_COLORS[currentSeason]}
              strokeOpacity={0.6}
              strokeWidth={arcStroke}
              strokeLinecap="round"
            />
          )}

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
          {event && dayBadge && (
            <div
              className="mb-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-gray-900 text-white/90 text-xs"
              style={{ fontSize: metaFontSize, lineHeight: 1.1 }}
              aria-label={dayBadge}
            >
              {dayBadge}
            </div>
          )}
          <div
            className={event ? "text-lg font-semibold mb-1 text-blue-700 hover:text-blue-800 transition-colors flex items-center justify-center tracking-tight" : "text-lg font-semibold mb-1 tracking-tight"}
            style={{ fontSize: titleFontSize, lineHeight: 1.15 }}
          >
            {event && eventIcon}
            {event ? event.title : "No events"}
          </div>
          <div className="text-sm text-gray-600" style={{ fontSize: subFontSize, lineHeight: 1.25 }}>
            {event ? event.place : "Enjoy your time!"}
          </div>
        </div>

        {!hoverRing && (
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
              />
            </div>
          </TooltipTrigger>
          <TooltipContent
            side={(() => {
              const dx = cx - sunrisePt.x;
              const dy = cy - sunrisePt.y;
              if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
              return dy > 0 ? "bottom" : "top";
            })()}
            sideOffset={6}
            className="bg-transparent border-0 shadow-none p-0 text-gray-600 font-light"
          >
            <span style={{ fontSize: metaFontSize, lineHeight: 1.1 }}>
              {formatHour(sunrise)}
            </span>
          </TooltipContent>
        </Tooltip>
        )}

        {!hoverRing && (
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
              />
            </div>
          </TooltipTrigger>
          <TooltipContent
            side={(() => {
              const dx = cx - sunsetPt.x;
              const dy = cy - sunsetPt.y;
              if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
              return dy > 0 ? "bottom" : "top";
            })()}
            sideOffset={6}
            className="bg-transparent border-0 shadow-none p-0 text-gray-600 font-light"
          >
            <span style={{ fontSize: metaFontSize, lineHeight: 1.1 }}>
              {formatHour(sunset)}
            </span>
          </TooltipContent>
        </Tooltip>
        )}
      </div>
    </div>
  );
};