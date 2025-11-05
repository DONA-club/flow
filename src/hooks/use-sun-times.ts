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
        
        const sunriseUTC = new Date(data.results.sunrise);
        const sunsetUTC = new Date(data.results.sunset);
        
        const sunriseDecimal = sunriseUTC.getHours() + sunriseUTC.getMinutes() / 60 + sunriseUTC.getSeconds() / 3600;
        const sunsetDecimal = sunsetUTC.getHours() + sunsetUTC.getMinutes() / 60 + sunsetUTC.getSeconds() / 3600;
        
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
          const sunriseCalc = 6 + (lat / 90) * 2;
          const sunsetCalc = 21 - (lat / 90) * 2;
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