import React, { useEffect, useRef, useState } from "react";

type LogType = "info" | "success" | "error";

type Log = {
  id: number;
  message: string;
  type: LogType;
};

type Props = {
  logs: { message: string; type?: LogType }[];
  duration?: number; // ms
};

const COLORS: Record<LogType, { bg: string; text: string }> = {
  info:   { bg: "bg-gray-100/80", text: "text-gray-500" },
  success:{ bg: "bg-green-100/90", text: "text-green-700" },
  error:  { bg: "bg-red-100/90", text: "text-red-700" },
};

export const StackedEphemeralLogs: React.FC<Props> = ({
  logs,
  duration = 3500,
}) => {
  const [displayed, setDisplayed] = useState<Log[]>([]);
  const idRef = useRef(0);

  // Ajoute les nouveaux logs à la pile
  useEffect(() => {
    logs.forEach((log) => {
      if (
        !displayed.some(
          (d) => d.message === log.message && d.type === (log.type || "info")
        )
      ) {
        setDisplayed((prev) => [
          ...prev,
          {
            id: ++idRef.current,
            message: log.message,
            type: log.type || "info",
          },
        ]);
      }
    });
    // eslint-disable-next-line
  }, [logs.map((l) => l.message + l.type).join(",")]);

  // Supprime chaque log après duration ms
  useEffect(() => {
    if (displayed.length === 0) return;
    const timers = displayed.map((log) =>
      setTimeout(() => {
        setDisplayed((prev) => prev.filter((l) => l.id !== log.id));
      }, duration)
    );
    return () => timers.forEach(clearTimeout);
  }, [displayed, duration]);

  return (
    <div
      className="fixed bottom-6 right-6 flex flex-col items-end gap-2 z-50"
      style={{ pointerEvents: "none", minWidth: 220, maxWidth: "90vw" }}
      aria-live="polite"
    >
      {displayed.map((log) => (
        <div
          key={log.id}
          className={`
            px-4 py-2 rounded-lg shadow
            text-sm font-medium
            transition-all duration-500
            opacity-100
            ${COLORS[log.type].bg} ${COLORS[log.type].text}
            backdrop-blur
          `}
          style={{
            marginBottom: 2,
            maxWidth: 320,
            background: log.type === "info"
              ? "rgba(243,244,246,0.85)" // gris très clair
              : undefined,
          }}
        >
          {log.message}
        </div>
      ))}
    </div>
  );
};