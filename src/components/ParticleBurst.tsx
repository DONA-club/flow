"use client";

import React from "react";

type Props = {
  fireKey: number;
  size?: number; // diamètre de la zone (en px) où le jet est centré
};

const ParticleBurst: React.FC<Props> = ({ fireKey, size = 88 }) => {
  const count = 12;
  const half = size / 2;

  // angles répartis uniformément
  const angles = Array.from({ length: count }, (_, i) => (i / count) * 360);
  // distances de dispersion
  const distances = angles.map((_, i) => 16 + ((i * 7) % 18)); // 16->34px pseudo-random

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  return (
    <div
      key={fireKey}
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
    >
      {/* keyframes internes au composant */}
      <style>
        {`
          @keyframes particle-burst {
            0%   { transform: translate(0,0) scale(0.9); opacity: 0.9; }
            60%  { opacity: 0.35; }
            100% { transform: translate(var(--tx), var(--ty)) scale(0.4); opacity: 0; }
          }
          @keyframes ring-ripple {
            0%   { transform: translate(-50%,-50%) scale(0.9); opacity: 0.35; }
            100% { transform: translate(-50%,-50%) scale(1.35); opacity: 0; }
          }
        `}
      </style>

      {/* Ondulation centrée */}
      <div
        className="absolute left-1/2 top-1/2 rounded-full border-2 border-white/40"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          animation: "ring-ripple 420ms ease-out forwards",
        }}
      />

      {/* Particules radiales */}
      {angles.map((deg, i) => {
        const r = toRad(deg);
        const dx = Math.cos(r) * distances[i];
        const dy = Math.sin(r) * distances[i];
        const style: React.CSSProperties & Record<string, string> = {
          width: "6px",
          height: "6px",
          boxShadow: "0 0 12px rgba(255,255,255,0.45)",
          "--tx": `${dx}px`,
          "--ty": `${dy}px`,
          animation: "particle-burst 420ms ease-out forwards",
        };
        return (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
            style={style}
          />
        );
      })}
    </div>
  );
};

export default ParticleBurst;