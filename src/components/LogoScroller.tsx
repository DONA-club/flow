"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import ProviderBadge from "@/components/ProviderBadge";
import { useMultiProviderAuth, type Provider } from "@/hooks/use-multi-provider-auth";

type Props = {
  onActiveIndexChange?: (index: number, provider: Provider) => void;
};

const providers: Provider[] = ["google", "microsoft", "apple", "facebook", "amazon"];

const LogoScroller: React.FC<Props> = ({ onActiveIndexChange }) => {
  const { user, connectedProviders, connectProvider } = useMultiProviderAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [showPrev, setShowPrev] = useState(false);
  const [lock, setLock] = useState(false);
  const touchStartY = useRef<number | null>(null);

  const goToIndex = useCallback(
    (idx: number) => {
      const max = providers.length - 1;
      const safeIdx = Math.max(0, Math.min(idx, max));
      if (safeIdx === currentIndex) return;
      setPrevIndex(currentIndex);
      setCurrentIndex(safeIdx);
      setShowPrev(true);
      onActiveIndexChange?.(safeIdx, providers[safeIdx]);
      setTimeout(() => setShowPrev(false), 420);
    },
    [currentIndex, onActiveIndexChange]
  );

  const handleWindowWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      if (lock) return;
      const dir = e.deltaY > 0 ? 1 : -1;
      const next = currentIndex + dir;
      // Bloquer aux extrémités pour éviter la boucle
      if ((dir < 0 && currentIndex <= 0) || (dir > 0 && currentIndex >= providers.length - 1)) {
        return;
      }
      setLock(true);
      goToIndex(next);
      setTimeout(() => setLock(false), 500);
    },
    [currentIndex, goToIndex, lock]
  );

  const handleWindowKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (lock) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        if (currentIndex >= providers.length - 1) return; // blocage à droite/bas
        setLock(true);
        goToIndex(currentIndex + 1);
        setTimeout(() => setLock(false), 500);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        if (currentIndex <= 0) return; // blocage à gauche/haut
        setLock(true);
        goToIndex(currentIndex - 1);
        setTimeout(() => setLock(false), 500);
      }
    },
    [currentIndex, goToIndex, lock]
  );

  const handleWindowTouchStart = useCallback((e: TouchEvent) => {
    touchStartY.current = e.touches[0]?.clientY ?? null;
  }, []);

  const handleWindowTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (lock) return;
      const start = touchStartY.current;
      const end = e.changedTouches[0]?.clientY ?? null;
      if (start == null || end == null) return;
      const delta = end - start;
      if (Math.abs(delta) < 20) return;
      const dir = delta < 0 ? 1 : -1;
      // Bloquer aux extrémités
      if ((dir < 0 && currentIndex <= 0) || (dir > 0 && currentIndex >= providers.length - 1)) {
        touchStartY.current = null;
        return;
      }
      setLock(true);
      goToIndex(currentIndex + dir);
      setTimeout(() => setLock(false), 500);
      touchStartY.current = null;
    },
    [currentIndex, goToIndex, lock]
  );

  useEffect(() => {
    window.addEventListener("wheel", handleWindowWheel, { passive: false });
    window.addEventListener("keydown", handleWindowKeyDown, { passive: true });
    window.addEventListener("touchstart", handleWindowTouchStart, { passive: true });
    window.addEventListener("touchend", handleWindowTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleWindowWheel as any);
      window.removeEventListener("keydown", handleWindowKeyDown as any);
      window.removeEventListener("touchstart", handleWindowTouchStart as any);
      window.removeEventListener("touchend", handleWindowTouchEnd as any);
    };
  }, [handleWindowWheel, handleWindowKeyDown, handleWindowTouchStart, handleWindowTouchEnd]);

  const current = providers[currentIndex];
  const prev = prevIndex != null ? providers[prevIndex] : null;

  const handleClick = () => {
    if (lock) return;
    connectProvider(current);
  };

  return (
    <div
      className="relative w-[2.05rem] h-[2.05rem] group pointer-events-auto select-none cursor-pointer"
      role="button"
      aria-label={`Se connecter avec ${current}`}
      tabIndex={0}
      onClick={handleClick}
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