import React from "react";
import { Sunrise, Sunset } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import EventInfoBubble from "@/components/EventInfoBubble";

type Event = {
  title: string;
  place: string;
  start: number;
  end: number;
  url?: string;
  raw?: any;
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
  externalSelectedEvent?: Event | null;
  onEventBubbleClosed?: () => void;
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

function formatEventDate(date: Date): string {
  const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  
  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  
  return `${dayName} ${day} ${month}, à ${hours}h${minutes}`;
}

function formatTimeRemaining(startDate: Date, now: Date): string {
  const diff = startDate.getTime() - now.getTime();
  
  if (diff <= 0) {
    return "En cours";
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  const parts: string[] = [];
  
  if (days > 0) {
    parts.push(`${days} jour${days > 1 ? 's' : ''}`);
  }
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes} min`);
  }
  
  return `Dans ${parts.join(', ')}`;
}

function getDaysDifference(date1: Date, date2: Date): number {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.round((d1.getTime() - d2.getTime()) / (24 * 60 * 60 * 1000));
}

function getTimeIndicator(date: Date, now: Date): string {
  const dayDiff = getDaysDifference(date, now);
  
  if (dayDiff === 0) return "Aujourd'hui";
  if (dayDiff === 1) return "Demain";
  if (dayDiff === 2) return "Dans 2 jours";
  if (dayDiff === 3) return "Dans 3 jours";
  return `Dans ${dayDiff} jours`;
}

function formatDateLabel(date: Date): string {
  const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  
  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${dayName} ${day} ${month} ${year}`;
}

function extractVideoConferenceLink(event: Event): string | null {
  const raw = event.raw;
  
  if (!raw) return null;

  const videoPatterns = [
    /https?:\/\/[^\s<>"]*meet\.google\.com[^\s<>"]*/gi,
    /https?:\/\/[^\s<>"]*zoom\.us[^\s<>"]*/gi,
    /https?:\/\/[^\s<>"]*teams\.microsoft\.com[^\s<>"]*/gi,
    /https?:\/\/[^\s<>"]*webex\.com[^\s<>"]*/gi,
    /https?:\/\/[^\s<>"]*gotomeeting\.com[^\s<>"]*/gi,
    /https?:\/\/[^\s<>"]*whereby\.com[^\s<>"]*/gi,
    /https?:\/\/[^\s<>"]*jitsi[^\s<>"]*/gi,
  ];

  if (event.place) {
    for (const pattern of videoPatterns) {
      const match = event.place.match(pattern);
      if (match && match[0]) return match[0];
    }
  }

  if (raw.description) {
    for (const pattern of videoPatterns) {
      const match = raw.description.match(pattern);
      if (match && match[0]) return match[0];
    }
  }

  if (raw.body?.content) {
    for (const pattern of videoPatterns) {
      const match = raw.body.content.match(pattern);
      if (match && match[0]) return match[0];
    }
  }

  if (raw.location) {
    const locationStr = typeof raw.location === 'string' 
      ? raw.location 
      : raw.location.displayName || '';
    
    for (const pattern of videoPatterns) {
      const match = locationStr.match(pattern);
      if (match && match[0]) return match[0];
    }
  }

  if (raw.conferenceData?.entryPoints) {
    const videoEntry = raw.conferenceData.entryPoints.find(
      (ep: any) => ep.entryPointType === 'video'
    );
    if (videoEntry?.uri) return videoEntry.uri;
  }

  if (raw.onlineMeeting?.joinUrl) return raw.onlineMeeting.joinUrl;
  if (raw.hangoutLink) return raw.hangoutLink;

  if (event.place && event.place.toLowerCase().includes("microsoft teams")) {
    const rawStr = JSON.stringify(raw);
    for (const pattern of videoPatterns) {
      const match = rawStr.match(pattern);
      if (match && match[0]) return match[0];
    }
  }

  return null;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function formatDateShort(date: Date): string {
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
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
  externalSelectedEvent,
  onEventBubbleClosed,
}) => {
  const [now, setNow] = React.useState<Date>(() => new Date());
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<Event | null>(null);
  const [hoveredEventIndex, setHoveredEventIndex] = React.useState<number | null>(null);
  const [cursorEventIndex, setCursorEventIndex] = React.useState<number | null>(null);
  
  const [isScrolling, setIsScrolling] = React.useState(false);
  const [isReturning, setIsReturning] = React.useState(false);
  const [showTimeLabel, setShowTimeLabel] = React.useState(false);
  const [isLabelFadingOut, setIsLabelFadingOut] = React.useState(false);
  
  const [virtualDateTime, setVirtualDateTime] = React.useState<Date>(() => new Date());
  const [showDateLabel, setShowDateLabel] = React.useState(false);
  
  const scrollTimeoutRef = React.useRef<number | null>(null);
  const labelTimeoutRef = React.useRef<number | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);
  
  // Ref pour stocker virtualDateTime sans déclencher de re-render
  const virtualDateTimeRef = React.useRef(virtualDateTime);
  
  React.useEffect(() => {
    virtualDateTimeRef.current = virtualDateTime;
  }, [virtualDateTime]);

  React.useEffect(() => {
    if (externalSelectedEvent) {
      setSelectedEvent(externalSelectedEvent);
      setCursorEventIndex(null);
    }
  }, [externalSelectedEvent]);

  React.useEffect(() => {
    const id = window.setInterval(() => {
      const newNow = new Date();
      setNow(newNow);
      
      if (!isScrolling && !isReturning) {
        setVirtualDateTime(newNow);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [isScrolling, isReturning]);

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
    const container = document.getElementById('calendar-container');
    const pageContainer = document.getElementById('calendar-page-container');
    
    if (!container || !pageContainer) return;

    const updateGradientCenter = () => {
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const percentX = (centerX / window.innerWidth) * 100;
      const percentY = (centerY / window.innerHeight) * 100;
      
      pageContainer.style.setProperty('--calendar-center-x', `${percentX}%`);
      pageContainer.style.setProperty('--calendar-center-y', `${percentY}%`);
    };

    updateGradientCenter();
    window.addEventListener('resize', updateGradientCenter);
    window.addEventListener('scroll', updateGradientCenter);
    
    return () => {
      window.removeEventListener('resize', updateGradientCenter);
      window.removeEventListener('scroll', updateGradientCenter);
    };
  }, [size]);

  // Préchargement des événements : on charge 1 jour avant et 3 jours après la date virtuelle
  const preloadedEvents = React.useMemo(() => {
    const virtualDayStart = new Date(virtualDateTime);
    virtualDayStart.setHours(0, 0, 0, 0);
    
    // 1 jour avant pour le scroll arrière
    const oneDayBefore = new Date(virtualDayStart);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);
    
    // 3 jours après pour le scroll avant
    const threeDaysLater = new Date(virtualDayStart);
    threeDaysLater.setDate(threeDaysLater.getDate() + 4);

    const eventsWithDates = events
      .map((e) => {
        const start = getEventStartDate(e, now);
        const end = start ? getEventEndDate(e, start) : null;
        return { e, start, end };
      })
      .filter((x) => x.start && x.end) as { e: Event; start: Date; end: Date }[];

    const filtered = eventsWithDates.filter((x) => {
      return x.start.getTime() >= oneDayBefore.getTime() && 
             x.start.getTime() < threeDaysLater.getTime();
    }).sort((a, b) => a.start.getTime() - b.start.getTime());

    return filtered;
  }, [events, virtualDateTime, now]);

  // Événements visibles sur la roue (3 jours à partir de virtualDateTime)
  const upcomingEvents = React.useMemo(() => {
    const virtualDayStart = new Date(virtualDateTime);
    virtualDayStart.setHours(0, 0, 0, 0);
    
    const threeDaysLater = new Date(virtualDayStart);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    return preloadedEvents.filter((x) => {
      return x.start.getTime() >= virtualDayStart.getTime() && 
             x.start.getTime() < threeDaysLater.getTime();
    });
  }, [preloadedEvents, virtualDateTime]);

  const hourDecimal = virtualDateTime.getHours() + virtualDateTime.getMinutes() / 60 + virtualDateTime.getSeconds() / 3600;
  const hour = virtualDateTime.getHours();
  const currentSeason = season || getSeason(virtualDateTime);

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

  const cursorColor = isDarkMode ? "#bfdbfe" : "#1d4ed8";
  
  const cursorAngle = (hourDecimal / 24) * 360 - 90;
  const cursorRad = (Math.PI / 180) * cursorAngle;
  
  const cursorExtension = RING_THICKNESS * 0.2;
  const cursorX1 = cx + (INNER_RADIUS - cursorExtension) * Math.cos(cursorRad);
  const cursorY1 = cy + (INNER_RADIUS - cursorExtension) * Math.sin(cursorRad);
  const cursorX2 = cx + (RADIUS + cursorExtension) * Math.cos(cursorRad);
  const cursorY2 = cy + (RADIUS + cursorExtension) * Math.sin(cursorRad);

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

  const event = getCurrentOrNextEvent(events, virtualDateTime);

  const dayColors = [
    isDarkMode ? "#bfdbfe" : "#1d4ed8",
    isDarkMode ? "#93c5fd" : "#3b82f6",
    isDarkMode ? "#60a5fa" : "#2563eb",
  ];

  // useEffect pour le listener wheel - SANS DÉPENDANCES qui changent
  React.useEffect(() => {
    const container = document.getElementById('calendar-container');
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      setIsReturning(false);
      setShowTimeLabel(false);
      setIsLabelFadingOut(false);
      
      const deltaMinutes = e.deltaY > 0 ? 15 : -15;
      
      setVirtualDateTime((prev) => {
        const newVirtualTime = new Date(prev);
        newVirtualTime.setMinutes(newVirtualTime.getMinutes() + deltaMinutes);
        
        const dayChanged = newVirtualTime.getDate() !== prev.getDate();
        
        setIsScrolling(true);
        
        if (dayChanged) {
          setShowDateLabel(true);
        }
        
        // Recherche d'événement - on utilise preloadedEvents qui est dans la closure
        let foundEventIndex: number | null = null;
        const virtualHour = newVirtualTime.getHours() + newVirtualTime.getMinutes() / 60;
        
        // Filtrer les événements du jour virtuel
        const virtualDayStart = new Date(newVirtualTime);
        virtualDayStart.setHours(0, 0, 0, 0);
        const nextDay = new Date(virtualDayStart);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const dayEvents = preloadedEvents.filter((x) => {
          return x.start.getTime() >= virtualDayStart.getTime() && 
                 x.start.getTime() < nextDay.getTime();
        });
        
        for (let i = 0; i < dayEvents.length; i++) {
          const { e, start, end } = dayEvents[i];
          
          const startHour = start.getHours() + start.getMinutes() / 60;
          const endHour = end.getHours() + end.getMinutes() / 60;
          
          if (virtualHour >= startHour && virtualHour <= endHour) {
            foundEventIndex = i;
            setSelectedEvent(e);
            break;
          }
        }
        
        if (foundEventIndex === null) {
          setSelectedEvent(null);
        }
        
        setCursorEventIndex(foundEventIndex);
        
        if (scrollTimeoutRef.current) {
          window.clearTimeout(scrollTimeoutRef.current);
        }
        
        const randomDelay = 8000 + Math.random() * 2000;
        console.log(`⏱️ Timeout configuré: ${Math.round(randomDelay)}ms`);
        
        const capturedVirtualTime = new Date(newVirtualTime);
        
        scrollTimeoutRef.current = window.setTimeout(() => {
          console.log("⏰ Timeout déclenché - début du retour");
          console.log("📍 De:", formatDateShort(capturedVirtualTime), formatHour(capturedVirtualTime.getHours() + capturedVirtualTime.getMinutes() / 60));
          
          setIsScrolling(false);
          setIsReturning(true);
          
          const duration = 1500;
          const startTime = performance.now();
          const targetTime = new Date();
          
          console.log("📍 Vers:", formatDateShort(targetTime), formatHour(targetTime.getHours() + targetTime.getMinutes() / 60));
          
          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutCubic(progress);
            
            const timeDiff = targetTime.getTime() - capturedVirtualTime.getTime();
            const newTime = new Date(capturedVirtualTime.getTime() + timeDiff * easedProgress);
            
            setVirtualDateTime(newTime);
            
            if (progress < 1) {
              animationFrameRef.current = requestAnimationFrame(animate);
            } else {
              console.log("✅ Animation retour terminée");
              setVirtualDateTime(new Date());
              setIsReturning(false);
              setShowTimeLabel(true);
              setIsLabelFadingOut(false);
              setCursorEventIndex(null);
              setShowDateLabel(false);
              
              if (labelTimeoutRef.current) {
                window.clearTimeout(labelTimeoutRef.current);
              }
              labelTimeoutRef.current = window.setTimeout(() => {
                setIsLabelFadingOut(true);
                setTimeout(() => {
                  setShowTimeLabel(false);
                  setIsLabelFadingOut(false);
                }, 800);
              }, 3000);
            }
          };
          
          animationFrameRef.current = requestAnimationFrame(animate);
        }, randomDelay);
        
        return newVirtualTime;
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
      if (labelTimeoutRef.current) {
        window.clearTimeout(labelTimeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []); // AUCUNE DÉPENDANCE - le listener ne se recrée JAMAIS

  const eventArcs = upcomingEvents.map((item, idx) => {
    const { e, start, end } = item;
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    
    const startAngle = angleFromHour(startHour);
    const endAngle = angleFromHour(endHour);

    const virtualMs = virtualDateTime.getTime();
    const isCurrent = start.getTime() <= virtualMs && end.getTime() > virtualMs;
    const isHovered = hoveredEventIndex === idx;
    const isCursorEvent = cursorEventIndex === idx;
    
    const dayDiff = getDaysDifference(start, virtualDateTime);
    const colorIndex = Math.min(Math.abs(dayDiff), dayColors.length - 1);
    const color = dayColors[colorIndex];
    
    const totalEvents = upcomingEvents.length;
    const radiusStep = RING_THICKNESS / Math.max(totalEvents, 1);
    const eventRadius = INNER_RADIUS + radiusStep * idx + radiusStep / 2;

    const baseOpacity = isCurrent ? 1 : 0.7;
    const opacity = (isHovered || isCursorEvent) ? 1 : baseOpacity;
    const strokeWidth = (isHovered || isCursorEvent)
      ? Math.max(3, radiusStep * 1.2) 
      : Math.max(2, radiusStep * 0.8);

    return (
      <g key={`event-${idx}`}>
        {(isHovered || isCursorEvent) && (
          <path
            d={getArcPath(cx, cy, eventRadius, startAngle, endAngle)}
            fill="none"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth={strokeWidth + 4}
            strokeLinecap="round"
            style={{
              pointerEvents: "none",
              filter: "blur(4px)",
            }}
          />
        )}
        
        <path
          d={getArcPath(cx, cy, eventRadius, startAngle, endAngle)}
          fill="none"
          stroke={color}
          strokeOpacity={opacity}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{ 
            pointerEvents: "stroke", 
            cursor: "pointer",
            filter: (isHovered || isCursorEvent)
              ? `drop-shadow(0 0 8px ${color}88) drop-shadow(0 0 12px ${color}44)`
              : "none",
            transition: "all 0.2s ease-out",
          }}
          onClick={() => handleEventClick(e)}
          onMouseEnter={() => setHoveredEventIndex(idx)}
          onMouseLeave={() => setHoveredEventIndex(null)}
        />
      </g>
    );
  });

  const sleepOverlays: JSX.Element[] = [];
  
  if (typeof wakeHour === "number" && typeof bedHour === "number") {
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

  const handleEventClick = (evt: Event) => {
    setSelectedEvent(evt);
    setCursorEventIndex(null);
    
    if (onEventClick) {
      onEventClick(evt);
    }
  };

  const handleBubbleClose = () => {
    setSelectedEvent(null);
    setCursorEventIndex(null);
    if (onEventBubbleClosed) {
      onEventBubbleClosed();
    }
  };

  let eventOrganizer = "";
  let eventDate = "";
  let timeRemaining = "";
  let eventUrl = "";
  let videoLink = "";

  if (selectedEvent) {
    const startDate = getEventStartDate(selectedEvent, virtualDateTime);
    
    if (startDate) {
      eventDate = formatEventDate(startDate);
      timeRemaining = formatTimeRemaining(startDate, virtualDateTime);
    }

    eventOrganizer = selectedEvent.raw?.organizer?.displayName || 
                     selectedEvent.raw?.organizer?.emailAddress?.name || 
                     selectedEvent.place || 
                     "";
    
    eventUrl = selectedEvent.url || selectedEvent.raw?.htmlLink || selectedEvent.raw?.webLink || "";
    videoLink = extractVideoConferenceLink(selectedEvent) || "";
  }

  let centerTimeIndicator = "";
  if (event) {
    const startDate = getEventStartDate(event, virtualDateTime);
    if (startDate) {
      centerTimeIndicator = getTimeIndicator(startDate, virtualDateTime);
    }
  }

  const bubbleDiameter = INNER_RADIUS * 1.8;

  const labelOffset = Math.max(8, RING_THICKNESS * 0.25) + 15;
  const timeLabelRadius = INNER_RADIUS - labelOffset;
  const timeLabelPt = toPoint(cursorAngle, timeLabelRadius);
  const timeLabelRotation = cursorAngle + 90;

  const dateLabelAngle = -90;
  const dateLabelRadius = INNER_RADIUS - Math.max(12, RING_THICKNESS * 0.4);
  const dateLabelPt = toPoint(dateLabelAngle, dateLabelRadius);

  const daysDiff = getDaysDifference(virtualDateTime, now);

  return (
    <div className="flex flex-col items-center justify-center">
      <div id="calendar-container" style={{ position: "relative", width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ overflow: "visible", position: "relative", zIndex: 1 }}
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

          <g style={{ position: "relative", zIndex: 2 }}>
            {hoverRing && hourNumbers}
          </g>

          <g style={{ position: "relative", zIndex: 3 }}>
            {eventArcs}
          </g>

          {isScrolling && (
            <line
              x1={cursorX1}
              y1={cursorY1}
              x2={cursorX2}
              y2={cursorY2}
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth={8}
              strokeLinecap="round"
              style={{ 
                pointerEvents: "none",
                filter: "blur(3px)",
              }}
            />
          )}

          <line
            x1={cursorX1}
            y1={cursorY1}
            x2={cursorX2}
            y2={cursorY2}
            stroke={cursorColor}
            strokeWidth={isScrolling ? 4 : 3}
            strokeLinecap="round"
            style={{ 
              filter: isScrolling 
                ? `drop-shadow(0 0 8px ${cursorColor}aa) drop-shadow(0 0 12px ${cursorColor}66)`
                : `drop-shadow(0 0 4px ${cursorColor}88)`,
              transition: "all 0.2s ease-out",
            }}
          />
        </svg>

        <div
          className="absolute left-1/2 top-1/2 flex flex-col items-center justify-center text-center select-none"
          style={{
            transform: `translate(-50%, -50%)`,
            width: INNER_RADIUS * 1.6,
            height: INNER_RADIUS * 1.6,
            cursor: event ? "pointer" : "default",
            pointerEvents: "auto",
            zIndex: 5,
          }}
          onClick={() => event && handleEventClick(event)}
          role={event ? "button" : undefined}
          aria-label={event ? `Voir les détails: ${event.title}` : undefined}
        >
          {event ? (
            <>
              <div className="text-xs calendar-center-meta opacity-60 mb-2">
                {centerTimeIndicator}
              </div>

              <div className="calendar-center-title font-bold text-base leading-tight px-4">
                {event.title}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="text-sm calendar-center-meta">
                {formatHour(hourDecimal)}
              </div>
              <div className="calendar-center-title font-semibold">
                Aucun événement
              </div>
            </div>
          )}
        </div>

        {selectedEvent && (
          <div style={{ position: "absolute", inset: 0, zIndex: 6 }}>
            <EventInfoBubble
              title={selectedEvent.title}
              organizer={eventOrganizer}
              date={eventDate}
              timeRemaining={timeRemaining}
              url={eventUrl}
              videoLink={videoLink}
              onClose={handleBubbleClose}
              diameter={bubbleDiameter}
            />
          </div>
        )}

        {showTimeLabel && !isScrolling && !isReturning && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: timeLabelPt.x,
              top: timeLabelPt.y,
              transform: `translate(-50%, -50%) rotate(${timeLabelRotation}deg)`,
              transformOrigin: "center",
              animation: isLabelFadingOut 
                ? "quantum-fade-out 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards"
                : "quantum-fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              zIndex: 7,
            }}
          >
            <span 
              style={{ 
                fontSize: 13, 
                lineHeight: 1, 
                color: cursorColor,
                fontWeight: 700,
                fontFamily: "'Montserrat', 'Inter', Arial, Helvetica, sans-serif",
                textShadow: `0 0 12px ${cursorColor}88, 0 0 24px ${cursorColor}44, 0 2px 4px rgba(0,0,0,0.3)`,
                filter: "drop-shadow(0 0 8px rgba(255,255,255,0.4))",
              }}
            >
              {formatHour(now.getHours() + now.getMinutes() / 60)}
            </span>
          </div>
        )}

        {showDateLabel && daysDiff !== 0 && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: dateLabelPt.x,
              top: dateLabelPt.y,
              transform: `translate(-50%, -50%)`,
              zIndex: 8,
            }}
          >
            <div 
              className="px-3 py-1.5 rounded-lg"
              style={{ 
                background: "rgba(0, 0, 0, 0.7)",
                backdropFilter: "blur(8px)",
              }}
            >
              <div
                style={{ 
                  fontSize: 11, 
                  lineHeight: 1.2, 
                  color: "#fff",
                  fontWeight: 600,
                  fontFamily: "'Montserrat', 'Inter', Arial, Helvetica, sans-serif",
                  textAlign: "center",
                }}
              >
                {formatDateLabel(virtualDateTime)}
              </div>
              <div
                style={{ 
                  fontSize: 9, 
                  lineHeight: 1, 
                  color: "rgba(255, 255, 255, 0.7)",
                  fontWeight: 500,
                  fontFamily: "'Montserrat', 'Inter', Arial, Helvetica, sans-serif",
                  textAlign: "center",
                  marginTop: "2px",
                }}
              >
                {daysDiff > 0 ? `+${daysDiff} jour${daysDiff > 1 ? 's' : ''}` : `${daysDiff} jour${daysDiff < -1 ? 's' : ''}`}
              </div>
            </div>
          </div>
        )}

        {!hoverRing && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="absolute"
                  style={{
                    left: sunrisePt.x - metaIconSize / 2,
                    top: sunrisePt.y - metaIconSize / 2,
                    transform: `rotate(${sunriseRotation}deg)`,
                    transformOrigin: "center",
                    zIndex: 1,
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
                className="bg-transparent border-0 shadow-none p-0 font-light"
              >
                <span style={{ fontSize: 11, lineHeight: 1.1, color: "#facc15" }}>
                  {formatHour(sunrise)}
                </span>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="absolute"
                  style={{
                    left: sunsetPt.x - metaIconSize / 2,
                    top: sunsetPt.y - metaIconSize / 2,
                    transform: `rotate(${sunsetRotation}deg)`,
                    transformOrigin: "center",
                    zIndex: 1,
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
                className="bg-transparent border-0 shadow-none p-0 font-light"
              >
                <span style={{ fontSize: 11, lineHeight: 1.1, color: "#fb923c" }}>
                  {formatHour(sunset)}
                </span>
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  );
};