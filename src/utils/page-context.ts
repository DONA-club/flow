import type { CalendarEvent } from "@/hooks/use-google-calendar";

type PageContext = {
  timestamp: string;
  page: {
    url: string;
    title: string;
    pathname: string;
    search: string;
    hash: string;
  };
  viewport: {
    width: number;
    height: number;
    devicePixelRatio: number;
    orientation: string;
  };
  theme: {
    isDarkMode: boolean;
    colorScheme: string;
  };
  calendar: {
    currentDate: string;
    virtualDate: string | null;
    displayedDay: string;
    sunrise: number;
    sunset: number;
    latitude: number | null;
    longitude: number | null;
    timezoneOffset: number;
  };
  events: {
    total: number;
    upcoming: Array<{
      title: string;
      organizer: string;
      start: string;
      end: string;
      duration: number;
      timeUntil: number | null;
      location: string;
      hasVideoLink: boolean;
      url: string | null;
    }>;
    currentEvent: {
      title: string;
      organizer: string;
      start: string;
      end: string;
      timeRemaining: number;
    } | null;
  };
  sleep: {
    connected: boolean;
    wakeHour: number | null;
    bedHour: number | null;
    totalSleepHours: number | null;
    sleepSessions: Array<{ bedHour: number; wakeHour: number }> | null;
    debtOrCapital: {
      type: "debt" | "capital";
      hours: number;
      daysCount: number;
    } | null;
    idealBedHour: number | null;
  };
  connections: {
    google: boolean;
    microsoft: boolean;
    apple: boolean;
    facebook: boolean;
    amazon: boolean;
  };
  ui: {
    calendarSize: number;
    isHoveringRing: boolean;
    selectedEvent: string | null;
    chatkitExpanded: boolean;
  };
  user: {
    deviceId: string;
    userAgent: string;
    language: string;
    timezone: string;
  };
};

