import { useEffect, useState, useCallback } from "react";

type SunTimes = {
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSunTimes = useCallback(() => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par ce navigateur.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lon);

        // Calcul simple du lever/coucher du soleil (exemple, à remplacer par une vraie API si besoin)
        // Ici, lever = 6h + (lat/90)*2, coucher = 21h - (lat/90)*2 (juste pour la démo)
        const sunriseCalc = 6 + (lat / 90) * 2;
        const sunsetCalc = 21 - (lat / 90) * 2;
        setSunrise(Number(sunriseCalc.toFixed(2)));
        setSunset(Number(sunsetCalc.toFixed(2)));
        setLoading(false);
      },
      (err) => {
        setError("Impossible d'obtenir la localisation.");
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