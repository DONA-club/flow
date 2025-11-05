import React from "react";
import { Sunrise, Sunset } from "lucide-react";
import EventInfoBubble from "@/components/EventInfoBubble";

type Event = {
  title: string;
  place: string;
  start: number;
  end: number;
  url?: string;
  raw?: any;
};

type Props = {
  sunrise: number;
  sunset: number;
  events: Event[];
  season?: "spring" | "summer" | "autumn" | "winter";
  onEventClick?: (event: Event) => void;
  size?: number;
  wakeHour?: number | null;
  bedHour?: number | null;
  totalSleepHours?: number | null;
  sleepSessions?: Array<{ bedHour: number; wakeHour: number }> | null;
  externalSelectedEvent?: Event | null;
  onEventBubbleClosed?: () => void;
  onDayChange?: (date: Date) => void;
  onVirtualDateTimeChange?: (date: Date | null) => void;
};

// Ce composant sera implémenté avec des interactions tactiles optimisées pour mobile
// Pour l'instant, on utilise le composant desktop
export const CircularCalendarMobile: React.FC<Props> = (props) => {
  // TODO: Implémenter la version mobile avec:
  // - Taille de roue adaptée (plus grande)
  // - Textes plus grands et lisibles
  // - Interactions tactiles (swipe vertical pour heures, horizontal pour jours)
  // - Bubble d'info adaptée à la taille d'écran
  
  return null;
};