"use client";

import React, { useCallback, useRef, useState } from "react";
import ProviderBadge from "@/components/ProviderBadge";
import { useMultiProviderAuth } from "@/hooks/use-multi-provider-auth";

type ProviderName = "google" | "microsoft" | "apple" | "facebook" | "amazon";

type Props = {
  onActiveIndexChange?: (index: number, provider: ProviderName) => void;
};

const providers: ProviderName[] = ["google", "microsoft", "apple", "facebook", "amazon"];

const LogoScroller: React.FC<Props> = ({ onActiveIndexChange }) => {
  const { user, connectedProviders } = useMultiProviderAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [showPrev, setShowPrev] = useState(false);
  const [lock, setLock] = useState(false);
  const touchStartY = useRef<number | null>(null);

  const goToIndex = useCallback(
    (idx: number) => {
      const safeIdx = Math.max(0, Math.min(idx, providers.length - 1));
      if (safeIdx === currentIndex) return;
      setPrevIndex(currentIndex);
      setCurrentIndex(safeIdx);
      setShowPrev(true);
      onActiveIndexChange?.(safeIdx, providers[safeIdx]);
      // cacher l'ancien après l’animation
      setTimeout(() => setShowPrev(false), 420);
    },
    [currentIndex, onActiveIndexChange]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (lock) return;
      const dir = e.deltaY > 0 ? 1 : -1;
      const next = currentIndex + dir;
      setLock(true);
      goToIndex(next);
      setTimeout(() => setLock(false), 500);
    },
    [currentIndex, goToIndex, lock]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (lock) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        setLock(true);
        goToIndex(currentIndex + 1);
        setTimeout(() => setLock(false), 500);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        setLock(true);
        goToIndex(currentIndex - 1);
        setTimeout(() => setLock(false), 500);
      }
    },
    [currentIndex, goToIndex, lock]
  );

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (lock) return;
      const start = touchStartY.current;
      const end = e.changedTouches[0].clientY;
      if (start == null) return;
      const delta = end - start;
      if (Math.abs(delta) < 20) return;
      setLock(true);
      if (delta < 0) {
        goToIndex(currentIndex + 1);
      } else {
        goToIndex(currentIndex - 1);
      }
      setTimeout(() => setLock(false), 500);
      touchStartY.current = null;
    },
    [currentIndex, goToIndex, lock]
  );

  const current = providers[currentIndex];
  const prev = prevIndex != null ? providers[prevIndex] : null;

  return (
    <div
      className="relative w-[1.7rem] h-[1.7rem] group pointer-events-auto select-none"
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="button"
      aria-label="Dérouler les logos de providers"
      tabIndex={0}
    >
      {showPrev && prev && (
        <div className="absolute inset-0 logo-exit">
          <ProviderBadge
            provider={prev}
            user={user}
            connectedProviders={connectedProviders as any}
            className="w-full h-full"
          />
        </div>
      )}
      <div key={current} className="absolute inset-0 logo-enter">
        <ProviderBadge
          provider={current}
          user={user}
          connectedProviders={connectedProviders as any}
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

export default LogoScroller;