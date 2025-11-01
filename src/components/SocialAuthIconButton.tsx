"use client";

import React from "react";
import clsx from "clsx";

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  ariaLabel: string;
  title?: string;
};

const SocialAuthIconButton: React.FC<Props> = ({
  children,
  onClick,
  disabled = false,
  className,
  ariaLabel,
  title,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title || ariaLabel}
      className={clsx(
        "group inline-flex items-center justify-center",
        "w-12 h-12 p-1.5 rounded-xl",
        "appearance-none bg-transparent border-0 cursor-pointer select-none",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      <span className="w-full h-full filter blur-[1px] saturate-50 transition-all duration-200 group-hover:blur-0 group-hover:saturate-100">
        {/* Les enfants doivent occuper toute la surface pour des proportions homogènes */}
        <span className="block w-full h-full">
          {children}
        </span>
      </span>
    </button>
  );
};

export default SocialAuthIconButton;