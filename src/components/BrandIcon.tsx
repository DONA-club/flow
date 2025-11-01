"use client";

import React from "react";
import * as simpleIcons from "simple-icons";

type BrandName = "google" | "apple" | "facebook" | "amazon" | "microsoft";

const iconsAny = simpleIcons as any;

const ICONS: Record<BrandName, { path: string; hex: string; title: string }> = {
  google: iconsAny.siGoogle,
  apple: iconsAny.siApple,
  facebook: iconsAny.siFacebook,
  amazon: iconsAny.siAmazon,
  microsoft: iconsAny.siMicrosoft,
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