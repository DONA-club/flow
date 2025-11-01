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

async function getLocationByIP() {
  // Utilisation de ipinfo.io (pas besoin de clé pour 50k requêtes/mois)
  const res = await fetch("https://ipinfo.io/json?token=");
  if (!res.ok) throw new Error("Impossible de localiser par IP.");
  const data = await res.json();
  if (!data.loc) throw new Error("Impossible de localiser par IP.");
  const [latitude, longitude] = data.loc.split(",").map(Number);
  return { latitude, longitude };
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

    function fetchSunriseSunset(latitude: number, longitude: number) {
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
    }

    // 1. Essayer la géolocalisation navigateur
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          fetchSunriseSunset(latitude, longitude);
        },
        async (err) => {
          // 2. Si refusé ou erreur, fallback sur IP
          try {
            const { latitude, longitude } = await getLocationByIP();
            fetchSunriseSunset(latitude, longitude);
          } catch (ipErr) {
            if (err.code === 1) {
              setError("Autorisation de localisation refusée. Localisation approximative par IP impossible.");
            } else if (err.code === 2) {
              setError("Position non disponible. Localisation approximative par IP impossible.");
            } else if (err.code === 3) {
              setError("Le délai de localisation a expiré. Localisation approximative par IP impossible.");
            } else {
              setError("Erreur inconnue lors de la récupération de la localisation.");
            }
            setLoading(false);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      // 3. Si pas de support navigateur, fallback sur IP
      getLocationByIP()
        .then(({ latitude, longitude }) => {
          fetchSunriseSunset(latitude, longitude);
        })
        .catch(() => {
          setError("La géolocalisation n'est pas supportée et la localisation par IP a échoué.");
          setLoading(false);
        });
    }
  }, []);

  useEffect(() => {
    fetchSunTimes();
  }, [fetchSunTimes]);

  return { sunrise, sunset, loading, error, retry: fetchSunTimes };
}