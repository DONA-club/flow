"use client";

import React from "react";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import AppleAuthButton from "@/components/AppleAuthButton";
import FacebookAuthButton from "@/components/FacebookAuthButton";
import AmazonAuthButton from "@/components/AmazonAuthButton";
import OutlookAuthButton from "@/components/OutlookAuthButton";
import ParticleBurst from "@/components/ParticleBurst";

type Direction = "up" | "down";

type Props = {
  className?: string;
};

const TRANSITION_MS = 420;

const AuthProviderScroller: React.FC<Props> = ({ className }) => {
  const providers = React.useMemo(
    () => [
      <GoogleAuthButton key="google" />,
      <AppleAuthButton key="apple" />,
      <FacebookAuthButton key="facebook" />,
      <AmazonAuthButton key="amazon" />,
      <OutlookAuthButton key="outlook" />,
    ],
    []
  );

  const [index, setIndex] = React.useState(0);
  const [transitioning, setTransitioning] = React.useState(false);
  const [direction, setDirection] = React.useState<Direction>("down");
  const [outgoingIdx, setOutgoingIdx] = React.useState<number>(0);
  const [incomingIdx, setIncomingIdx] = React.useState<number>(0);
  const [phase, setPhase] = React.useState<"idle" | "start" | "end">("idle");

  const nextIndex = (dir: Direction) => {
    const len = providers.length;
    if (dir === "down") {
      return (index + 1) % len;
    }
    return (index - 1 + len) % len;
  };

  const beginTransition = (dir: Direction) => {
    if (transitioning) return;
    setTransitioning(true);
    setDirection(dir);
    const target = nextIndex(dir);
    setOutgoingIdx(index);
    setIncomingIdx(target);
    setPhase("start");

    // Déclenche un jet de particules autour du point blanc
    window.dispatchEvent(new CustomEvent("brand-scroll", { detail: { direction: dir } }));

    // Trigger the CSS transition on next frame
    requestAnimationFrame(() => {
      setPhase("end");
    });

    // Complete transition
    window.setTimeout(() => {
      setIndex(target);
      setPhase("idle");
      setTransitioning(false);
    }, TRANSITION_MS);
  };

  // Scroll local (sur le composant) — on ne bloque plus le scroll de la page
  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    // Seuil pour éviter les micro-déclenchements
    if (Math.abs(e.deltaY) < 6) return;
    const dir: Direction = e.deltaY > 0 ? "down" : "up";
    beginTransition(dir);
  };

  // Accessibilité locale via flèches
  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "ArrowDown" || e.key === "PageDown") {
      e.preventDefault();
      beginTransition("down");
    } else if (e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault();
      beginTransition("up");
    }
  };

  // Écouteurs globaux pour scroll et flèches partout sur la page
  React.useEffect(() => {
    const handleGlobalWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 6) return;
      const dir: Direction = e.deltaY > 0 ? "down" : "up";
      beginTransition(dir);
    };

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        beginTransition("down");
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        beginTransition("up");
      }
    };

    window.addEventListener("wheel", handleGlobalWheel, { passive: true });
    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      window.removeEventListener("wheel", handleGlobalWheel as EventListener);
      window.removeEventListener("keydown", handleGlobalKeyDown as EventListener);
    };
  }, [beginTransition]);

  const containerClasses = [
    "relative overflow-hidden",
    "w-12 h-12", // zone uniforme
    className || "",
  ]
    .join(" ")
    .trim();

  const layerBase =
    "absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] filter will-change-transform transform-gpu";

  // Outgoing animation classes
  const outgoingClasses = [
    layerBase,
    phase === "end"
      ? "scale-[0.97] opacity-0 blur-sm saturate-0 contrast-75"
      : "scale-100 opacity-100 blur-0 saturate-100 contrast-100",
  ].join(" ");

  // Incoming animation classes
  const incomingClasses = [
    layerBase,
    phase === "start"
      ? "scale-[1.03] opacity-0 blur-sm saturate-0 contrast-75"
      : "scale-100 opacity-100 blur-0 saturate-100 contrast-100",
  ].join(" ");

  return (
    <div
      className={containerClasses}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      role="group"
      aria-label="Sélecteur de fournisseur d'authentification"
      tabIndex={0}
    >
      {transitioning ? (
        <>
          <div className={outgoingClasses}>{providers[outgoingIdx]}</div>
          <div className={incomingClasses}>{providers[incomingIdx]}</div>
          {/* effet visuel stabilisateur */}
          <ParticleBurst fireKey={outgoingIdx * 1000 + incomingIdx} size={88} />
        </>
      ) : (
        <div className={layerBase + " translate-y-0 scale-100 opacity-100"}>{providers[index]}</div>
      )}
    </div>
  );
};

export default AuthProviderScroller;