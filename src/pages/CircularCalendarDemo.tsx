import React from "react";
import { CircularCalendar } from "@/components/CircularCalendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSunTimes } from "@/hooks/use-sun-times";
import { Button } from "@/components/ui/button";

const mockEvents = [
  { title: "Morning Meeting", place: "Office", start: 9, end: 10 },
  { title: "Lunch with Sarah", place: "Cafe", start: 12, end: 13 },
  { title: "Project Review", place: "Zoom", start: 15, end: 16 },
  { title: "Gym", place: "Fitness Center", start: 18, end: 19 },
];

const CircularCalendarDemo = () => {
  const { sunrise, sunset, loading, error, retry } = useSunTimes();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-8">
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Calendrier Circulaire</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative" style={{ width: 320, height: 320 }}>
            {loading ? (
              <div className="flex items-center justify-center h-full text-gray-500">Chargement de la localisation…</div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-red-500 gap-2">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={retry}>
                  Réessayer
                </Button>
                <span className="text-xs text-gray-400 mt-2">
                  Si le problème persiste, vérifiez que la localisation est activée sur votre appareil et que votre navigateur a l'autorisation.
                </span>
              </div>
            ) : sunrise === null || sunset === null ? (
              <div className="flex items-center justify-center h-full text-red-500">
                Erreur lors de la récupération des horaires du soleil.
              </div>
            ) : (
              <CircularCalendar sunrise={sunrise} sunset={sunset} events={mockEvents} />
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
        </CardContent>
      </Card>
    </div>
  );
};

export default CircularCalendarDemo;