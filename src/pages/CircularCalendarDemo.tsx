import React, { useEffect, useState } from "react";
import { CircularCalendar } from "@/components/CircularCalendar";
import { Button } from "@/components/ui/button";
import { useSunTimes } from "@/hooks/use-sun-times";
import { StackedEphemeralLogs } from "@/components/StackedEphemeralLogs";

const mockEvents = [
  { title: "Morning Meeting", place: "Office", start: 9, end: 10 },
  { title: "Lunch with Sarah", place: "Cafe", start: 12, end: 13 },
  { title: "Project Review", place: "Zoom", start: 15, end: 16 },
  { title: "Gym", place: "Fitness Center", start: 18, end: 19 },
];

// Valeurs par défaut (ex: Paris en été)
const DEFAULT_SUNRISE = 6.0;
const DEFAULT_SUNSET = 21.0;
const GOLDEN_RATIO = 1.618;

function useGoldenCircleSize() {
  const [size, setSize] = useState(320);

  useEffect(() => {
    function updateSize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // On prend la plus petite dimension pour éviter de dépasser l'écran
      const minDim = Math.min(w, h);
      // On laisse une marge de 32px autour
      const available = minDim - 32;
      // Taille selon le nombre d'or
      const golden = Math.floor(available / GOLDEN_RATIO);
      // On limite à 600px max pour éviter les très grands écrans
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
  const [displaySunrise, setDisplaySunrise] = useState(DEFAULT_SUNRISE);
  const [displaySunset, setDisplaySunset] = useState(DEFAULT_SUNSET);
  const size = useGoldenCircleSize();

  // Pile de logs à afficher (thread)
  const [logs, setLogs] = useState<{ message: string; type?: LogType }[]>([]);

  // Met à jour l'affichage dès qu'on a la vraie localisation
  useEffect(() => {
    if (sunrise !== null && sunset !== null && !loading && !error) {
      setDisplaySunrise(sunrise);
      setDisplaySunset(sunset);
    }
  }, [sunrise, sunset, loading, error]);

  // Gestion thread : persiste "..." puis transforme en confirmation/erreur
  useEffect(() => {
    if (loading) {
      setLogs([{ message: "Chargement de la localisation…", type: "info" }]);
    } else if (error) {
      setLogs([{ message: error, type: "error" }]);
    } else if (sunrise !== null && sunset !== null) {
      setLogs([{ message: "Localisation détectée !", type: "success" }]);
    }
    // eslint-disable-next-line
  }, [loading, error, sunrise, sunset]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-8">
      <div className="relative" style={{ width: size, height: size }}>
        <CircularCalendar
          sunrise={displaySunrise}
          sunset={displaySunset}
          events={mockEvents}
          size={size}
        />
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
      <div className="mt-6 text-center text-gray-500 text-sm">
        {loading
          ? "Recherche de la position…"
          : sunrise !== null && sunset !== null
          ? `Sunrise: ${Math.floor(sunrise)
              .toString()
              .padStart(2, "0")}:${Math.round((sunrise % 1) * 60)
              .toString()
              .padStart(2, "0")} | Sunset: ${Math.floor(sunset)
              .toString()
              .padStart(2, "0")}:${Math.round((sunset % 1) * 60)
              .toString()
              .padStart(2, "0")}`
          : ""}
      </div>
      <StackedEphemeralLogs logs={logs} fadeOutDuration={2000} />
    </div>
  );
};

export default CircularCalendarDemo;