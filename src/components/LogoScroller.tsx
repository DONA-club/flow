"use client";

import React, { useEffect, useState } from "react";
import BrandIcon from "@/components/BrandIcon";

type ProviderName = "google" | "microsoft" | "apple" | "facebook" | "amazon";

type Props = {
  onActiveIndexChange?: (index: number, provider: ProviderName) => void;
};

const providers: ProviderName[] = ["google", "microsoft", "apple", "facebook", "amazon"];

const STEP_PX = 350;

const LogoScroller: React.FC<Props> = ({ onActiveIndexChange }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [showPrev, setShowPrev] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const idx = Math.max(0, Math.min(Math.floor(window.scrollY / STEP_PX), providers.length - 1));
      if (idx !== currentIndex) {
        setPrevIndex(currentIndex);
        setCurrentIndex(idx);
        setShowPrev(true);
        onActiveIndexChange?.(idx, providers[idx]);
        setTimeout(() => setShowPrev(false), 420);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [currentIndex, onActiveIndexChange]);

  const current = providers[currentIndex];
  const prev = prevIndex != null ? providers[prevIndex] : null;

  return (
    <div className="relative w-[3.4rem] h-[3.4rem]" aria-hidden="false">
      {showPrev && prev && (
        <div className="absolute inset-0 logo-exit">
          <BrandIcon name={prev} className="w-full h-full" />
        </div>
      )}
      <div key={current} className="absolute inset-0 logo-enter">
        <BrandIcon name={current} className="w-full h-full" />
      </div>
    </div>
  );
};

export default LogoScroller;