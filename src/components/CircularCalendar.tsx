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
  totalSleepHours?: number | null;
  sleepSessions?: Array<{ bedHour: number; wakeHour: number }> | null;
  externalSelectedEvent?: Event | null;
  onEventBubbleClosed?: () => void;
  onDayChange?: (date: Date) => void;
  onVirtualDateTimeChange?: (date: Date | null) => void;
};

const DEFAULT_SIZE = 320;
const RING_THICKNESS = 32;
const SEGMENTS = 1440;
const RECOMMENDED_SLEEP_HOURS = 9;

const SEASON_COLORS: Record<string, string> = {
  spring: "#4ade80",
  summer: "#fde047",
  autumn: "#fb923c",
  winter: "#7dd3fc",
};

const NIGHT_COLOR = "#d1d5db";

function getWedgePath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startAngle: number,
  endAngle: number,
) {
  const startRad = (Math.PI / 180) * startAngle;
  const endRad = (Math.PI / 180) * endAngle;

  const x1 = cx + rOuter * Math.cos(startRad);
  const y1 = cy + rOuter * Math.sin(startRad);
  const x2 = cx + rOuter * Math.cos(endRad);
  const y2 = cy + rOuter * Math.sin(endRad);

  const x3 = cx + rInner * Math.cos(endRad);
  const y3 = cy + rInner * Math.sin(endRad);
  const x4 = cx + rInner * Math.cos(startRad);
  const y4 = cy + rInner * Math.sin(startRad);

  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${x1} ${y1}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4}`,
    "Z",
  ].join(" ");
}

function getArcPath(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const startRad = (Math.PI / 180) * startAngle;
  const endRad = (Math.PI / 180) * endAngle;
  const x1 = cx + radius * Math.cos(startRad);
  const y1 = cy + radius * Math.sin(startRad);
  const x2 = cx + radius * Math.cos(endRad);
  const y2 = cy + radius * Math.sin(endRad);
  const delta = (endAngle - startAngle + 360) % 360;
  const largeArc = delta > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
}

function getEventStartDate(event: Event, reference: Date): Date | null {
  const raw = event.raw;
  const iso = raw?.start?.dateTime || raw?.start?.date || null;
  if (iso) return new Date(iso);

  const base = new Date(reference);
  const hours = Math.floor(event.start || 0);
  const minutes = Math.round(((event.start || 0) % 1) * 60);
  base.setHours(hours, minutes, 0, 0);
  return base;
}

function getEventEndDate(event: Event, startDate: Date): Date | null {
  const raw = event.raw;
  const iso = raw?.end?.dateTime || raw?.end?.date || null;
  if (iso) return new Date(iso);

  const end = new Date(startDate);
  const hours = Math.floor(event.end || 0);
  const minutes = Math.round(((event.end || 0) % 1) * 60);
  end.setHours(hours, minutes, 0, 0);
  return end;
}

function getCurrentOrNextEvent(events: Event[], now: Date) {
  const nowMs = now.getTime();

  const mapped = events
    .map((event) => {
      const start = getEventStartDate(event, now);
      const end = start ? getEventEndDate(event, start) : null;
      return { event, start, end };
    })
    .filter((entry): entry is { event: Event; start: Date; end: Date | null } => !!entry.start);

  const current = mapped.find((entry) => {
    const start = entry.start.getTime();
    const end = entry.end ? entry.end.getTime() : start;
    return nowMs >= start && nowMs < end;
  });

  if (current) return current.event;

  const upcoming = mapped
    .filter((entry) => entry.start.getTime() >= nowMs)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  return upcoming[0]?.event;
}

function formatHour(decimal: number) {
  const h = Math.floor(decimal).toString().padStart(2, "0");
  const m = Math.round((decimal % 1) * 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function formatEventDate(date: Date) {
  const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}, à ${date.getHours().toString().padStart(2, "0")}h${date.getMinutes().toString().padStart(2, "0")}`;
}

function formatTimeRemaining(start: Date, reference: Date) {
  const diff = start.getTime() - reference.getTime();
  if (diff <= 0) return "En cours";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} jour${days > 1 ? "s" : ""}`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes} min`);

  return `Dans ${parts.join(", ")}`;
}

function getDaysDifference(date1: Date, date2: Date) {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.round((d1.getTime() - d2.getTime()) / 86_400_000);
}

function getTimeIndicator(date: Date, reference: Date) {
  const diff = getDaysDifference(date, reference);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Demain";
  if (diff === 2) return "Dans 2 jours";
  if (diff === 3) return "Dans 3 jours";
  return `Dans ${diff} jours`;
}

