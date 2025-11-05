import { useCallback, useEffect, useState } from "react";

export type SunTimes = {
  sunrise: number | null;
  sunset: number | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  latitude: number | null;
  longitude: number | null;
  timezoneOffset: number; // Offset en heures (ex: +1 ou +2 pour la France)
};

// Fonction pour obtenir l'offset du fuseau horaire local en heures
function getLocalTimezoneOffset(): number {
  const now = new Date();
  const offsetMinutes = now.getTimezoneOffset();
  // getTimezoneOffset retourne la différence en minutes entre UTC et l'heure locale
  // Valeur négative si on est en avance sur UTC (ex: -60 pour UTC+1)
  return -offsetMinutes / 60;
}

export function useSunTimes(): SunTimes {
  const [sunrise, setSunrise] = useState<number | null>(null);
  const [sunset, setSunset] = useState<number | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timezoneOffset, setTimezoneOffset] = useState<number>(getLocalTimezoneOffset());

  const fetchSunTimes = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Mettre à jour l'offset au moment du fetch (pour gérer les changements DST)
    const currentOffset = getLocalTimezoneOffset();
    setTimezoneOffset(currentOffset);

    const DEFAULT_COORDS = { lat: 48.8566, lon: 2.3522 };

    const fetchFromAPI = async (lat: number, lon: number) => {
      try {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        
        const response = await fetch(
          `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&date=${dateStr}&formatted=0`
        );
        
        if (!response.ok) {
          throw new Error('API request failed');
        }
        
        const data = await response.json();
        
        if (data.status !== 'OK') {
          throw new Error('API returned error status');
        }
        
        // L'API retourne les heures en UTC, on les convertit en heure locale
        const sunriseUTC = new Date(data.results.sunrise);
        const sunsetUTC = new Date(data.results.sunset);
        
        // Conversion en heure locale en utilisant les méthodes locales de Date
        const sunriseLocal = new Date(sunriseUTC.toLocaleString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }));
        const sunsetLocal = new Date(sunsetUTC.toLocaleString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }));
        
        const sunriseDecimal = sunriseLocal.getHours() + sunriseLocal.getMinutes() / 60 + sunriseLocal.getSeconds() / 3600;
        const sunsetDecimal = sunsetLocal.getHours() + sunsetLocal.getMinutes() / 60 + sunsetLocal.getSeconds() / 3600;
        
        setSunrise(Number(sunriseDecimal.toFixed(2)));
        setSunset(Number(sunsetDecimal.toFixed(2)));
        setLoading(false);
      } catch (err) {
        throw err;
      }
    };

    if (!navigator.geolocation) {
      const { lat, lon } = DEFAULT_COORDS;
      setLatitude(lat);
      setLongitude(lon);
      try {
        await fetchFromAPI(lat, lon);
      } catch (err) {
        setError("API indisponible. Utilisation de valeurs approximatives.");
        const sunriseCalc = 6 + (lat / 90) * 2 + currentOffset;
        const sunsetCalc = 21 - (lat / 90) * 2 + currentOffset;
        setSunrise(Number(sunriseCalc.toFixed(2)));
        setSunset(Number(sunsetCalc.toFixed(2)));
        setLoading(false);
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lon);
        
        try {
          await fetchFromAPI(lat, lon);
        } catch (err) {
          setError("API indisponible. Utilisation de valeurs approximatives.");
          const sunriseCalc = 6 + (lat / 90) * 2 + currentOffset;
          const sunsetCalc = 21 - (lat / 90) * 2 + currentOffset;
          setSunrise(Number(sunriseCalc.toFixed(2)));
          setSunset(Number(sunsetCalc.toFixed(2)));
          setLoading(false);
        }
      },
      async () => {
        const { lat, lon } = DEFAULT_COORDS;
        setLatitude(lat);
        setLongitude(lon);
        
        try {
          await fetchFromAPI(lat, lon);
          setError("Position indisponible (permission refusée). Utilisation de Paris par défaut.");
        } catch (err) {
          setError("Position et API indisponibles. Utilisation de valeurs approximatives.");
          const sunriseCalc = 6 + (lat / 90) * 2 + currentOffset;
          const sunsetCalc = 21 - (lat / 90) * 2 + currentOffset;
          setSunrise(Number(sunriseCalc.toFixed(2)));
          setSunset(Number(sunsetCalc.toFixed(2)));
          setLoading(false);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000,
      }
    );
  }, []);

  useEffect(() => {
    fetchSunTimes();
  }, [fetchSunTimes]);

  const retry = useCallback(() => {
    fetchSunTimes();
  }, [fetchSunTimes]);

  return {
    sunrise,
    sunset,
    loading,
    error,
    retry,
    latitude,
    longitude,
    timezoneOffset,
  };
}