"use client";

import React from "react";
import type { IconType } from "react-icons";
import {
  SiGoogle,
  SiApple,
  SiFacebook,
  SiAmazon,
  SiMicrosoft,
  SiMicrosoftoutlook,
} from "react-icons/si";

type BrandName = "google" | "apple" | "facebook" | "amazon" | "microsoft" | "outlook";

const ICONS: Record<BrandName, { Cmp: IconType; defaultColor: string }> = {
  google: { Cmp: SiGoogle, defaultColor: "#4285F4" },
  apple: { Cmp: SiApple, defaultColor: "#000000" },
  facebook: { Cmp: SiFacebook, defaultColor: "#1877F2" },
  amazon: { Cmp: SiAmazon, defaultColor: "#FF9900" },
  microsoft: { Cmp: SiMicrosoft, defaultColor: "#0078D4" },
  outlook: { Cmp: SiMicrosoftoutlook, defaultColor: "#0078D4" },
};

type Props = {
  name: BrandName;
  color?: string; // permet de forcer une couleur si nécessaire
  className?: string;
};

const BrandIcon: React.FC<Props> = ({ name, color, className }) => {
  const entry = ICONS[name];

  if (!entry) {
    return (
      <span
        className={[
          "w-full h-full flex items-center justify-center rounded-md bg-neutral-200 text-neutral-600",
          className || "",
        ]
          .join(" ")
          .trim()}
        role="img"
        aria-label={name}
      >
        <span className="text-[10px] font-semibold uppercase">{name[0]}</span>
      </span>
    );
  }

  const { Cmp, defaultColor } = entry;

  return (
    <Cmp
      className={["w-full h-full", className || ""].join(" ").trim()}
      color={color || defaultColor}
      size="100%"
      aria-label={name}
      role="img"
    />
  );
};

export default BrandIcon;