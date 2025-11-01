import { useEffect, useState } from "react";

type SunTimes = {
  sunrise: number | null; // heure décimale locale (ex: 6.5)
  sunset: number | null;  // heure décimale locale (ex: 20.25)
  loading: boolean;
  error: string | null;
};

function toDecimalHour(dateStr: string): number {
  // dateStr format: "2024-07-01T04:56:00+00:00"
  const date = new Date(dateStr);
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
}

export function useSunTimes(): SunTimes {
  const [sunrise, setSunrise] = useState<number | null>(null);
  const [sunset, setSunset] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // Appel à l'API sunrise-sunset.org (format ISO8601, UTC)
        fetch(
          `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&formatted=0`
        )
          .then((res) => res.json())
          .then((data) => {
            if (data.status !== "OK") {
              setError("Erreur lors de la récupération des horaires du soleil.");
              setLoading(false);
              return;
            }
            // On convertit l'heure UTC en heure locale
            const sunriseUTC = new Date(data.results.sunrise);
            const sunsetUTC = new Date(data.results.sunset);
            const sunriseLocal = new Date(sunriseUTC.toLocaleString("en-US", { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }));
            const sunsetLocal = new Date(sunsetUTC.toLocaleString("en-US", { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }));
            setSunrise(sunriseLocal.getHours() + sunriseLocal.getMinutes() / 60 + sunriseLocal.getSeconds() / 3600);
            setSunset(sunsetLocal.getHours() + sunsetLocal.getMinutes() / 60 + sunsetLocal.getSeconds() / 3600);
            setLoading(false);
          })
          .catch(() => {
            setError("Impossible de récupérer les horaires du soleil.");
            setLoading(false);
          });
      },
      (err) => {
        setError("Impossible d'obtenir la localisation.");
        setLoading(false);
      }
    );
  }, []);

  return { sunrise, sunset, loading, error };
}