import React from "react";
import { Sunrise, Sunset } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

type Event = {
  title: string;
  place: string;
  start: number;
  end: number;
  url?: string;
};

type Props = {
  sunrise: number;
  sunset: number;
  events: Event[];
  season?: "spring" | "summer" | "autumn" | "winter";
  onEventClick?: (event: Event) => void;
  size?: number;
  latitude?: number;
  longitude?: number;
  wakeHour?: number | null;
  bedHour?: number | null;
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

function getDaysDifference(date1: Date, date2: Date): number {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.round((d1.getTime() - d2.getTime()) / (24 * 60 * 60 * 1000));
}

export const CircularCalendar: React.FC<Props> = ({
  sunrise,
  sunset,
  events,
  season,
  onEventClick,
  size = DEFAULT_SIZE,
  latitude,
  longitude,
  wakeHour,
  bedHour,
}) => {
  const [now, setNow] = React.useState<Date>(() => new Date());
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  React.useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

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
  const titleFontSize = Math.max(14, Math.min(22 * scale, 22));
  const subFontSize = Math.max(12, Math.min(16 * scale, 16));
  const metaFontSize = Math.max(11, Math.min(14 * scale, 14));
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

  // Couleur du curseur adaptée au thème
  const cursorColor = isDarkMode ? "#bfdbfe" : "#1d4ed8";
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

  const arcStroke = Math.max(2, Math.round(3 * scale));
  const arcGap = Math.max(1, Math.round(scale));
  const innerArcRadius = Math.max(arcStroke, INNER_RADIUS - arcGap - arcStroke / 2);
  const outsideArcRadius = RADIUS + arcGap + arcStroke / 2;

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
      futureArc = { start: wAngle, end: bAngle };
    } else if (n >= b) {
      pastArc = { start: wAngle, end: bAngle };
    } else {
      pastArc = { start: wAngle, end: nAngle };
      futureArc = { start: nAngle, end: bAngle };
    }
  } else {
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

  const dividerWidth = Math.max(1, Math.round(2 * scale));
  const hourSlits = Array.from({ length: 24 }).map((_, i) => {
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
        stroke="black"
        strokeWidth={dividerWidth}
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

  // Arcs pour les événements avec couleurs par jour
  const nowMs = now.getTime();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const eventsWithDates = events
    .map((e) => {
      const start = getEventStartDate(e, now);
      const end = start ? getEventEndDate(e, start) : null;
      return { e, start, end };
    })
    .filter((x) => x.start && x.end) as { e: Event; start: Date; end: Date }[];

  // Filtrer les événements d'aujourd'hui et à venir
  const upcomingEvents = eventsWithDates
    .filter((x) => x.end.getTime() >= nowMs)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  // Couleurs par jour
  const dayColors = [
    isDarkMode ? "#bfdbfe" : "#1d4ed8", // Aujourd'hui
    isDarkMode ? "#93c5fd" : "#3b82f6", // Demain
    isDarkMode ? "#60a5fa" : "#2563eb", // Après-demain
  ];

  const eventArcs = upcomingEvents.map((item, idx) => {
    const { e, start, end } = item;
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    
    const startAngle = angleFromHour(startHour);
    const endAngle = angleFromHour(endHour);

    // Événement en cours ou à venir ?
    const isCurrent = start.getTime() <= nowMs && end.getTime() > nowMs;
    
    // Calculer le jour de l'événement
    const dayDiff = getDaysDifference(start, now);
    const colorIndex = Math.min(dayDiff, dayColors.length - 1);
    const color = dayColors[colorIndex];
    
    // Position radiale : les plus proches au bord intérieur, les suivants vers l'extérieur
    const totalEvents = upcomingEvents.length;
    const radiusStep = RING_THICKNESS / Math.max(totalEvents, 1);
    const eventRadius = INNER_RADIUS + radiusStep * idx + radiusStep / 2;

    const opacity = isCurrent ? 1 : 0.7;

    return (
      <path
        key={`event-${idx}`}
        d={getArcPath(cx, cy, eventRadius, startAngle, endAngle)}
        fill="none"
        stroke={color}
        strokeOpacity={opacity}
        strokeWidth={Math.max(2, radiusStep * 0.8)}
        strokeLinecap="round"
        style={{ pointerEvents: "none" }}
      />
    );
  });

  // Style nocturne pour les périodes de sommeil
  const sleepOverlays: JSX.Element[] = [];
  
  if (typeof wakeHour === "number" && typeof bedHour === "number") {
    // Période de sommeil principale (coucher -> lever)
    const bedAngle = angleFromHour(bedHour);
    const wakeAngle = angleFromHour(wakeHour);
    
    sleepOverlays.push(
      <path
        key="sleep-main"
        d={getWedgePath(cx, cy, RADIUS, INNER_RADIUS, bedAngle, wakeAngle)}
        fill="rgba(0, 0, 0, 0.4)"
        style={{ pointerEvents: "none" }}
      />
    );

    // Période de sommeil recommandée (9h avant le lever)
    const recommendedSleepStart = (wakeHour - 9 + 24) % 24;
    const recommendedAngle = angleFromHour(recommendedSleepStart);
    
    sleepOverlays.push(
      <path
        key="sleep-recommended"
        d={getWedgePath(cx, cy, RADIUS, INNER_RADIUS, recommendedAngle, bedAngle)}
        fill="rgba(0, 0, 0, 0.2)"
        style={{ pointerEvents: "none" }}
      />
    );
  }

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
              <g>
                {hourSlits}
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

          {/* Overlays de sommeil */}
          <g mask="url(#ringFadeMask)">
            {sleepOverlays}
          </g>

          {hoverRing && pastArc && (
            <path
              d={getArcPath(cx, cy, innerArcRadius, pastArc.start, pastArc.end)}
              fill="none"
              stroke={SEASON_COLORS[currentSeason]}
              strokeOpacity={0.95}
              strokeWidth={arcStroke}
              strokeLinecap="round"
              style={{ pointerEvents: "none" }}
            />
          )}

          {hoverRing && futureArc && (
            <path
              d={getArcPath(cx, cy, outsideArcRadius, futureArc.start, futureArc.end)}
              fill="none"
              stroke={SEASON_COLORS[currentSeason]}
              strokeOpacity={0.6}
              strokeWidth={arcStroke}
              strokeLinecap="round"
              style={{ pointerEvents: "none" }}
            />
          )}

          {/* Arcs des événements */}
          {eventArcs}

          {hourNumbers}

          <line
            x1={cursorX1}
            y1={cursorY1}
            x2={cursorX2}
            y2={cursorY2}
            stroke={cursorColor}
            strokeWidth={3}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${cursorColor}88)` }}
          />
        </svg>

        <div
          className="absolute left-1/2 top-1/2 flex flex-col items-center justify-center text-center select-none"
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
            userSelect: "none",
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            msUserSelect: "none",
          }}
          onClick={() => event && onEventClick && onEventClick(event)}
          tabIndex={event ? 0 : -1}
          role={event ? "button" : undefined}
          aria-label={event ? `Open event: ${event.title}` : undefined}
        >
          <div
            className="mb-1 text-xs calendar-center-meta"
            style={{ fontSize: metaFontSize, lineHeight: 1.1 }}
            aria-label={`Heure actuelle ${formatHour(hourDecimal)}`}
          >
            {formatHour(hourDecimal)}
          </div>

          {event && dayBadge && (
            <div
              className="mb-1 text-xs calendar-center-meta"
              style={{ fontSize: metaFontSize, lineHeight: 1.1 }}
              aria-label={dayBadge}
            >
              {dayBadge}
            </div>
          )}

          <div
            className="calendar-center-title font-semibold mb-1 flex items-center justify-center tracking-tight transition-colors"
            style={{ fontSize: titleFontSize, lineHeight: 1.15 }}
          >
            {event ? event.title : "No events"}
          </div>

          <div
            className="calendar-center-sub"
            style={{ fontSize: subFontSize, lineHeight: 1.25 }}
          >
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
                <Sunrise className="text-yellow-400" size={metaIconSize} />
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
                <Sunset className="text-orange-400" size={metaIconSize} />
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