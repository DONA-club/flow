"use client";

import React from "react";
import { siGoogle, siApple, siFacebook, siAmazon, siMicrosoft } from "simple-icons";

type BrandName = "google" | "apple" | "facebook" | "amazon" | "microsoft";

const ICONS: Record<BrandName, { path: string; hex: string; title: string }> = {
  google: siGoogle,
  apple: siApple,
  facebook: siFacebook,
  amazon: siAmazon,
  microsoft: siMicrosoft,
};

type Props = {
  name: BrandName;
  color?: string; // option pour forcer une couleur uniforme si nécessaire
  className?: string;
};

const BrandIcon: React.FC<Props> = ({ name, color, className }) => {
  const icon = ICONS[name];

  return (
    <svg
      className={["w-full h-full", className || ""].join(" ").trim()}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={icon.title}
      preserveAspectRatio="xMidYMid meet"
    >
      <path d={icon.path} fill={color || `#${icon.hex}`} />
    </svg>
  );
};

export default BrandIcon;