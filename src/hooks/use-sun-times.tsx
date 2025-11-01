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

  const fetchSunTimes = useCallback(() => {
    setLoading(true);
    setError(null);

    // Fallback de localisation (Paris) si la géolocalisation est indisponible
    const DEFAULT_COORDS = { lat: 48.8566, lon: 2.3522 };

    if (!navigator.geolocation) {
      const { lat, lon } = DEFAULT_COORDS;
      setLatitude(lat);
      setLongitude(lon);

      const sunriseCalc = 6 + (lat / 90) * 2;
      const sunsetCalc = 21 - (lat / 90) * 2;
      setSunrise(Number(sunriseCalc.toFixed(2)));
      setSunset(Number(sunsetCalc.toFixed(2)));
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lon);

        const sunriseCalc = 6 + (lat / 90) * 2;
        const sunsetCalc = 21 - (lat / 90) * 2;
        setSunrise(Number(sunriseCalc.toFixed(2)));
        setSunset(Number(sunsetCalc.toFixed(2)));
        setLoading(false);
      },
      () => {
        // Fallback si l'utilisateur refuse ou si une erreur survient
        const { lat, lon } = DEFAULT_COORDS;
        setLatitude(lat);
        setLongitude(lon);

        const sunriseCalc = 6 + (lat / 90) * 2;
        const sunsetCalc = 21 - (lat / 90) * 2;
        setSunrise(Number(sunriseCalc.toFixed(2)));
        setSunset(Number(sunsetCalc.toFixed(2)));
        setError(null);
        setLoading(false);
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