import { useEffect, useState, useCallback } from "react";

type SunTimes = {
  sunrise: number | null;
  sunset: number | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
};

function toLocalDecimalHour(utcIsoString: string): number {
  const utcDate = new Date(utcIsoString);
  const localDate = new Date(
    utcDate.getUTCFullYear(),
    utcDate.getUTCMonth(),
    utcDate.getUTCDate(),
    utcDate.getUTCHours(),
    utcDate.getUTCMinutes(),
    utcDate.getUTCSeconds()
  );
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

  const fetchSunTimes = useCallback(() => {
    setLoading(true);
    setError(null);
    setSunrise(null);
    setSunset(null);

    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par ce navigateur.");
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
          setError("Autorisation de localisation refusée. Veuillez autoriser l'accès à la localisation dans votre navigateur.");
        } else if (err.code === 2) {
          setError("Position non disponible. Essayez de réessayer ou vérifiez votre connexion.");
        } else if (err.code === 3) {
          setError("Le délai de localisation a expiré. Essayez de réessayer.");
        } else {
          setError("Erreur inconnue lors de la récupération de la localisation.");
        }
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    fetchSunTimes();
  }, [fetchSunTimes]);

  return { sunrise, sunset, loading, error, retry: fetchSunTimes };
}