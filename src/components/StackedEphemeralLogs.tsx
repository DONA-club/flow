import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

type LogType = "info" | "success" | "error";

type Log = {
  id: number;
  message: string;
  type: LogType;
  fading?: boolean;
};

type Props = {
  logs: { message: string; type?: LogType }[];
  // Compat: si fourni, on l’interprète comme la durée du fade (ms).
  fadeOutDuration?: number;
};

export const StackedEphemeralLogs: React.FC<Props> = ({
  logs,
  fadeOutDuration, // si absent => 5000ms
}) => {
  const [displayed, setDisplayed] = useState<Log[]>([]);
  const idRef = useRef(0);

  // Map des timeouts par log
  const timersRef = useRef<
    Map<number, { fadeTimeout?: number; removeTimeout?: number }>
  >(new Map());

  // FLIP animation
  const nodeRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const prevPositions = useRef<Map<number, number>>(new Map());

  // Flux: empilement + remplacement du "..." par confirmation/erreur
  useEffect(() => {
    if (logs.length === 0) return;

    const last = logs[logs.length - 1];
    const incomingType: LogType = last.type || "info";
    const isEllipsis = last.message.includes("...");
    const lastDisplayed = displayed[displayed.length - 1];

    setDisplayed((prev) => {
      if (lastDisplayed && lastDisplayed.message.includes("...") && !isEllipsis) {
        // Remplacer en place (même position visuelle)
        const replaced = prev.map((l, idx) =>
          idx === prev.length - 1
            ? { ...l, message: last.message, type: incomingType, fading: false }
            : l
        );
        return replaced;
      }

      if (isEllipsis) {
        if (
          lastDisplayed &&
          lastDisplayed.message === last.message &&
          lastDisplayed.type === incomingType
        ) {
          return prev;
        }
        return [
          ...prev,
          {
            id: ++idRef.current,
            message: last.message,
            type: incomingType,
            fading: false,
          },
        ];
      }

      return [
        ...prev,
        {
          id: ++idRef.current,
          message: last.message,
          type: incomingType || "success",
          fading: false,
        },
      ];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs.map((l) => l.message + (l.type ?? "info")).join(",")]);

  // Durées: visible 10s, fade 5s (ou fadeOutDuration si fourni)
  const visibleMs = 10000;
  const fadeMs = fadeOutDuration ?? 5000;
  const totalMs = visibleMs + fadeMs;

  // Planification fade/suppression pour les messages non "..."
  useEffect(() => {
    displayed.forEach((log) => {
      const isEllipsis = log.message.includes("...");
      if (isEllipsis) return;

      const already = timersRef.current.get(log.id);
      if (already) return;

      const fadeTimeout = window.setTimeout(() => {
        setDisplayed((prev) =>
          prev.map((l) => (l.id === log.id ? { ...l, fading: true } : l))
        );
      }, visibleMs);

      const removeTimeout = window.setTimeout(() => {
        setDisplayed((prev) => prev.filter((l) => l.id !== log.id));
        timersRef.current.delete(log.id);
      }, totalMs);

      timersRef.current.set(log.id, { fadeTimeout, removeTimeout });
    });

    return () => {
      // pas de cleanup global pour éviter d’annuler des timers actifs sur re-render
    };
  }, [displayed, visibleMs, fadeMs, totalMs]);

  // Cleanup complet au démontage
  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => {
        if (t.fadeTimeout) window.clearTimeout(t.fadeTimeout);
        if (t.removeTimeout) window.clearTimeout(t.removeTimeout);
      });
      timersRef.current.clear();
    };
  }, []);

  // FLIP repositionnement
  useLayoutEffect(() => {
    const newPositions = new Map<number, number>();
    displayed.forEach((log) => {
      const el = nodeRefs.current.get(log.id);
      if (el) {
        const rect = el.getBoundingClientRect();
        newPositions.set(log.id, rect.top);
      }
    });

    newPositions.forEach((top, id) => {
      const prevTop = prevPositions.current.get(id);
      const el = nodeRefs.current.get(id);
      if (!el || prevTop == null) return;

      const dy = prevTop - top;
      if (dy !== 0) {
        el.style.transition = "none";
        el.style.transform = `translateY(${dy}px)`;
        void el.getBoundingClientRect();
        el.style.transition = "transform 220ms ease, opacity 300ms ease";
        el.style.transform = "translateY(0)";
      }
    });

    prevPositions.current = newPositions;
  }, [displayed]);

  const setNodeRef = (id: number) => (el: HTMLDivElement | null) => {
    if (el) nodeRefs.current.set(id, el);
    else nodeRefs.current.delete(id);
  };

  const baseTextClass =
    "text-sm leading-tight tracking-tight select-none transition-all";
  const typeClass = (_t: LogType) => "text-gray-300";

  return (
    <div
      className="fixed bottom-6 right-6 flex flex-col items-end gap-1 z-50"
      style={{ pointerEvents: "none", maxWidth: "90vw" }}
      aria-live="polite"
    >
      {displayed.map((log) => (
        <div
          key={log.id}
          ref={setNodeRef(log.id)}
          className={`${baseTextClass} ${typeClass(log.type)} ${
            log.fading ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"
          }`}
          style={{
            transition: `opacity ${log.fading ? fadeMs : 300}ms ease, transform ${log.fading ? fadeMs : 220}ms ease`,
            willChange: "transform, opacity",
          }}
        >
          {log.message}
        </div>
      ))}
    </div>
  );
};