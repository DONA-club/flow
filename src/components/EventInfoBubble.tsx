"use client";

import React from "react";
import { ExternalLink } from "lucide-react";

type Props = {
  title: string;
  organizer?: string;
  date?: string;
  timeRemaining?: string;
  url?: string;
  onClose?: () => void;
  diameter?: number;
};

const EventInfoBubble: React.FC<Props> = ({ 
  title, 
  organizer,
  date,
  timeRemaining,
  url,
  onClose, 
  diameter = 200 
}) => {
  const [visible, setVisible] = React.useState(true);

  const handleMouseLeave = () => {
    setVisible(false);
    window.setTimeout(() => {
      onClose && onClose();
    }, 300);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (url) {
      e.stopPropagation();
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={[
        "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
        "rounded-full z-30",
        "flex items-center justify-center text-center",
        "transition-opacity duration-300 select-none",
        visible ? "opacity-100" : "opacity-0",
        url ? "cursor-pointer" : "cursor-default",
      ].join(" ")}
      style={{ width: diameter, height: diameter }}
      role={url ? "button" : "dialog"}
      aria-live="polite"
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Liquid Glass Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-xl opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-full backdrop-blur-xl" />
      <div className="absolute inset-0 rounded-full border border-white/20 shadow-2xl" />
      
      {/* Contenu */}
      <div className="relative flex flex-col items-center justify-center px-6 py-4 w-full h-full">
        {/* Organisateur (discret en haut) */}
        {organizer && (
          <div className="text-xs text-white/60 mb-2 truncate w-full font-light">
            {organizer}
          </div>
        )}

        {/* Titre de l'événement */}
        <div className="text-white font-bold text-base leading-tight mb-3 line-clamp-2">
          {title}
        </div>

        {/* Date formatée */}
        {date && (
          <div className="text-white/80 text-sm mb-2 font-medium">
            {date}
          </div>
        )}

        {/* Temps restant */}
        {timeRemaining && (
          <div className="text-white/70 text-xs font-semibold mb-3">
            {timeRemaining}
          </div>
        )}

        {/* Icône de lien */}
        {url && (
          <div className="mt-auto">
            <div className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <ExternalLink className="w-4 h-4 text-white/80" />
            </div>
          </div>
        )}
      </div>

      {/* Effet de brillance animé */}
      <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
      </div>
    </div>
  );
};

export default EventInfoBubble;