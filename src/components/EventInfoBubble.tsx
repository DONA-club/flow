"use client";

import React from "react";
import { ExternalLink, Video } from "lucide-react";

type Props = {
  title: string;
  organizer?: string;
  date?: string;
  timeRemaining?: string;
  url?: string;
  videoLink?: string;
  onClose?: () => void;
  diameter?: number;
};

function detectPlatform(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes("teams.microsoft.com")) return "Teams";
  if (lower.includes("zoom.us")) return "Zoom";
  if (lower.includes("meet.google.com")) return "Google Meet";
  if (lower.includes("hangouts.google.com")) return "Hangouts";
  if (lower.includes("webex.com")) return "Webex";
  if (lower.includes("gotomeeting.com")) return "GoToMeeting";
  if (lower.includes("whereby.com")) return "Whereby";
  if (lower.includes("jitsi")) return "Jitsi";
  return "Vidéoconférence";
}

const EventInfoBubble: React.FC<Props> = ({ 
  title, 
  organizer,
  date,
  timeRemaining,
  url,
  videoLink,
  onClose, 
  diameter = 200 
}) => {
  const [visible, setVisible] = React.useState(true);
  const [isInteracting, setIsInteracting] = React.useState(false);
  const timeoutRef = React.useRef<number | null>(null);

  // Fonction pour démarrer le timer d'estompe
  const startFadeTimer = React.useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = window.setTimeout(() => {
      if (!isInteracting) {
        setVisible(false);
        window.setTimeout(() => {
          onClose && onClose();
        }, 300);
      }
    }, 5000);
  }, [isInteracting, onClose]);

  // Démarrer le timer au montage
  React.useEffect(() => {
    startFadeTimer();
    
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [startFadeTimer]);

  // Réinitialiser le timer quand l'interaction change
  React.useEffect(() => {
    if (!isInteracting) {
      startFadeTimer();
    } else {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    }
  }, [isInteracting, startFadeTimer]);

  const handleMouseEnter = () => {
    setIsInteracting(true);
  };

  const handleMouseLeave = () => {
    setIsInteracting(false);
  };

  const handleBubbleClick = (e: React.MouseEvent) => {
    // Ne fermer que si on clique sur le fond de la bulle, pas sur les boutons
    if (e.target === e.currentTarget) {
      setVisible(false);
      window.setTimeout(() => {
        onClose && onClose();
      }, 300);
    }
  };

  const handleCalendarClick = (e: React.MouseEvent) => {
    if (url) {
      e.stopPropagation();
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    if (videoLink) {
      e.stopPropagation();
      window.open(videoLink, '_blank', 'noopener,noreferrer');
    }
  };

  const platform = videoLink ? detectPlatform(videoLink) : "";

  return (
    <div
      className={[
        "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
        "rounded-full z-30",
        "flex items-center justify-center text-center",
        "transition-opacity duration-300 select-none cursor-pointer",
        visible ? "opacity-100" : "opacity-0",
      ].join(" ")}
      style={{ width: diameter, height: diameter, pointerEvents: "auto" }}
      role="dialog"
      aria-live="polite"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleBubbleClick}
    >
      {/* Liquid Glass Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-xl opacity-60 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-full backdrop-blur-xl pointer-events-none" />
      <div className="absolute inset-0 rounded-full border border-white/20 shadow-2xl pointer-events-none" />
      
      {/* Contenu - Centré verticalement */}
      <div className="relative flex flex-col items-center justify-center px-6 w-full h-full gap-2 pointer-events-none">
        {/* Organisateur (discret en haut) */}
        {organizer && (
          <div className="text-xs text-white/60 truncate w-full font-light pointer-events-none">
            {organizer}
          </div>
        )}

        {/* Titre de l'événement */}
        <div className="text-white font-bold text-base leading-tight line-clamp-2 pointer-events-none">
          {title}
        </div>

        {/* Date formatée */}
        {date && (
          <div className="text-white/80 text-sm font-medium pointer-events-none">
            {date}
          </div>
        )}

        {/* Temps restant */}
        {timeRemaining && (
          <div className="text-white/70 text-xs font-semibold pointer-events-none">
            {timeRemaining}
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex items-center gap-3 mt-2 pointer-events-auto">
          {/* Bouton vidéoconférence */}
          {videoLink && (
            <button
              onClick={handleVideoClick}
              className="group/video flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 cursor-pointer"
              aria-label={`Rejoindre ${platform}`}
            >
              <div className="relative pointer-events-none">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-md group-hover/video:blur-lg transition-all duration-300 pointer-events-none" />
                <div className="relative bg-white/90 p-1.5 rounded-full group-hover/video:scale-110 transition-transform duration-300 pointer-events-none">
                  <Video className="w-4 h-4 text-blue-600 pointer-events-none" strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex flex-col items-start pointer-events-none">
                <span className="text-white text-xs font-semibold pointer-events-none">Rejoindre</span>
                <span className="text-white/60 text-[10px] font-light pointer-events-none">{platform}</span>
              </div>
            </button>
          )}

          {/* Icône calendrier */}
          {url && (
            <button
              onClick={handleCalendarClick}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Ouvrir dans le calendrier"
            >
              <ExternalLink className="w-4 h-4 text-white/80 pointer-events-none" />
            </button>
          )}
        </div>
      </div>

      {/* Effet de brillance animé */}
      <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
      </div>
    </div>
  );
};

export default EventInfoBubble;