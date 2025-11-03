import React, { useEffect, useState } from "react";
import { CircularCalendar } from "@/components/CircularCalendar";
import { useSunTimes } from "@/hooks/use-sun-times";
import { StackedEphemeralLogs } from "@/components/StackedEphemeralLogs";
import { Calendar } from "lucide-react";
import { useGoogleCalendar } from "@/hooks/use-google-calendar";
import { useOutlookCalendar } from "@/hooks/use-outlook-calendar";
import { useGoogleFitSleep } from "@/hooks/use-google-fit";
import EventInfoBubble from "@/components/EventInfoBubble";
import { toast } from "sonner";
import FontLoader from "@/components/FontLoader";
import UpcomingEventsList from "@/components/UpcomingEventsList";
import { useMultiProviderAuth } from "@/hooks/use-multi-provider-auth";
import { useNavigate } from "react-router-dom";

const DEFAULT_SUNRISE = 6.0;
const DEFAULT_SUNSET = 21.0;
const GOLDEN_RATIO = 1.618;

function useGoldenCircleSize() {
  const [size, setSize] = useState(320);

  useEffect(() => {
    function updateSize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const minDim = Math.min(w, h);
      const available = minDim - 32;
      const golden = Math.floor(available / GOLDEN_RATIO);
      setSize(Math.max(180, Math.min(golden, 600)));
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return size;
}

type LogType = "info" | "success" | "error";

const CircularCalendarDemo = () => {
  const navigate = useNavigate();
  const { sunrise, sunset, loading, error, retry } = useSunTimes();
  const { connectedProviders, loading: authLoading } = useMultiProviderAuth();

  // Log l'état des providers connectés
  useEffect(() => {
    if (!authLoading) {
      console.log("🎯 CircularCalendarDemo: État des providers:", connectedProviders);
    }
  }, [connectedProviders, authLoading]);

  // Utiliser directement connectedProviders sans état intermédiaire
  const googleEnabled = connectedProviders?.google ?? false;
  const msEnabled = connectedProviders?.microsoft ?? false;

  console.log("🔧 CircularCalendarDemo: Configuration des hooks:", {
    googleEnabled,
    msEnabled,
    authLoading
  });

  // Charger les données en continu si les providers sont connectés
  const {
    events: gEvents,
    loading: gLoading,
    error: gError,
    connected: gConnected,
    refresh: refreshGoogle,
  } = useGoogleCalendar({ enabled: googleEnabled });

  const {
    events: oEvents,
    loading: oLoading,
    error: oError,
    connected: oConnected,
    refresh: refreshOutlook,
  } = useOutlookCalendar({ enabled: msEnabled });

  const {
    wakeHour,
    bedHour,
    loading: fitLoading,
    error: fitError,
    connected: fitConnected,
    refresh: refreshFit,
  } = useGoogleFitSleep({ enabled: googleEnabled });

  // Log l'état des hooks
  useEffect(() => {
    console.log("📊 CircularCalendarDemo: État des hooks:", {
      google: { enabled: googleEnabled, connected: gConnected, events: gEvents.length, loading: gLoading, error: gError },
      microsoft: { enabled: msEnabled, connected: oConnected, events: oEvents.length, loading: oLoading, error: oError },
      fit: { enabled: googleEnabled, connected: fitConnected, wakeHour, bedHour, loading: fitLoading, error: fitError }
    });
  }, [googleEnabled, msEnabled, gConnected, oConnected, fitConnected, gEvents.length, oEvents.length, gLoading, oLoading, fitLoading, gError, oError, fitError, wakeHour, bedHour]);

  const [displaySunrise, setDisplaySunrise] = useState(DEFAULT_SUNRISE);
  const [displaySunset, setDisplaySunset] = useState(DEFAULT_SUNSET);
  const size = useGoldenCircleSize();

  const [logs, setLogs] = useState<{ message: string; type?: LogType }[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const SIM_WAKE = 7 + 47 / 60;
  const SIM_BED = 22 + 32 / 60;

  const effectiveWake = fitConnected && wakeHour != null && bedHour != null ? wakeHour : SIM_WAKE;
  const effectiveBed = fitConnected && wakeHour != null && bedHour != null ? bedHour : SIM_BED;

  useEffect(() => {
    if (authLoading) return;
    const hasAnyConnection = Object.values(connectedProviders || {}).some(Boolean);
    if (!hasAnyConnection) {
      console.log("⚠️ CircularCalendarDemo: Aucun provider connecté, redirection vers /");
      navigate("/", { replace: true });
    }
  }, [authLoading, connectedProviders, navigate]);

  useEffect(() => {
    if (sunrise !== null && sunset !== null && !loading && !error) {
      setDisplaySunrise(sunrise);
      setDisplaySunset(sunset);
    }
  }, [sunrise, sunset, loading, error]);

  useEffect(() => {
    if (loading) {
      setLogs([{ message: "Chargement de la localisation…", type: "info" }]);
    } else if (error) {
      setLogs([{ message: error, type: "error" }]);
    } else if (sunrise !== null && sunset !== null) {
      setLogs([{ message: "Localisation détectée !", type: "success" }]);
    }
  }, [loading, error, sunrise, sunset]);

  useEffect(() => {
    if (gLoading) {
      setLogs([{ message: "Synchronisation du calendrier Google…", type: "info" }]);
    } else if (gError) {
      setLogs([{ message: gError, type: "error" }]);
    } else if (gConnected && gEvents.length > 0) {
      setLogs([{ message: `${gEvents.length} événements Google synchronisés ✔️`, type: "success" }]);
    }
  }, [gLoading, gError, gConnected, gEvents.length]);

  useEffect(() => {
    if (oLoading) {
      setLogs([{ message: "Synchronisation du calendrier Outlook…", type: "info" }]);
    } else if (oError) {
      setLogs([{ message: oError, type: "error" }]);
    } else if (oConnected && oEvents.length > 0) {
      setLogs([{ message: `${oEvents.length} événements Outlook synchronisés ✔️`, type: "success" }]);
    }
  }, [oLoading, oError, oConnected, oEvents.length]);

  useEffect(() => {
    if (fitLoading) {
      setLogs([{ message: "Récupération des heures de sommeil…", type: "info" }]);
    } else if (fitError) {
      setLogs([{ message: fitError, type: "error" }]);
    } else if (fitConnected && wakeHour != null && bedHour != null) {
      setLogs([{ message: "Heures lever/coucher récupérées ✔️ (Google Fit)", type: "success" }]);
    }
  }, [fitLoading, fitError, fitConnected, wakeHour, bedHour]);

  function formatHour(decimal: number) {
    const h = Math.floor(decimal).toString().padStart(2, "0");
    const m = Math.round((decimal % 1) * 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  }

  function formatRange(start?: number, end?: number) {
    if (start == null || end == null) return "";
    return `${formatHour(start)} — ${formatHour(end)}`;
  }

  const outerPad = Math.max(8, Math.round(size * 0.03));

  // Fusionner tous les événements Google + Microsoft
  const combinedEvents = [...gEvents, ...oEvents].sort((a, b) => {
    const aStart = (a as any)?.raw?.start?.dateTime || (a.start ?? 0);
    const bStart = (b as any)?.raw?.start?.dateTime || (b.start ?? 0);
    return new Date(aStart).getTime() - new Date(bStart).getTime();
  });

  console.log("📅 CircularCalendarDemo: Événements combinés:", {
    google: gEvents.length,
    microsoft: oEvents.length,
    total: combinedEvents.length
  });

  // Auto-refresh toutes les minutes pour maintenir la synchronisation continue
  useEffect(() => {
    const id = window.setInterval(() => {
      console.log("🔄 CircularCalendarDemo: Auto-refresh des données");
      if (googleEnabled) {
        refreshGoogle();
        refreshFit();
      }
      if (msEnabled) {
        refreshOutlook();
      }
    }, 60_000);
    return () => window.clearInterval(id);
  }, [googleEnabled, msEnabled, refreshGoogle, refreshOutlook, refreshFit]);

  const hasAnyConnection = Object.values(connectedProviders || {}).some(Boolean);

  return (
    <>
      <FontLoader />

      {hasAnyConnection && (
        <UpcomingEventsList
          events={combinedEvents}
          onSelect={(evt) => {
            setSelectedEvent(evt);
            toast.info("Détails de l'événement", {
              description: `${evt.title} • ${formatRange(evt.start, evt.end)}`,
            });
          }}
        />
      )}

      <div className="flex flex-col items-center justify-center min-h-screen py-8 calendar-light-bg">
        <div
          className="relative flex items-center justify-center"
          style={{ width: size + outerPad * 2, height: size + outerPad * 2 }}
        >
          <CircularCalendar
            sunrise={displaySunrise}
            sunset={displaySunset}
            events={combinedEvents}
            size={size}
            wakeHour={effectiveWake}
            bedHour={effectiveBed}
            eventIcon={<Calendar className="inline-block mr-1 w-5 h-5 text-blue-700 align-text-bottom" />}
            onEventClick={(evt) => {
              setSelectedEvent(evt);
              toast.info("Détails de l'événement", {
                description: `${evt.title} • ${formatRange(evt.start, evt.end)}`,
              });
            }}
          />
          {selectedEvent && (
            <EventInfoBubble
              title={selectedEvent.title}
              place={selectedEvent.place}
              time={formatRange(selectedEvent.start, selectedEvent.end)}
              onClose={() => setSelectedEvent(null)}
            />
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 text-red-500 gap-2 rounded-full">
              <span className="text-sm text-center px-4">{error}</span>
            </div>
          )}
        </div>
        <StackedEphemeralLogs logs={logs} fadeOutDuration={5000} />
      </div>
    </>
  );
};

export default CircularCalendarDemo;