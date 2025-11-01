import React, { useEffect, useState } from "react";

type EphemeralLogProps = {
  message: string | null;
  type?: "info" | "error";
  duration?: number; // ms
};

export const EphemeralLog: React.FC<EphemeralLogProps> = ({
  message,
  type = "info",
  duration = 3500,
}) => {
  const [visible, setVisible] = useState(!!message);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), duration);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [message, duration]);

  if (!visible || !message) return null;

  return (
    <div
      className={`
        fixed bottom-6 left-1/2 transform -translate-x-1/2
        px-4 py-2 rounded-lg shadow-lg
        text-white text-sm font-medium
        transition-opacity duration-300
        z-50
        ${type === "error" ? "bg-red-500" : "bg-gray-900"}
        pointer-events-none
      `}
      style={{ minWidth: 180, maxWidth: "90vw", textAlign: "center" }}
      aria-live="polite"
    >
      {message}
    </div>
  );
};