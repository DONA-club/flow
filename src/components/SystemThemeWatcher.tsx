import React, { useEffect } from "react";

const SystemThemeWatcher: React.FC = () => {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = (isDark: boolean) => {
      const root = document.documentElement;
      if (isDark) {
        root.classList.add("dark");
        root.style.colorScheme = "dark";
      } else {
        root.classList.remove("dark");
        root.style.colorScheme = "light";
      }
    };

    // Initial apply
    apply(mq.matches);

    // React to changes
    const handler = (e: MediaQueryListEvent) => apply(e.matches);
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } else {
      // Safari fallback
      // @ts-ignore
      mq.addListener(handler);
      return () => {
        // @ts-ignore
        mq.removeListener(handler);
      };
    }
  }, []);

  return null;
};

export default SystemThemeWatcher;