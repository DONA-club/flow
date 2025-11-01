import { useEffect, useState } from "react";

type SunTimes = {
  sunrise: number | null; // heure décimale locale (ex: 6.5)
  sunset: number | null;  // heure décimale locale (ex: 20.25)
  loading: boolean;
  error: string | null;
};

function toLocalDecimalHour(utcIsoString: string): number {
  // Convertit une date ISO UTC en heure locale décimale
  const utcDate = new Date(utcIsoString);
  const localDate = new Date(
    utcDate.getUTCFullYear(),
    utcDate.getUTCMonth(),
    utcDate.getUTCDate(),
    utcDate.getUTCHours(),
    utcDate.getUTCMinutes(),
    utcDate.getUTCSeconds()
  );
  // Décalage entre UTC et local
  const tzOffsetMin = localDate.getTimezoneOffset();
  localDate.setMinutes(localDate.getMinutes() - tzOffsetMin);
  return (
    localDate.getHours() +
    localDate.getMinutes() / 60 +
    localDate.getSeconds() / 3600
  );
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
            // Conversion UTC → heure locale décimale
            const sunriseDec = toLocalDecimalHour(data.results.sunrise);
            const sunsetDec = toLocalDecimalHour(data.results.sunset);
            setSunrise(sunriseDec);
            setSunset(sunsetDec);
            setLoading(false);
          })
          .catch(() => {
            setError("Impossible de récupérer les horaires du soleil.");
            setLoading(false);
          });
      },
      (err) => {
        if (err.code === 1) {
          setError("Autorisation de localisation refusée.");
        } else {
          setError("Impossible d'obtenir la localisation.");
        }
        setLoading(false);
      }
    );
  }, []);

  return { sunrise, sunset, loading, error };
}