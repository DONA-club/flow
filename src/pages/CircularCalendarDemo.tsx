import React, { useEffect, useState } from "react";
import { CircularCalendar } from "@/components/CircularCalendar";
import { Button } from "@/components/ui/button";
import { useSunTimes } from "@/hooks/use-sun-times";
import { StackedEphemeralLogs } from "@/components/StackedEphemeralLogs";
import { Calendar } from "lucide-react";
import { useGoogleCalendar } from "@/hooks/use-google-calendar";
import { useGoogleFitSleep } from "@/hooks/use-google-fit";
import EventInfoBubble from "@/components/EventInfoBubble";
import { toast } from "sonner";
import FontLoader from "@/components/FontLoader";

const mockEvents = [
  { title: "Morning Meeting", place: "Office", start: 9, end: 10 },
  { title: "Lunch with Sarah", place: "Cafe", start: 12, end: 13 },
  { title: "Project Review", place: "Zoom", start: 15, end: 16 },
  { title: "Gym", place: "Fitness Center", start: 18, end: 19 },
];

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
  const { sunrise, sunset, loading, error, retry } = useSunTimes();
  const { events: gEvents, loading: gLoading, error: gError, connected } = useGoogleCalendar();
  const { wakeHour, bedHour, loading: fitLoading, error: fitError, connected: fitConnected } = useGoogleFitSleep();
  const [displaySunrise, setDisplaySunrise] = useState(DEFAULT_SUNRISE);
  const [displaySunset, setDisplaySunset] = useState(DEFAULT_SUNSET);
  const size = useGoldenCircleSize();

  const [logs, setLogs] = useState<{ message: string; type?: LogType }[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<{ title: string; place?: string; start?: number; end?: number } | null>(null);

  const SIM_WAKE = 7 + 47 / 60;
  const SIM_BED = 22 + 32 / 60;

  const effectiveWake = fitConnected && wakeHour != null && bedHour != null ? wakeHour : SIM_WAKE;
  const effectiveBed = fitConnected && wakeHour != null && bedHour != null ? bedHour : SIM_BED;

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
      setLogs([{ message: "Synchronisation du calendrier…", type: "info" }]);
    } else if (gError) {
      setLogs([{ message: gError, type: "error" }]);
    } else if (connected && gEvents.length > 0) {
      setLogs([{ message: "Calendrier Google synchronisé ✔️", type: "success" }]);
    }
  }, [gLoading, gError, connected, gEvents.length]);

  useEffect(() => {
    if (fitLoading) {
      setLogs([{ message: "Récupération des heures de sommeil…", type: "info" }]);
    } else if (fitError) {
      setLogs([{ message: fitError, type: "error" }]);
    } else if (fitConnected && wakeHour != null && bedHour != null) {
      setLogs([{ message: "Heures lever/coucher récupérées ✔️ (Google Fit)", type: "success" }]);
    } else {
      setLogs([{ message: "Mode simulé: lever 07:47 / coucher 22:32", type: "info" }]);
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

  return (
    <>
      <FontLoader />
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-8">
        <div
          className="relative flex items-center justify-center"
          style={{ width: size + outerPad * 2, height: size + outerPad * 2 }}
        >
          <CircularCalendar
            sunrise={displaySunrise}
            sunset={displaySunset}
            events={gEvents.length > 0 ? gEvents : mockEvents}
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
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 text-red-500 gap-2">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={retry}>
                Réessayer
              </Button>
              <span className="text-xs text-gray-400 mt-2">
                Si le problème persiste, vérifiez que la localisation est activée sur votre appareil et que votre navigateur a l'autorisation.
              </span>
            </div>
          )}
        </div>
        {/* Notifications éphemères: texte simple, ~5s de durée totale */}
        <StackedEphemeralLogs logs={logs} fadeOutDuration={5000} />
      </div>
    </>
  );
};

export default CircularCalendarDemo;