function formatDateLabel(date: Date) {
  const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function extractVideoConferenceLink(event: Event) {
  const raw = event.raw;
  if (!raw) return null;

  const patterns = [
    /https?:\/\/[^\s<>"]*meet\.google\.com[^\s<>"]*/gi,
    /https?:\/\/[^\s<>"]*zoom\.us[^\s<>"]*/gi,
    /https?:\/\/[^\s<>"]*teams\.microsoft\.com[^\s<>"]*/gi,
    /https?:\/\/[^\s<>"]*webex\.com[^\s<>"]*/gi,
    /https?:\/\/[^\s<>"]*gotomeeting\.com[^\s<>"]*/gi,
    /https?:\/\/[^\s<>"]*whereby\.com[^\s<>"]*/gi,
    /https?:\/\/[^\s<>"]*jitsi[^\s<>"]*/gi,
  ];

  const searchStrings: string[] = [];
  if (typeof event.place === "string") searchStrings.push(event.place);
  if (raw?.description) searchStrings.push(raw.description);
  if (raw?.body?.content) searchStrings.push(raw.body.content);
  if (raw?.location) {
    if (typeof raw.location === "string") searchStrings.push(raw.location);
    if (raw.location.displayName) searchStrings.push(raw.location.displayName);
  }
  if (raw?.conferenceData?.entryPoints) {
    for (const entry of raw.conferenceData.entryPoints) {
      if (entry.entryPointType === "video" && entry.uri) return entry.uri;
    }
  }
  if (raw?.onlineMeeting?.joinUrl) return raw.onlineMeeting.joinUrl;
  if (raw?.hangoutLink) return raw.hangoutLink;

  for (const str of searchStrings) {
    for (const pattern of patterns) {
      const match = str.match(pattern);
      if (match && match[0]) return match[0];
    }
  }

  if (raw && searchStrings.length === 0) {
    const flat = JSON.stringify(raw);
    for (const pattern of patterns) {
      const match = flat.match(pattern);
      if (match && match[0]) return match[0];
    }
  }

  return null;
}

function getSeason(date: Date): Props["season"] {
  const month = date.getMonth() + 1;
  if (month >= 3 && month < 6) return "spring";
  if (month >= 6 && month < 9) return "summer";
  if (month >= 9 && month < 12) return "autumn";
  return "winter";
}

function isDayMinute(minute: number, sunrise: number, sunset: number) {
  const hour = minute / 60;
  
  if (sunset < sunrise) {
    return hour >= sunrise || hour < sunset;
  }
  
  return hour >= sunrise && hour < sunset;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export const CircularCalendar: React.FC<Props> = ({
  sunrise,
  sunset,
  events,
  season,
  onEventClick,
  size = DEFAULT_SIZE,
  wakeHour,
  bedHour,
  totalSleepHours,
  sleepSessions,
  externalSelectedEvent,
  onEventBubbleClosed,
  onDayChange,
  onVirtualDateTimeChange,
}) => {
  const [now, setNow] = React.useState(() => new Date());
  const [virtualDateTime, setVirtualDateTime] = React.useState(() => new Date());
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<Event | null>(null);
  const [hoveredEventIndex, setHoveredEventIndex] = React.useState<number | null>(null);
  const [cursorEventIndex, setCursorEventIndex] = React.useState<number | null>(null);
  const [isScrolling, setIsScrolling] = React.useState(false);
  const [isReturning, setIsReturning] = React.useState(false);
  const [showTimeLabel, setShowTimeLabel] = React.useState(false);
  const [isLabelFadingOut, setIsLabelFadingOut] = React.useState(false);
  const [showDateLabel, setShowDateLabel] = React.useState(false);
  const [lastDayNotified, setLastDayNotified] = React.useState("");
  const [hoverRing, setHoverRing] = React.useState(false);
  const [hoverCenterEvent, setHoverCenterEvent] = React.useState(false);

  const scrollTimeoutRef = React.useRef<number | null>(null);
  const labelTimeoutRef = React.useRef<number | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);
  const nowIntervalRef = React.useRef<number | null>(null);
  const upcomingEventsRef = React.useRef<{ event: Event; start: Date; end: Date }[]>([]);
  const onDayChangeRef = React.useRef(onDayChange);
  const onVirtualDateTimeChangeRef = React.useRef(onVirtualDateTimeChange);
  const horizontalScrollAccumulator = React.useRef<number>(0);
  
  // Refs pour les interactions tactiles
  const touchStartRef = React.useRef<{ x: number; y: number; time: number } | null>(null);
  const isTouchScrollingRef = React.useRef(false);

  React.useEffect(() => {
    onDayChangeRef.current = onDayChange;
  }, [onDayChange]);

  React.useEffect(() => {
    onVirtualDateTimeChangeRef.current = onVirtualDateTimeChange;
  }, [onVirtualDateTimeChange]);

  React.useEffect(() => {
    if (externalSelectedEvent) {
      setSelectedEvent(externalSelectedEvent);
      setCursorEventIndex(null);
    }
  }, [externalSelectedEvent]);

  React.useEffect(() => {
    const updateNow = () => {
      const current = new Date();
      setNow(current);
      if (!isScrolling && !isReturning) {
        setVirtualDateTime(current);
        onVirtualDateTimeChangeRef.current?.(null);
      }
    };
    updateNow();
    nowIntervalRef.current = window.setInterval(updateNow, 1000);
    return () => {
      if (nowIntervalRef.current) window.clearInterval(nowIntervalRef.current);
    };
  }, [isScrolling, isReturning]);

  React.useEffect(() => {
    const updateTheme = () => setIsDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
    updateTheme();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => updateTheme();
    if (mq.addEventListener) {
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
    return undefined;
  }, []);

  React.useEffect(() => {
    const container = document.getElementById("calendar-container");
    const pageBackground = document.getElementById("calendar-page-container");
    if (!container || !pageBackground) return;

    const updateCenter = () => {
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      pageBackground.style.setProperty("--calendar-center-x", `${(centerX / window.innerWidth) * 100}%`);
      pageBackground.style.setProperty("--calendar-center-y", `${(centerY / window.innerHeight) * 100}%`);
    };

    updateCenter();
    window.addEventListener("resize", updateCenter);
    window.addEventListener("scroll", updateCenter);
    return () => {
      window.removeEventListener("resize", updateCenter);
      window.removeEventListener("scroll", updateCenter);
    };
  }, [size]);

  const upcomingEvents = React.useMemo(() => {
    const dayStart = new Date(virtualDateTime);
    dayStart.setHours(0, 0, 0, 0);
    const threeDaysLater = new Date(dayStart);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    return events
      .map((event) => {
        const start = getEventStartDate(event, now);
        const end = start ? getEventEndDate(event, start) : null;
        return { event, start, end };
      })
      .filter((entry): entry is { event: Event; start: Date; end: Date } => !!entry.start && !!entry.end)
      .filter((entry) => entry.start.getTime() >= dayStart.getTime() && entry.start.getTime() < threeDaysLater.getTime())
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [events, virtualDateTime, now]);

  React.useEffect(() => {
    upcomingEventsRef.current = upcomingEvents;
  }, [upcomingEvents]);

  // Fonction commune pour gérer le scroll (wheel ou touch)
  const handleScroll = React.useCallback((deltaY: number, deltaX: number) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setIsReturning(false);
    setShowTimeLabel(false);
    setIsLabelFadingOut(false);

    const isHorizontalScroll = Math.abs(deltaX) > Math.abs(deltaY);

    setVirtualDateTime((prev) => {
      const nextTime = new Date(prev);

      if (isHorizontalScroll) {
        horizontalScrollAccumulator.current += deltaX;
        
        const threshold = 100;
        
        if (Math.abs(horizontalScrollAccumulator.current) >= threshold) {
          const dayDelta = horizontalScrollAccumulator.current > 0 ? 1 : -1;
          nextTime.setDate(nextTime.getDate() + dayDelta);
          horizontalScrollAccumulator.current = 0;
        } else {
          return prev;
        }
      } else {
        const deltaMinutes = deltaY > 0 ? 15 : -15;
        nextTime.setMinutes(nextTime.getMinutes() + deltaMinutes);
        horizontalScrollAccumulator.current = 0;
      }

      const dayChanged = nextTime.getDate() !== prev.getDate() || nextTime.getMonth() !== prev.getMonth() || nextTime.getFullYear() !== prev.getFullYear();
      setIsScrolling(true);
      
      onVirtualDateTimeChangeRef.current?.(nextTime);

      if (dayChanged) {
        setShowDateLabel(true);
        const dayKey = `${nextTime.getFullYear()}-${nextTime.getMonth()}-${nextTime.getDate()}`;
        setLastDayNotified((prevKey) => {
          if (dayKey !== prevKey) onDayChangeRef.current?.(nextTime);
          return dayKey;
        });
      }

      let matchedIndex: number | null = null;
      const virtualHour = nextTime.getHours() + nextTime.getMinutes() / 60;
      const dayStart = new Date(nextTime);
      dayStart.setHours(0, 0, 0, 0);
      const nextDay = new Date(dayStart);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayEvents = upcomingEventsRef.current.filter((entry) => {
        const startMs = entry.start.getTime();
        return startMs >= dayStart.getTime() && startMs < nextDay.getTime();
      });

      for (let i = 0; i < dayEvents.length; i += 1) {
        const { event: arcEvent, start, end } = dayEvents[i];
        const startHour = start.getHours() + start.getMinutes() / 60;
        const endHour = end.getHours() + end.getMinutes() / 60;
        if (virtualHour >= startHour && virtualHour <= endHour) {
          matchedIndex = i;
          setSelectedEvent(arcEvent);
          break;
        }
      }

      if (matchedIndex === null) setSelectedEvent(null);
      setCursorEventIndex(matchedIndex);

      if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current);

      const randomDelay = 8000 + Math.random() * 2000;
      const captured = new Date(nextTime);

      scrollTimeoutRef.current = window.setTimeout(() => {
        setIsScrolling(false);
        setIsReturning(true);

        const duration = 1500;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = easeOutCubic(progress);

          const target = new Date();
          const diff = target.getTime() - captured.getTime();
          const interpolated = new Date(captured.getTime() + diff * eased);
          setVirtualDateTime(interpolated);
          
          onVirtualDateTimeChangeRef.current?.(interpolated);

          if (progress < 1) {
            animationFrameRef.current = requestAnimationFrame(animate);
          } else {
            setVirtualDateTime(new Date());
            setIsReturning(false);
            setShowTimeLabel(true);
            setIsLabelFadingOut(false);
            setCursorEventIndex(null);
            setShowDateLabel(false);
            horizontalScrollAccumulator.current = 0;
            
            onVirtualDateTimeChangeRef.current?.(null);

            if (labelTimeoutRef.current) window.clearTimeout(labelTimeoutRef.current);
            labelTimeoutRef.current = window.setTimeout(() => {
              setIsLabelFadingOut(true);
              window.setTimeout(() => {
                setShowTimeLabel(false);
                setIsLabelFadingOut(false);
              }, 800);
            }, 3000);
          }
        };

        animationFrameRef.current = requestAnimationFrame(animate);
      }, randomDelay);

      return nextTime;
    });
  }, []);

  React.useEffect(() => {
    const container = document.getElementById("calendar-container");
    if (!container) return;

    // Gestion du wheel (desktop)
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      handleScroll(event.deltaY, event.deltaX);
    };

    // Gestion du touch (mobile)
    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      
      const touch = event.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
      isTouchScrollingRef.current = false;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!touchStartRef.current || event.touches.length !== 1) return;
      
      event.preventDefault(); // Empêcher le scroll natif
      
      const touch = event.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      
      // Déterminer la direction dominante
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
      
      // Sensibilité ajustée pour mobile
      const sensitivity = 0.5;
      
      if (isHorizontal) {
        // Swipe horizontal = changement de jour
        const adjustedDeltaX = deltaX * sensitivity;
        if (Math.abs(adjustedDeltaX) > 5) {
          handleScroll(0, adjustedDeltaX);
          touchStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now()
          };
          isTouchScrollingRef.current = true;
        }
      } else {
        // Swipe vertical = changement d'heure
        const adjustedDeltaY = deltaY * sensitivity;
        if (Math.abs(adjustedDeltaY) > 5) {
          handleScroll(adjustedDeltaY, 0);
          touchStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now()
          };
          isTouchScrollingRef.current = true;
        }
      }
    };

    const handleTouchEnd = () => {
      touchStartRef.current = null;
      isTouchScrollingRef.current = false;
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });
    container.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("wheel", handleWheel as any);
      container.removeEventListener("touchstart", handleTouchStart as any);
      container.removeEventListener("touchmove", handleTouchMove as any);
      container.removeEventListener("touchend", handleTouchEnd as any);
      container.removeEventListener("touchcancel", handleTouchEnd as any);
      
      if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current);
      if (labelTimeoutRef.current) window.clearTimeout(labelTimeoutRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [handleScroll]);

  const currentSeason = season || getSeason(virtualDateTime);
  const sizeScale = size / DEFAULT_SIZE;
  const radius = size / 2 - 8;
  const innerRadius = radius - RING_THICKNESS;
  const cx = size / 2;
  const cy = size / 2;
  const blockAngle = 360 / SEGMENTS;

  const hourDecimal = virtualDateTime.getHours() + virtualDateTime.getMinutes() / 60 + virtualDateTime.getSeconds() / 3600;
  const hour = virtualDateTime.getHours();

  const hourFontSize = Math.max(8, Math.min(RING_THICKNESS * sizeScale * 0.72, size * 0.045));
  const strokeWidthCurrent = Math.max(0.4, 0.7 * sizeScale);
  const strokeWidthNormal = Math.max(0.3, 0.5 * sizeScale);
  const metaIconSize = Math.round(Math.max(12, Math.min(16 * sizeScale, 16)));

  const wedges = React.useMemo(
    () =>
      Array.from({ length: SEGMENTS }, (_, i) => {
        const startAngle = -90 + i * blockAngle;
        const endAngle = startAngle + blockAngle;

        if (i % 60 === 0) {
          return { key: i, path: getWedgePath(cx, cy, radius, innerRadius, startAngle, endAngle), fill: "none" };
        }

        const fill = isDayMinute(i, sunrise, sunset) ? SEASON_COLORS[currentSeason] : NIGHT_COLOR;
        return { key: i, path: getWedgePath(cx, cy, radius, innerRadius, startAngle, endAngle), fill };
      }),
    [blockAngle, cx, cy, currentSeason, innerRadius, radius, sunrise, sunset],
  );

  const cursorAngle = (hourDecimal / 24) * 360 - 90;
  const cursorRad = (Math.PI / 180) * cursorAngle;
  const cursorExtension = RING_THICKNESS * 0.2;
  const cursorX1 = cx + (innerRadius - cursorExtension) * Math.cos(cursorRad);
  const cursorY1 = cy + (innerRadius - cursorExtension) * Math.sin(cursorRad);
  const cursorX2 = cx + (radius + cursorExtension) * Math.cos(cursorRad);
  const cursorY2 = cy + (radius + cursorExtension) * Math.sin(cursorRad);
  const cursorColor = isDarkMode ? "#bfdbfe" : "#1d4ed8";

  const angleFromHour = (time: number) => (time / 24) * 360 - 90;
  const toPoint = (angleDeg: number, r: number) => {
    const rad = (Math.PI / 180) * angleDeg;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const sunriseAngle = angleFromHour(sunrise);
  const sunsetAngle = angleFromHour(sunset);
  const iconGap = Math.max(2, Math.round(metaIconSize * 0.12));
  const iconRadius = Math.max(0, innerRadius - metaIconSize / 2 - iconGap);
  const sunrisePoint = toPoint(sunriseAngle, iconRadius);
  const sunsetPoint = toPoint(sunsetAngle, iconRadius);
  const sunriseRotation = sunriseAngle + 90;
  const sunsetRotation = sunsetAngle + 90;

  const arcStroke = Math.max(2, Math.round(3 * sizeScale));
  const arcGap = Math.max(1, Math.round(sizeScale));
  const innerArcRadius = Math.max(arcStroke, innerRadius - arcGap - arcStroke / 2);
  const outerArcRadius = radius + arcGap + arcStroke / 2;

  const nowAngleDeg = angleFromHour(hourDecimal);
  let pastArc: { start: number; end: number } | null = null;
  let futureArc: { start: number; end: number } | null = null;

  const hasSleepData = typeof wakeHour === "number" && typeof bedHour === "number";
  
  if (hasSleepData) {
    const userWakeAngle = angleFromHour(wakeHour);
    
    const idealBedHour = (wakeHour - RECOMMENDED_SLEEP_HOURS + 24) % 24;
    const idealBedAngle = angleFromHour(idealBedHour);

    if (hourDecimal >= wakeHour) {
      pastArc = { start: userWakeAngle, end: nowAngleDeg };
    }

    const isInSleepPeriod = sleepSessions?.some(session => {
      const bedNormalized = session.bedHour;
      const wakeNormalized = session.wakeHour;
      
      if (wakeNormalized < bedNormalized) {
        return hourDecimal >= bedNormalized || hourDecimal < wakeNormalized;
      } else {
        return hourDecimal >= bedNormalized && hourDecimal < wakeNormalized;
      }
    });

    if (!isInSleepPeriod && (hourDecimal <= idealBedHour || (idealBedHour < wakeHour && hourDecimal >= wakeHour))) {
      futureArc = { start: nowAngleDeg, end: idealBedAngle };
    }
  }

  const dividerWidth = Math.max(1, Math.round(2 * sizeScale));
  const hourDividers = Array.from({ length: 24 }, (_, i) => {
    const angle = ((i / 24) * 2 * Math.PI) - Math.PI / 2;
    const x1 = cx + innerRadius * Math.cos(angle);
    const y1 = cy + innerRadius * Math.sin(angle);
    const x2 = cx + radius * Math.cos(angle);
    const y2 = cy + radius * Math.sin(angle);
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="black" strokeWidth={dividerWidth} />;
  });

  const hourNumbers = Array.from({ length: 24 }, (_, i) => {
    const angle = ((i / 24) * 2 * Math.PI) - Math.PI / 2;
    const angleDeg = (i / 24) * 360 - 90;
    const radiusForText = (radius + innerRadius) / 2;
    const x = cx + radiusForText * Math.cos(angle);
    const y = cy + radiusForText * Math.sin(angle);
    const isCurrent = i === hour;

    return (
      <text
        key={i}
        x={x}
        y={y}
        textAnchor="middle"
        transform={`rotate(${angleDeg + 90} ${x} ${y})`}
        fontSize={hourFontSize}
        fontWeight={isCurrent ? "bold" : 600}
        fill="#fff"
        style={{
          pointerEvents: "none",
          userSelect: "none",
          filter: isCurrent ? "drop-shadow(0 0 6px #2563ebcc) drop-shadow(0 1px 0 #0008)" : "drop-shadow(0 1px 0 #0008)",
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

  const currentEvent = getCurrentOrNextEvent(events, virtualDateTime);

  const dayColors = [
    isDarkMode ? "#bfdbfe" : "#1d4ed8",
    isDarkMode ? "#93c5fd" : "#3b82f6",
    isDarkMode ? "#60a5fa" : "#2563eb",
  ];

  const currentDayEvents = upcomingEvents.filter((entry) => 
    isSameDay(entry.start, virtualDateTime)
  );

  const eventArcs = currentDayEvents.map((entry, index) => {
    const { event, start, end } = entry;
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;

    const startAngle = angleFromHour(startHour);
    const endAngle = angleFromHour(endHour);

    const virtualMs = virtualDateTime.getTime();
    const isCurrent = start.getTime() <= virtualMs && end.getTime() > virtualMs;
    const isHovered = hoveredEventIndex === index;
    const isCursor = cursorEventIndex === index;

    const dayDiff = getDaysDifference(start, virtualDateTime);
    const colorIndex = Math.min(Math.abs(dayDiff), dayColors.length - 1);
    const color = dayColors[colorIndex];

    const totalEvents = currentDayEvents.length || 1;
    const radiusStep = RING_THICKNESS / totalEvents;
    const eventRadius = innerRadius + radiusStep * index + radiusStep / 2;

    const baseOpacity = isCurrent ? 1 : 0.7;
    const opacity = isHovered || isCursor ? 1 : baseOpacity;
    const strokeWidth = isHovered || isCursor ? Math.max(3, radiusStep * 1.2) : Math.max(2, radiusStep * 0.8);

    return (
      <g key={`${event.title}-${index}`}>
        {(isHovered || isCursor) && (
          <path
            d={getArcPath(cx, cy, eventRadius, startAngle, endAngle)}
            fill="none"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth={strokeWidth + 4}
            strokeLinecap="round"
            style={{ pointerEvents: "none", filter: "blur(4px)" }}
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
            filter: isHovered || isCursor ? `drop-shadow(0 0 8px ${color}88) drop-shadow(0 0 12px ${color}44)` : "none",
            transition: "all 0.2s ease-out",
          }}
          onClick={() => {
            setSelectedEvent(event);
            setCursorEventIndex(null);
            onEventClick?.(event);
          }}
          onMouseEnter={() => setHoveredEventIndex(index)}
          onMouseLeave={() => setHoveredEventIndex(null)}
        />
      </g>
    );
  });

  const sleepOverlays: JSX.Element[] = [];
  
  if (sleepSessions && sleepSessions.length > 0) {
    sleepSessions.forEach((session, idx) => {
      const bedAngle = angleFromHour(session.bedHour);
      const wakeAngle = angleFromHour(session.wakeHour);
      
      sleepOverlays.push(
        <path 
          key={`sleep-session-${idx}`}
          d={getWedgePath(cx, cy, radius, innerRadius, bedAngle, wakeAngle)} 
          fill="rgba(0, 0, 0, 0.4)" 
          style={{ pointerEvents: "none" }} 
        />
      );
    });

    if (totalSleepHours && totalSleepHours < RECOMMENDED_SLEEP_HOURS && bedHour !== null && wakeHour !== null) {
      const missingHours = RECOMMENDED_SLEEP_HOURS - totalSleepHours;
      const recommendedBedHour = (wakeHour - RECOMMENDED_SLEEP_HOURS + 24) % 24;
      const recommendedAngle = angleFromHour(recommendedBedHour);
      const firstBedAngle = angleFromHour(bedHour);
      
      sleepOverlays.push(
        <path 
          key="sleep-recommended" 
          d={getWedgePath(cx, cy, radius, innerRadius, recommendedAngle, firstBedAngle)} 
          fill="rgba(0, 0, 0, 0.2)" 
          style={{ pointerEvents: "none" }} 
        />
      );
    }
  }

  const currentEventStart = currentEvent ? getEventStartDate(currentEvent, virtualDateTime) : null;
  const centerTimeIndicator = currentEventStart ? getTimeIndicator(currentEventStart, virtualDateTime) : "";

  const selectedStart = selectedEvent ? getEventStartDate(selectedEvent, virtualDateTime) : null;
  const selectedDateLabel = selectedStart ? formatEventDate(selectedStart) : "";
  const selectedTimeRemaining = selectedStart ? formatTimeRemaining(selectedStart, virtualDateTime) : "";
  const selectedOrganizer = selectedEvent?.raw?.organizer?.displayName || selectedEvent?.raw?.organizer?.emailAddress?.name || selectedEvent?.place || "";
  const selectedUrl = selectedEvent?.url || selectedEvent?.raw?.htmlLink || selectedEvent?.raw?.webLink || "";
  const videoLink = selectedEvent ? extractVideoConferenceLink(selectedEvent) : null;

  const bubbleDiameter = innerRadius * 1.8;

  const labelOffset = Math.max(8, RING_THICKNESS * 0.25) + 15;
  const timeLabelRadius = innerRadius - labelOffset;
  const timeLabelPoint = toPoint(cursorAngle, timeLabelRadius);
  const timeLabelRotation = cursorAngle + 90;

  const daysDiff = getDaysDifference(virtualDateTime, now);

  const centerDivSize = bubbleDiameter;

  const centerTextColor = isDarkMode 
    ? (hoverCenterEvent ? "#93c5fd" : "#bfdbfe")
    : (hoverCenterEvent ? "#1e3a8a" : "#1d4ed8");

  return (
    <div className="flex flex-col items-center justify-center">
      <div id="calendar-container" style={{ position: "relative", width: size, height: size, touchAction: "none" }}>
        <div
          className="absolute left-1/2 top-1/2 flex flex-col items-center justify-center text-center select-none"
          style={{ 
            transform: "translate(-50%, -50%)", 
            width: centerDivSize, 
            height: centerDivSize, 
            cursor: currentEvent ? "pointer" : "default", 
            pointerEvents: currentEvent ? "auto" : "none",
            zIndex: 0
          }}
          onClick={() => {
            if (currentEvent) {
              setSelectedEvent(currentEvent);
              setCursorEventIndex(null);
              onEventClick?.(currentEvent);
            }
          }}
          onMouseEnter={() => setHoverCenterEvent(true)}
          onMouseLeave={() => setHoverCenterEvent(false)}
          role={currentEvent ? "button" : undefined}
          aria-label={currentEvent ? `Voir les détails: ${currentEvent.title}` : undefined}
        >
          {currentEvent ? (
            <>
              <div className="text-xs calendar-center-meta opacity-60 mb-2 pointer-events-none">{centerTimeIndicator}</div>
              <div 
                className="font-bold text-xl leading-tight px-4 pointer-events-none transition-colors duration-200"
                style={{ color: centerTextColor }}
              >
                {currentEvent.title}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
              <div className="text-sm calendar-center-meta pointer-events-none">{formatHour(hourDecimal)}</div>
              <div className="calendar-center-title font-semibold text-lg pointer-events-none">Aucun événement</div>
            </div>
          )}
        </div>

        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible", position: "relative", zIndex: 1, pointerEvents: "none" }}>
          <defs>
            <filter id="ringEdgeBlur" filterUnits="userSpaceOnUse" x={cx - (radius + RING_THICKNESS)} y={cy - (radius + RING_THICKNESS)} width={(radius + RING_THICKNESS) * 2} height={(radius + RING_THICKNESS) * 2}>
              <feGaussianBlur stdDeviation={Math.max(2, RING_THICKNESS * 0.15)} />
            </filter>
            <mask id="ringFadeMask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x={0} y={0} width={size} height={size}>
              <rect x={0} y={0} width={size} height={size} fill="black" />
              <g filter="url(#ringEdgeBlur)">
                <circle cx={cx} cy={cy} r={(innerRadius + radius) / 2} stroke="white" strokeWidth={RING_THICKNESS} fill="none" />
              </g>
              <g>{hourDividers}</g>
            </mask>
          </defs>

          <g 
            mask="url(#ringFadeMask)" 
            onMouseEnter={() => setHoverRing(true)} 
            onMouseLeave={() => setHoverRing(false)}
            style={{ pointerEvents: "auto" }}
          >
            {wedges.map((wedge) => (
              <path key={wedge.key} d={wedge.path} fill={wedge.fill} stroke="none" />
            ))}
          </g>

          {sleepOverlays.length > 0 && (
            <g mask="url(#ringFadeMask)" style={{ pointerEvents: "none" }}>{sleepOverlays}</g>
          )}

          {hoverRing && pastArc && (
            <path d={getArcPath(cx, cy, innerArcRadius, pastArc.start, pastArc.end)} fill="none" stroke={SEASON_COLORS[currentSeason]} strokeOpacity={0.95} strokeWidth={arcStroke} strokeLinecap="round" style={{ pointerEvents: "none" }} />
          )}

          {hoverRing && futureArc && (
            <path d={getArcPath(cx, cy, outerArcRadius, futureArc.start, futureArc.end)} fill="none" stroke={SEASON_COLORS[currentSeason]} strokeOpacity={0.6} strokeWidth={arcStroke} strokeLinecap="round" style={{ pointerEvents: "none" }} />
          )}

          {hoverRing && <g style={{ pointerEvents: "none" }}>{hourNumbers}</g>}
          
          <g style={{ pointerEvents: "auto" }}>{eventArcs}</g>

          {isScrolling && (
            <line x1={cursorX1} y1={cursorY1} x2={cursorX2} y2={cursorY2} stroke="rgba(255, 255, 255, 0.4)" strokeWidth={8} strokeLinecap="round" style={{ pointerEvents: "none" }} />
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
              filter: isScrolling ? `drop-shadow(0 0 8px ${cursorColor}aa) drop-shadow(0 0 12px ${cursorColor}66)` : `drop-shadow(0 0 4px ${cursorColor}88)`,
              transition: "all 0.2s ease-out",
              pointerEvents: "none"
            }}
          />
        </svg>

        {!hoverRing && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute pointer-events-auto" style={{ left: sunrisePoint.x - metaIconSize / 2, top: sunrisePoint.y - metaIconSize / 2, transform: `rotate(${sunriseRotation}deg)`, transformOrigin: "center", zIndex: 3 }} aria-label={`Sunrise at ${formatHour(sunrise)}`}>
                  <Sunrise className="text-yellow-400 pointer-events-none" size={metaIconSize} />
                </div>
              </TooltipTrigger>
              <TooltipContent
                side={(() => {
                  const dx = cx - sunrisePoint.x;
                  const dy = cy - sunrisePoint.y;
                  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
                  return dy > 0 ? "bottom" : "top";
                })()}
                sideOffset={6}
                className="bg-transparent border-0 shadow-none p-0 font-light"
              >
                <span style={{ fontSize: 11, lineHeight: 1.1, color: "#facc15" }}>{formatHour(sunrise)}</span>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute pointer-events-auto" style={{ left: sunsetPoint.x - metaIconSize / 2, top: sunsetPoint.y - metaIconSize / 2, transform: `rotate(${sunsetRotation}deg)`, transformOrigin: "center", zIndex: 3 }} aria-label={`Sunset at ${formatHour(sunset)}`}>
                  <Sunset className="text-orange-400 pointer-events-none" size={metaIconSize} />
                </div>
              </TooltipTrigger>
              <TooltipContent
                side={(() => {
                  const dx = cx - sunsetPoint.x;
                  const dy = cy - sunsetPoint.y;
                  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
                  return dy > 0 ? "bottom" : "top";
                })()}
                sideOffset={6}
                className="bg-transparent border-0 shadow-none p-0 font-light"
              >
                <span style={{ fontSize: 11, lineHeight: 1.1, color: "#fb923c" }}>{formatHour(sunset)}</span>
              </TooltipContent>
            </Tooltip>
          </>
        )}

        {selectedEvent && (
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", zIndex: 6, pointerEvents: "none" }}>
            <div style={{ pointerEvents: "auto" }}>
              <EventInfoBubble
                title={selectedEvent.title}
                organizer={selectedOrganizer}
                date={selectedDateLabel}
                timeRemaining={selectedTimeRemaining}
                url={selectedUrl}
                videoLink={videoLink ?? undefined}
                onClose={() => {
                  setSelectedEvent(null);
                  setCursorEventIndex(null);
                  onEventBubbleClosed?.();
                }}
                diameter={bubbleDiameter}
              />
            </div>
          </div>
        )}

        {showTimeLabel && !isScrolling && !isReturning && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: timeLabelPoint.x,
              top: timeLabelPoint.y,
              transform: `translate(-50%, -50%) rotate(${timeLabelRotation}deg)`,
              transformOrigin: "center",
              animation: isLabelFadingOut ? "quantum-fade-out 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards" : "quantum-fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
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
          <div className="absolute left-1/2 pointer-events-none" style={{ top: `calc(50% - ${innerRadius * 0.75}px)`, transform: "translateX(-50%)", zIndex: 8 }}>
            <div className="px-3 py-1.5 rounded-lg pointer-events-none" style={{ background: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(8px)" }}>
              <div className="pointer-events-none" style={{ fontSize: 11, lineHeight: 1.2, color: "#fff", fontWeight: 600, fontFamily: "'Montserrat', 'Inter', Arial, Helvetica, sans-serif", textAlign: "center" }}>
                {formatDateLabel(virtualDateTime)}
              </div>
              <div className="pointer-events-none" style={{ fontSize: 9, lineHeight: 1, color: "rgba(255, 255, 255, 0.7)", fontWeight: 500, fontFamily: "'Montserrat', 'Inter', Arial, Helvetica, sans-serif", textAlign: "center", marginTop: "2px" }}>
                {daysDiff > 0 ? `+${daysDiff} jour${daysDiff > 1 ? "s" : ""}` : `${daysDiff} jour${daysDiff < -1 ? "s" : ""}`}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};