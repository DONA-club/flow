"use client";

import React from "react";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import AppleAuthButton from "@/components/AppleAuthButton";
import FacebookAuthButton from "@/components/FacebookAuthButton";
import AmazonAuthButton from "@/components/AmazonAuthButton";
import OutlookAuthButton from "@/components/OutlookAuthButton";

type Direction = "up" | "down";

type Props = {
  className?: string;
};

const TRANSITION_MS = 300;

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

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    const dir: Direction = e.deltaY > 0 ? "down" : "up";
    beginTransition(dir);
  };

  // Optional: arrow keys for accessibility
  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "ArrowDown" || e.key === "PageDown") {
      e.preventDefault();
      beginTransition("down");
    } else if (e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault();
      beginTransition("up");
    }
  };

  const containerClasses = [
    "relative overflow-hidden",
    "w-12 h-12", // zone uniforme
    className || "",
  ]
    .join(" ")
    .trim();

  const layerBase = "absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out filter";

  // Outgoing animation classes
  const outgoingClasses = [
    layerBase,
    phase === "end"
      ? direction === "down"
        ? "-translate-y-4 opacity-0 blur-lg saturate-0 contrast-75"
        : "translate-y-4 opacity-0 blur-lg saturate-0 contrast-75"
      : "translate-y-0 opacity-100 blur-0 saturate-100 contrast-100",
  ].join(" ");

  // Incoming animation classes
  const incomingClasses = [
    layerBase,
    phase === "start"
      ? direction === "down"
        ? "translate-y-4 opacity-0 blur-lg saturate-0 contrast-75"
        : "-translate-y-4 opacity-0 blur-lg saturate-0 contrast-75"
      : "translate-y-0 opacity-100 blur-0 saturate-100 contrast-100",
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
        </>
      ) : (
        <div className={layerBase + " translate-y-0 opacity-100"}>{providers[index]}</div>
      )}
    </div>
  );
};

export default AuthProviderScroller;