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
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const innerWrapperClass = clsx(
    "w-full h-full transition-all duration-200",
    isMobile
      ? "filter-none"
      : "filter blur-[1px] saturate-50 group-hover:blur-0 group-hover:saturate-100"
  );

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
      <span className={innerWrapperClass}>
        {/* Les enfants doivent occuper toute la surface pour des proportions homogènes */}
        <span className="block w-full h-full">{children}</span>
      </span>
    </button>
  );
};

export default SocialAuthIconButton;