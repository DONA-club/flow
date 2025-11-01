"use client";

import React from "react";

type Props = {
  title: string;
  place?: string;
  time?: string;
  onClose?: () => void;
  // optionnel: permettre d'ajuster le diamètre si nécessaire
  diameter?: number;
};

const EventInfoBubble: React.FC<Props> = ({ title, place, time, onClose, diameter = 160 }) => {
  const [visible, setVisible] = React.useState(true);

  const handleMouseLeave = () => {
    setVisible(false);
    window.setTimeout(() => {
      onClose && onClose();
    }, 2000); // fade out en 2s, puis fermeture
  };

  return (
    <div
      className={[
        "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
        "rounded-full bg-gray-900/90 shadow-lg z-30",
        "flex items-center justify-center text-center",
        "transition-opacity duration-[2000ms] select-none",
        visible ? "opacity-100" : "opacity-0",
      ].join(" ")}
      style={{ width: diameter, height: diameter }}
      role="dialog"
      aria-live="polite"
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col items-center justify-center px-4">
        <span className="text-sm font-semibold text-white">{title}</span>
        {place && <span className="text-xs text-white/80 mt-1">{place}</span>}
        {time && <span className="text-xs text-white/70 mt-0.5">{time}</span>}
      </div>
    </div>
  );
};

export default EventInfoBubble;