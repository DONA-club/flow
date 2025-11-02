"use client";

import React from "react";

type Props = {
  active: boolean;
  distanceRem?: number; // distance centre point -> centre logo, en rem
};

const SparkBurst: React.FC<Props> = ({ active, distanceRem = 4.75 }) => {
  if (!active) return null;

  // cône d’étincelles autour de 90° (vers le bas), angles ±20°
  const count = 9;
  const center = 90;
  const spread = 40;
  const startAngle = center - spread / 2;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      aria-hidden="true"
    >
      <div className="relative w-28 h-28">
        {Array.from({ length: count }).map((_, i) => {
          const angle = startAngle + (spread / (count - 1)) * i;
          return (
            <span
              key={i}
              className="spark"
              style={
                {
                  ["--angle" as any]: `${angle}deg`,
                  ["--dist" as any]: `${distanceRem}rem`,
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