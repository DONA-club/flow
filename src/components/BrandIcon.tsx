"use client";

import React from "react";
import * as SI from "simple-icons/icons";

type BrandName = "google" | "apple" | "facebook" | "amazon" | "microsoft" | "outlook";

const KEY_MAP: Record<BrandName, string[]> = {
  google: ["siGoogle"],
  apple: ["siApple"],
  facebook: ["siFacebook"],
  amazon: ["siAmazon"],
  microsoft: ["siMicrosoft"],
  // Microsoft Outlook: on tente plusieurs variantes pour assurer la compatibilité
  outlook: ["siMicrosoftoutlook", "siMicrosoftOutlook", "siOutlook"],
};

type Props = {
  name: BrandName;
  color?: string; // option pour forcer une couleur uniforme si nécessaire
  className?: string;
};

const BrandIcon: React.FC<Props> = ({ name, color, className }) => {
  const icon =
    KEY_MAP[name]
      .map((key) => (SI as any)[key])
      .find(Boolean) as { path: string; hex: string; title: string } | undefined;
  if (!icon) {
    return (
      <span
        className={["w-full h-full flex items-center justify-center rounded-md bg-neutral-200 text-neutral-600", className || ""].join(" ").trim()}
        role="img"
        aria-label={name}
      >
        <span className="text-[10px] font-semibold uppercase">{name[0]}</span>
      </span>
    );
  }

  return (
    <svg
      className={["w-full h-full", className || ""].join(" ").trim()}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={icon.title || name}
      preserveAspectRatio="xMidYMid meet"
    >
      <path d={icon.path} fill={color || `#${icon.hex}`} />
    </svg>
  );
};

export default BrandIcon;