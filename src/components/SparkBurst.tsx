"use client";

import React from "react";

type Props = {
  active: boolean;
};

const SparkBurst: React.FC<Props> = ({ active }) => {
  if (!active) return null;

  const sparks = Array.from({ length: 12 });

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      aria-hidden="true"
    >
      <div className="relative w-28 h-28">
        {sparks.map((_, i) => (
          <span
            key={i}
            className="spark"
            style={{ ["--angle" as any]: `${(360 / sparks.length) * i}deg` }}
          />
        ))}
      </div>
    </div>
  );
};

export default SparkBurst;