function getDeviceId(): string {
  const key = "chatkit_device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function formatEventTime(decimal: number): string {
  const h = Math.floor(decimal);
  const m = Math.round((decimal % 1) * 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function getEventStartDate(event: CalendarEvent, reference: Date): Date | null {
  const raw = event.raw;
  const iso = raw?.start?.dateTime || raw?.start?.date || null;
  if (iso) return new Date(iso);

  const base = new Date(reference);
  const hours = Math.floor(event.start || 0);
  const minutes = Math.round(((event.start || 0) % 1) * 60);
  base.setHours(hours, minutes, 0, 0);
  return base;
}

function getEventEndDate(event: CalendarEvent, startDate: Date): Date | null {
  const raw = event.raw;
  const iso = raw?.end?.dateTime || raw?.end?.date || null;
  if (iso) return new Date(iso);

  const end = new Date(startDate);
  const hours = Math.floor(event.end || 0);
  const minutes = Math.round(((event.end || 0) % 1) * 60);
  end.setHours(hours, minutes, 0, 0);
  return end;
}

function extractVideoConferenceLink(event: CalendarEvent): boolean {
  const raw = event.raw;
  if (!raw) return false;

  const patterns = [
    /https?:\/\/[^\s<>"]*meet\.google\.com[^\s<>"]*/gi,
    /https?:\/\/[^\s<>"]*zoom\.us[^\s<>"]*/gi,
    /https?:\/\/[^\s<>"]*teams\.microsoft\.com[^\s<>"]*/gi,
    /https?:\/\/[^\s<>"]*webex\.com[^\s<>"]*/gi,
  ];

  const searchStrings: string[] = [];
  if (typeof event.place === "string") searchStrings.push(event.place);
  if (raw?.description) searchStrings.push(raw.description);
  if (raw?.body?.content) searchStrings.push(raw.body.content);

  for (const str of searchStrings) {
    for (const pattern of patterns) {
      if (pattern.test(str)) return true;
    }
  }

  return false;
}

export function generatePageContext(params: {
  virtualDateTime: Date | null;
  sunrise: number;
  sunset: number;
  latitude: number | null;
  longitude: number | null;
  timezoneOffset: number;
  events: CalendarEvent[];
  wakeHour: number | null;
  bedHour: number | null;
  totalSleepHours: number | null;
  sleepSessions: Array<{ bedHour: number; wakeHour: number }> | null;
  sleepDebtOrCapital: { type: "debt" | "capital"; hours: number; daysCount: number } | null;
  idealBedHour: number | null;
  fitConnected: boolean;
  connectedProviders: Record<string, boolean>;
  calendarSize: number;
  isHoveringRing: boolean;
  selectedEvent: CalendarEvent | null;
  chatkitExpanded: boolean;
}): PageContext {
  const now = new Date();
  const displayDate = params.virtualDateTime || now;

  const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

  // Événements à venir (prochaines 72h)
  const upcomingEvents = params.events
    .map((event) => {
      const start = getEventStartDate(event, now);
      const end = start ? getEventEndDate(event, start) : null;
      return { event, start, end };
    })
    .filter((entry): entry is { event: CalendarEvent; start: Date; end: Date } => !!entry.start && !!entry.end)
    .filter((entry) => entry.start.getTime() >= now.getTime())
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 10)
    .map(({ event, start, end }) => {
      const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      const timeUntil = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      return {
        title: event.title,
        organizer: event.place || event.raw?.organizer?.displayName || event.raw?.organizer?.emailAddress?.name || "Inconnu",
        start: start.toISOString(),
        end: end.toISOString(),
        duration: Number(duration.toFixed(2)),
        timeUntil: timeUntil > 0 ? Number(timeUntil.toFixed(2)) : null,
        location: event.place,
        hasVideoLink: extractVideoConferenceLink(event),
        url: event.url || null,
      };
    });

  // Événement en cours
  const currentEventData = params.events
    .map((event) => {
      const start = getEventStartDate(event, now);
      const end = start ? getEventEndDate(event, start) : null;
      return { event, start, end };
    })
    .filter((entry): entry is { event: CalendarEvent; start: Date; end: Date } => !!entry.start && !!entry.end)
    .find((entry) => {
      const nowMs = now.getTime();
      return nowMs >= entry.start.getTime() && nowMs < entry.end.getTime();
    });

  const currentEvent = currentEventData
    ? {
        title: currentEventData.event.title,
        organizer: currentEventData.event.place || currentEventData.event.raw?.organizer?.displayName || "Inconnu",
        start: currentEventData.start.toISOString(),
        end: currentEventData.end.toISOString(),
        timeRemaining: Number(((currentEventData.end.getTime() - now.getTime()) / (1000 * 60 * 60)).toFixed(2)),
      }
    : null;

  const context: PageContext = {
    timestamp: now.toISOString(),
    page: {
      url: window.location.href,
      title: document.title,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      orientation: window.innerWidth > window.innerHeight ? "landscape" : "portrait",
    },
    theme: {
      isDarkMode,
      colorScheme: isDarkMode ? "dark" : "light",
    },
    calendar: {
      currentDate: now.toISOString(),
      virtualDate: params.virtualDateTime?.toISOString() || null,
      displayedDay: displayDate.toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      sunrise: params.sunrise,
      sunset: params.sunset,
      latitude: params.latitude,
      longitude: params.longitude,
      timezoneOffset: params.timezoneOffset,
    },
    events: {
      total: params.events.length,
      upcoming: upcomingEvents,
      currentEvent,
    },
    sleep: {
      connected: params.fitConnected,
      wakeHour: params.wakeHour,
      bedHour: params.bedHour,
      totalSleepHours: params.totalSleepHours,
      sleepSessions: params.sleepSessions,
      debtOrCapital: params.sleepDebtOrCapital,
      idealBedHour: params.idealBedHour,
    },
    connections: {
      google: params.connectedProviders.google || false,
      microsoft: params.connectedProviders.microsoft || false,
      apple: params.connectedProviders.apple || false,
      facebook: params.connectedProviders.facebook || false,
      amazon: params.connectedProviders.amazon || false,
    },
    ui: {
      calendarSize: params.calendarSize,
      isHoveringRing: params.isHoveringRing,
      selectedEvent: params.selectedEvent?.title || null,
      chatkitExpanded: params.chatkitExpanded,
    },
    user: {
      deviceId: getDeviceId(),
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };

  // ✅ LOG CLAIR UNE SEULE FOIS
  console.log("📋 [PageContext] Generated:", JSON.stringify(context, null, 2));

  return context;
}

export type { PageContext };