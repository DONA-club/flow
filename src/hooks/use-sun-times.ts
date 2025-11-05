import { useCallback, useEffect, useState } from "react";

export type SunTimes = {
  sunrise: number | null;
  sunset: number | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  latitude: number | null;
  longitude: number | null;
};

// Fonction pour convertir une heure UTC en heure locale décimale
function utcToLocalDecimal(utcTimeStr: string, date: Date): number {
  // Format attendu: "7:42:18 AM" ou "5:21:32 PM"
  const [time, period] = utcTimeStr.split(' ');
  const [hours, minutes, seconds] = time.split(':').map(Number);
  
  let hour24 = hours;
  if (period === 'PM' && hours !== 12) hour24 += 12;
  if (period === 'AM' && hours === 12) hour24 = 0;
  
  // Créer une date UTC
  const utcDate = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    hour24,
    minutes,
    seconds || 0
  ));
  
  // Convertir en heure locale
  const localHours = utcDate.getHours();
  const localMinutes = utcDate.getMinutes();
  const localSeconds = utcDate.getSeconds();
  
  return localHours + localMinutes / 60 + localSeconds / 3600;
}

export function useSunTimes(): SunTimes {
  const [sunrise, setSunrise] = useState<number | null>(null);
  const [sunset, setSunset] = useState<number | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSunTimes = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Fallback de localisation (Paris) si la géolocalisation est indisponible
    const DEFAULT_COORDS = { lat: 48.8566, lon: 2.3522 };

    const fetchFromAPI = async (lat: number, lon: number) => {
      try {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0]; // Format YYYY-MM-DD
        
        // API gratuite sunrise-sunset.org
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
        
        // Les heures sont en UTC, on les convertit en heure locale
        const sunriseUTC = new Date(data.results.sunrise);
        const sunsetUTC = new Date(data.results.sunset);
        
        const sunriseDecimal = sunriseUTC.getHours() + sunriseUTC.getMinutes() / 60 + sunriseUTC.getSeconds() / 3600;
        const sunsetDecimal = sunsetUTC.getHours() + sunsetUTC.getMinutes() / 60 + sunsetUTC.getSeconds() / 3600;
        
        console.log(`🌅 API sunrise-sunset.org: Sunrise ${sunriseDecimal.toFixed(2)}h (${sunriseUTC.toLocaleTimeString()}), Sunset ${sunsetDecimal.toFixed(2)}h (${sunsetUTC.toLocaleTimeString()})`);
        
        setSunrise(Number(sunriseDecimal.toFixed(2)));
        setSunset(Number(sunsetDecimal.toFixed(2)));
        setLoading(false);
      } catch (err) {
        console.error('Erreur API sunrise-sunset:', err);
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
        // Fallback sur calcul approximatif
        const sunriseCalc = 6 + (lat / 90) * 2;
        const sunsetCalc = 21 - (lat / 90) * 2;
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
          // Fallback sur calcul approximatif
          const sunriseCalc = 6 + (lat / 90) * 2;
          const sunsetCalc = 21 - (lat / 90) * 2;
          setSunrise(Number(sunriseCalc.toFixed(2)));
          setSunset(Number(sunsetCalc.toFixed(2)));
          setLoading(false);
        }
      },
      async () => {
        // Fallback si l'utilisateur refuse ou si une erreur survient
        const { lat, lon } = DEFAULT_COORDS;
        setLatitude(lat);
        setLongitude(lon);
        
        try {
          await fetchFromAPI(lat, lon);
          setError("Position indisponible (permission refusée). Utilisation de Paris par défaut.");
        } catch (err) {
          setError("Position et API indisponibles. Utilisation de valeurs approximatives.");
          // Fallback sur calcul approximatif
          const sunriseCalc = 6 + (lat / 90) * 2;
          const sunsetCalc = 21 - (lat / 90) * 2;
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
  };
}