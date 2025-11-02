"use client";

import React from "react";

type Props = {
  active: boolean;
  // rayon max en rem (distance centre logo -> fin des particules)
  distanceRem?: number;
};

const SparkBurst: React.FC<Props> = ({ active, distanceRem = 1.25 }) => {
  if (!active) return null;

  const count = 13;
  const baseStep = 360 / count;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      aria-hidden="true"
    >
      <div className="relative w-full h-full">
        {Array.from({ length: count }).map((_, i) => {
          const angle = baseStep * i + (Math.random() * 16 - 8); // ±8° de jitter
          const dist = distanceRem * (0.6 + Math.random() * 0.6); // 60% à 120% du rayon
          const delay = Math.random() * 120; // 0–120ms
          const dur = 500 + Math.random() * 240; // 500–740ms
          const size = 4 + Math.random() * 3; // 4–7px
          return (
            <span
              key={i}
              className="spark"
              style={
                {
                  ["--angle" as any]: `${angle}deg`,
                  ["--dist" as any]: `${dist}rem`,
                  ["--delay" as any]: `${Math.round(delay)}ms`,
                  ["--dur" as any]: `${Math.round(dur)}ms`,
                  ["--size" as any]: `${size}px`,
                } as React.CSSProperties
              }
            />
          );
        })}
      </div>
    </div>
  );
};

export default SparkBurst;