import React, { useEffect, useState } from "react";
import { CircularCalendar } from "@/components/CircularCalendar";
import { useSunTimes } from "@/hooks/use-sun-times";
import { StackedEphemeralLogs } from "@/components/StackedEphemeralLogs";
import { useGoogleCalendar } from "@/hooks/use-google-calendar";
import { useOutlookCalendar } from "@/hooks/use-outlook-calendar";
import { useGoogleFitSleep } from "@/hooks/use-google-fit";
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

  const googleEnabled = connectedProviders?.google ?? false;
  const msEnabled = connectedProviders?.microsoft ?? false;

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

  const [displaySunrise, setDisplaySunrise] = useState(DEFAULT_SUNRISE);
  const [displaySunset, setDisplaySunset] = useState(DEFAULT_SUNSET);
  const size = useGoldenCircleSize();

  const [logs, setLogs] = useState<{ message: string; type?: LogType }[]>([]);
  const [selectedEventFromList, setSelectedEventFromList] = useState<any>(null);

  const SIM_WAKE = 7 + 47 / 60;
  const SIM_BED = 22 + 32 / 60;

  const effectiveWake = fitConnected && wakeHour != null && bedHour != null ? wakeHour : SIM_WAKE;
  const effectiveBed = fitConnected && wakeHour != null && bedHour != null ? bedHour : SIM_BED;

  // Log de debug au montage du composant
  useEffect(() => {
    console.log("🚀 CircularCalendarDemo monté");
    console.log("📊 Z-index hierarchy:");
    console.log("  - Fond: implicite (le plus bas)");
    console.log("  - Logs: z-index 30");
    console.log("  - Calendrier: z-index 20");
    console.log("  - Section À venir: z-index 100");
  }, []);

  useEffect(() => {
    if (authLoading) return;
    const hasAnyConnection = Object.values(connectedProviders || {}).some(Boolean);
    console.log("🔐 Auth check:", { hasAnyConnection, connectedProviders });
    if (!hasAnyConnection) {
      console.log("❌ Aucune connexion détectée, redirection vers /");
      navigate("/", { replace: true });
    } else {
      console.log("✅ Connexion détectée, affichage du calendrier");
    }
  }, [authLoading, connectedProviders, navigate]);

  useEffect(() => {
    if (sunrise !== null && sunset !== null && !loading && !error) {
      console.log("🌅 Sunrise/Sunset mis à jour:", { sunrise, sunset });
      setDisplaySunrise(sunrise);
      setDisplaySunset(sunset);
    }
  }, [sunrise, sunset, loading, error]);

  useEffect(() => {
    if (loading) {
      console.log("⏳ Chargement de la localisation...");
      setLogs([{ message: "Chargement de la localisation…", type: "info" }]);
    } else if (error) {
      console.error("❌ Erreur localisation:", error);
      setLogs([{ message: error, type: "error" }]);
    } else if (sunrise !== null && sunset !== null) {
      console.log("✅ Localisation détectée");
      setLogs([{ message: "Localisation détectée !", type: "success" }]);
    }
  }, [loading, error, sunrise, sunset]);

  useEffect(() => {
    console.log("📅 Google Calendar:", { 
      enabled: googleEnabled, 
      loading: gLoading, 
      connected: gConnected, 
      eventsCount: gEvents.length,
      error: gError 
    });
    
    if (gLoading) {
      setLogs([{ message: "Synchronisation du calendrier Google…", type: "info" }]);
    } else if (gError) {
      setLogs([{ message: gError, type: "error" }]);
    } else if (gConnected && gEvents.length > 0) {
      setLogs([{ message: `${gEvents.length} événements Google synchronisés ✔️`, type: "success" }]);
    }
  }, [googleEnabled, gLoading, gError, gConnected, gEvents.length]);

  useEffect(() => {
    console.log("📅 Outlook Calendar:", { 
      enabled: msEnabled, 
      loading: oLoading, 
      connected: oConnected, 
      eventsCount: oEvents.length,
      error: oError 
    });
    
    if (oLoading) {
      setLogs([{ message: "Synchronisation du calendrier Outlook…", type: "info" }]);
    } else if (oError) {
      setLogs([{ message: oError, type: "error" }]);
    } else if (oConnected && oEvents.length > 0) {
      setLogs([{ message: `${oEvents.length} événements Outlook synchronisés ✔️`, type: "success" }]);
    }
  }, [msEnabled, oLoading, oError, oConnected, oEvents.length]);

  useEffect(() => {
    console.log("😴 Google Fit Sleep:", { 
      enabled: googleEnabled, 
      loading: fitLoading, 
      connected: fitConnected, 
      wakeHour, 
      bedHour,
      error: fitError 
    });
    
    if (fitLoading) {
      setLogs([{ message: "Récupération des heures de sommeil…", type: "info" }]);
    } else if (fitError) {
      setLogs([{ message: fitError, type: "error" }]);
    } else if (fitConnected && wakeHour != null && bedHour != null) {
      setLogs([{ message: "Heures lever/coucher récupérées ✔️ (Google Fit)", type: "success" }]);
    }
  }, [googleEnabled, fitLoading, fitError, fitConnected, wakeHour, bedHour]);

  const outerPad = Math.max(8, Math.round(size * 0.03));

  const combinedEvents = [...gEvents, ...oEvents].sort((a, b) => {
    const aStart = (a as any)?.raw?.start?.dateTime || (a.start ?? 0);
    const bStart = (b as any)?.raw?.start?.dateTime || (b.start ?? 0);
    return new Date(aStart).getTime() - new Date(bStart).getTime();
  });

  console.log("📊 Combined events:", combinedEvents.length);

  useEffect(() => {
    const id = window.setInterval(() => {
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

  console.log("🎨 Render CircularCalendarDemo:", {
    size,
    hasAnyConnection,
    eventsCount: combinedEvents.length,
    displaySunrise,
    displaySunset,
  });

  return (
    <>
      <FontLoader />

      {/* Fond - z-index implicite (le plus bas) */}
      <div 
        className="fixed inset-0 calendar-light-bg" 
        style={{ zIndex: 0 }}
        id="calendar-page-container"
      />

      {/* Logs - z-index: 1 (juste au-dessus du fond) */}
      <div style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none" }}>
        <StackedEphemeralLogs logs={logs} fadeOutDuration={5000} />
      </div>

      {/* Calendrier principal - z-index: 10 */}
      <div 
        className="flex flex-col items-center justify-center min-h-screen py-8" 
        style={{ position: "relative", zIndex: 10 }}
      >
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
            externalSelectedEvent={selectedEventFromList}
            onEventBubbleClosed={() => setSelectedEventFromList(null)}
          />
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 text-red-500 gap-2 rounded-full">
              <span className="text-sm text-center px-4">{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Section "À venir" - z-index: 100 (le plus haut) */}
      {hasAnyConnection && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, pointerEvents: "none" }}>
          <div style={{ pointerEvents: "auto" }}>
            <UpcomingEventsList
              events={combinedEvents}
              onSelect={(evt) => {
                console.log("📌 Événement sélectionné depuis la liste:", evt.title);
                setSelectedEventFromList(evt);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default CircularCalendarDemo;