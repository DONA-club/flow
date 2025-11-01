import React, { useEffect, useRef, useState } from "react";

type LogType = "info" | "success" | "error";

type Log = {
  id: number;
  message: string;
  type: LogType;
  fading?: boolean;
};

type Props = {
  logs: { message: string; type?: LogType }[];
  fadeOutDuration?: number; // ms
};

const COLORS: Record<LogType, { bg: string; text: string }> = {
  info:   { bg: "bg-gray-100/80", text: "text-gray-500" },
  success:{ bg: "bg-green-100/90", text: "text-green-700" },
  error:  { bg: "bg-red-100/90", text: "text-red-700" },
};

export const StackedEphemeralLogs: React.FC<Props> = ({
  logs,
  fadeOutDuration = 2000,
}) => {
  const [displayed, setDisplayed] = useState<Log[]>([]);
  const idRef = useRef(0);

  // Thread: un seul message "..." à la fois, remplacé par sa confirmation/erreur
  useEffect(() => {
    if (logs.length === 0) return;

    const lastLog = logs[logs.length - 1];
    const isLoading = lastLog.message.includes("...");
    const lastDisplayed = displayed[displayed.length - 1];

    if (isLoading) {
      // Si déjà affiché, ne rien faire
      if (
        lastDisplayed &&
        lastDisplayed.message === lastLog.message &&
        lastDisplayed.type === (lastLog.type || "info")
      ) {
        return;
      }
      // Affiche le message "..." (remplace tout)
      setDisplayed([
        {
          id: ++idRef.current,
          message: lastLog.message,
          type: lastLog.type || "info",
        },
      ]);
    } else {
      // Si un message "..." est affiché, le remplace par la confirmation/erreur
      if (
        lastDisplayed &&
        lastDisplayed.message.includes("...") &&
        !lastDisplayed.fading
      ) {
        setDisplayed([
          {
            id: lastDisplayed.id + 1,
            message: lastLog.message,
            type: lastLog.type || "success",
            fading: false,
          },
        ]);
      } else {
        // Sinon, ajoute normalement
        setDisplayed([
          {
            id: ++idRef.current,
            message: lastLog.message,
            type: lastLog.type || "success",
            fading: false,
          },
        ]);
      }
    }
    // eslint-disable-next-line
  }, [logs.map((l) => l.message + l.type).join(",")]);

  // Fade out pour confirmation/erreur
  useEffect(() => {
    if (displayed.length === 0) return;
    const last = displayed[displayed.length - 1];
    if (
      last &&
      !last.message.includes("...") &&
      !last.fading
    ) {
      // Lance le fade out après un court délai (pour laisser le temps de voir le message)
      const fadeTimeout = setTimeout(() => {
        setDisplayed((prev) =>
          prev.map((l) =>
            l.id === last.id ? { ...l, fading: true } : l
          )
        );
      }, 800); // délai avant fade (0.8s)
      // Supprime le message après le fade
      const removeTimeout = setTimeout(() => {
        setDisplayed((prev) => prev.filter((l) => l.id !== last.id));
      }, 800 + fadeOutDuration);
      return () => {
        clearTimeout(fadeTimeout);
        clearTimeout(removeTimeout);
      };
    }
  }, [displayed, fadeOutDuration]);

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
            ${log.fading ? "opacity-0" : "opacity-100"}
            ${COLORS[log.type].bg} ${COLORS[log.type].text}
            backdrop-blur
          `}
          style={{
            marginBottom: 2,
            maxWidth: 320,
            background: log.type === "info"
              ? "rgba(243,244,246,0.85)"
              : undefined,
            transition: `opacity ${log.fading ? fadeOutDuration : 500}ms`,
          }}
        >
          {log.message}
        </div>
      ))}
    </div>
  );
};