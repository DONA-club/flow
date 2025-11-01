"use client";

import React from "react";

type Props = {
  title: string;
  place?: string;
  time?: string;
  onClose?: () => void;
};

const EventInfoBubble: React.FC<Props> = ({ title, place, time, onClose }) => {
  const [visible, setVisible] = React.useState(true);

  const handleMouseLeave = () => {
    setVisible(false);
    window.setTimeout(() => {
      onClose && onClose();
    }, 400); // dissout lentement, puis ferme
  };

  return (
    <div
      className={[
        "absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[60%]",
        "rounded-full bg-white shadow-lg border border-gray-200",
        "px-4 py-3 flex items-center gap-3",
        "transition-opacity duration-400",
        visible ? "opacity-100" : "opacity-0",
      ].join(" ")}
      role="dialog"
      aria-live="polite"
      onMouseLeave={handleMouseLeave}
    >
      <div className="w-2 h-2 rounded-full bg-blue-600 shadow-sm" />
      <div className="flex flex-col text-center">
        <span className="text-sm font-semibold text-gray-900">{title}</span>
        {place && <span className="text-xs text-gray-600">{place}</span>}
        {time && <span className="text-xs text-gray-500">{time}</span>}
      </div>
    </div>
  );
};

export default EventInfoBubble;