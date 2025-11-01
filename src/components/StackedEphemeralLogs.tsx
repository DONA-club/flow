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
  fadeOutDuration?: number; // durée totale avant suppression (ms)
};

export const StackedEphemeralLogs: React.FC<Props> = ({
  logs,
  fadeOutDuration = 5000, // durée totale par défaut ~5s
}) => {
  const [displayed, setDisplayed] = useState<Log[]>([]);
  const idRef = useRef(0);

  // Remplace “...” par la confirmation/erreur; un seul “...” à la fois
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
      // Affiche le message “...” (remplace tout)
      setDisplayed([
        {
          id: ++idRef.current,
          message: lastLog.message,
          type: lastLog.type || "info",
          fading: false,
        },
      ]);
    } else {
      // Si un “...” est affiché, le remplace par la confirmation/erreur
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
  }, [logs.map((l) => l.message + (l.type ?? "info")).join(",")]);

  // Disparition douce pour confirmation/erreur (les “...” restent jusqu’à remplacement)
  useEffect(() => {
    if (displayed.length === 0) return;
    const last = displayed[displayed.length - 1];
    if (!last) return;

    const isEllipsis = last.message.includes("...");
    if (!isEllipsis && !last.fading) {
      // fractionne la durée totale: visible puis fade
      const total = Math.max(1500, fadeOutDuration);
      const fadeMs = Math.min(1500, Math.max(500, Math.floor(total * 0.3)));
      const visibleMs = total - fadeMs;

      const fadeTimeout = setTimeout(() => {
        setDisplayed((prev) =>
          prev.map((l) => (l.id === last.id ? { ...l, fading: true } : l))
        );
      }, visibleMs);

      const removeTimeout = setTimeout(() => {
        setDisplayed((prev) => prev.filter((l) => l.id !== last.id));
      }, total);

      return () => {
        clearTimeout(fadeTimeout);
        clearTimeout(removeTimeout);
      };
    }
  }, [displayed, fadeOutDuration]);

  const baseTextClass =
    "text-sm leading-tight tracking-tight select-none transition-all";
  const typeClass = (t: LogType) => {
    // Palette sobre: gris lisible pour tous les types
    // Vous pouvez nuancer si besoin: info => text-gray-300, success => text-gray-200, error => text-gray-200
    // Nous restons homogène et légèrement gris pour coller à la demande.
    return "text-gray-300";
  };

  // Durée de fade appliquée à la transition CSS (cohérente avec le calcul plus haut)
  const computedFadeMs = Math.min(1500, Math.max(500, Math.floor(Math.max(1500, fadeOutDuration) * 0.3)));

  return (
    <div
      className="fixed bottom-6 right-6 flex flex-col items-end gap-1 z-50"
      style={{ pointerEvents: "none", maxWidth: "90vw" }}
      aria-live="polite"
    >
      {displayed.map((log) => (
        <div
          key={log.id}
          className={`${baseTextClass} ${typeClass(log.type)} ${
            log.fading ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"
          }`}
          style={{
            transition: `opacity ${log.fading ? computedFadeMs : 300}ms ease, transform ${log.fading ? computedFadeMs : 300}ms ease`,
          }}
        >
          {log.message}
        </div>
      ))}
    </div>
  );
};