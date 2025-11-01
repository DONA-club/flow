"use client";

import React from "react";
import { Icon } from "@iconify/react";
import googleIcon from "@iconify/icons-simple-icons/google";
import appleIcon from "@iconify/icons-simple-icons/apple";
import facebookIcon from "@iconify/icons-simple-icons/facebook";
import amazonIcon from "@iconify/icons-simple-icons/amazon";
import microsoftIcon from "@iconify/icons-simple-icons/microsoft";
import outlookIcon from "@iconify/icons-simple-icons/microsoftoutlook";

type BrandName = "google" | "apple" | "facebook" | "amazon" | "microsoft" | "outlook";

const ICONS: Record<BrandName, { icon: unknown; defaultColor: string }> = {
  google: { icon: googleIcon, defaultColor: "#4285F4" },
  apple: { icon: appleIcon, defaultColor: "#000000" },
  facebook: { icon: facebookIcon, defaultColor: "#1877F2" },
  amazon: { icon: amazonIcon, defaultColor: "#FF9900" },
  microsoft: { icon: microsoftIcon, defaultColor: "#0078D4" },
  outlook: { icon: outlookIcon, defaultColor: "#0078D4" },
};

type Props = {
  name: BrandName;
  color?: string;
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
        ].join(" ").trim()}
        role="img"
        aria-label={name}
      >
        <span className="text-[10px] font-semibold uppercase">{name[0]}</span>
      </span>
    );
  }

  return (
    <Icon
      icon={entry.icon}
      color={color || entry.defaultColor}
      width="100%"
      height="100%"
      className={["w-full h-full", className || ""].join(" ").trim()}
      aria-label={name}
      role="img"
    />
  );
};

export default BrandIcon;