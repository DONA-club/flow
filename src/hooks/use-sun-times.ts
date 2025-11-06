import { useCallback, useEffect, useState } from "react";

export type SunTimes = {
  sunrise: number | null;
  sunset: number | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  latitude: number | null;
  longitude: number | null;
  timezoneOffset: number;
};

function getLocalTimezoneOffset(): number {
  const now = new Date();
  const offsetMinutes = now.getTimezoneOffset();
  return -offsetMinutes / 60;
}

function formatHour(decimal: number): string {
  const h = Math.floor(decimal);
  const m = Math.round((decimal % 1) * 60);
  return `${h}h${m.toString().padStart(2, '0')}`;
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
        
        const sunriseUTC = new Date(data.results.sunrise);
        const sunsetUTC = new Date(data.results.sunset);
        
        const sunriseLocal = new Date(sunriseUTC.toLocaleString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }));
        const sunsetLocal = new Date(sunsetUTC.toLocaleString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }));
        
        const sunriseDecimal = sunriseLocal.getHours() + sunriseLocal.getMinutes() / 60 + sunriseLocal.getSeconds() / 3600;
        const sunsetDecimal = sunsetLocal.getHours() + sunsetLocal.getMinutes() / 60 + sunsetLocal.getSeconds() / 3600;
        
        setSunrise(Number(sunriseDecimal.toFixed(2)));
        setSunset(Number(sunsetDecimal.toFixed(2)));
        setLoading(false);
        
        return { sunrise: sunriseDecimal, sunset: sunsetDecimal };
      } catch (err) {
        throw err;
      }
    };

    if (!navigator.geolocation) {
      const { lat, lon } = DEFAULT_COORDS;
      setLatitude(lat);
      setLongitude(lon);
      
      try {
        const times = await fetchFromAPI(lat, lon);
        window.dispatchEvent(new CustomEvent("app-log", { 
          detail: { message: `Localisation ${lat.toFixed(2)}°, ${lon.toFixed(2)}° | ☼ ${formatHour(times.sunrise)} ☀ ${formatHour(times.sunset)}`, type: "info" } 
        }));
      } catch (err) {
        const sunriseCalc = 6 + (lat / 90) * 2 + currentOffset;
        const sunsetCalc = 21 - (lat / 90) * 2 + currentOffset;
        setSunrise(Number(sunriseCalc.toFixed(2)));
        setSunset(Number(sunsetCalc.toFixed(2)));
        setLoading(false);
        window.dispatchEvent(new CustomEvent("app-log", { 
          detail: { message: `Localisation ${lat.toFixed(2)}°, ${lon.toFixed(2)}° | ☼ ${formatHour(sunriseCalc)} ☀ ${formatHour(sunsetCalc)}`, type: "info" } 
        }));
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
          const times = await fetchFromAPI(lat, lon);
          window.dispatchEvent(new CustomEvent("app-log", { 
            detail: { message: `Localisation ${lat.toFixed(2)}°, ${lon.toFixed(2)}° | ☼ ${formatHour(times.sunrise)} ☀ ${formatHour(times.sunset)}`, type: "success" } 
          }));
        } catch (err) {
          const sunriseCalc = 6 + (lat / 90) * 2 + currentOffset;
          const sunsetCalc = 21 - (lat / 90) * 2 + currentOffset;
          setSunrise(Number(sunriseCalc.toFixed(2)));
          setSunset(Number(sunsetCalc.toFixed(2)));
          setLoading(false);
          window.dispatchEvent(new CustomEvent("app-log", { 
            detail: { message: `Localisation ${lat.toFixed(2)}°, ${lon.toFixed(2)}° | ☼ ${formatHour(sunriseCalc)} ☀ ${formatHour(sunsetCalc)}`, type: "success" } 
          }));
        }
      },
      async (err) => {
        const { lat, lon } = DEFAULT_COORDS;
        setLatitude(lat);
        setLongitude(lon);
        
        try {
          const times = await fetchFromAPI(lat, lon);
          window.dispatchEvent(new CustomEvent("app-log", { 
            detail: { message: `Localisation ${lat.toFixed(2)}°, ${lon.toFixed(2)}° | ☼ ${formatHour(times.sunrise)} ☀ ${formatHour(times.sunset)}`, type: "info" } 
          }));
        } catch (apiErr) {
          const sunriseCalc = 6 + (lat / 90) * 2 + currentOffset;
          const sunsetCalc = 21 - (lat / 90) * 2 + currentOffset;
          setSunrise(Number(sunriseCalc.toFixed(2)));
          setSunset(Number(sunsetCalc.toFixed(2)));
          setLoading(false);
          window.dispatchEvent(new CustomEvent("app-log", { 
            detail: { message: `Localisation ${lat.toFixed(2)}°, ${lon.toFixed(2)}° | ☼ ${formatHour(sunriseCalc)} ☀ ${formatHour(sunsetCalc)}`, type: "info" } 
          }));
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 600000,
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