"use client";

import React, { useEffect, useRef, useState } from "react";

type Props = {
  className?: string;
};

const ChatkitWidget: React.FC<Props> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chatkitInstanceRef = useRef<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Detect theme changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    
    if (mq.addEventListener) {
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, []);

  // Initialize ChatKit
  useEffect(() => {
    if (!containerRef.current) return;

    const checkAndMount = () => {
      if (typeof window === "undefined" || !(window as any).ChatKit) {
        return false;
      }

      const options = {
        workflowId: "wf_68e76f7e35b08190a65e0350e1b43ff20dc8cbc65c270e59",
        domainKey: "domain_pk_690cd9bd2a34819082a4eae88e1e171b035be3ede42b08e4",
        theme: {
          colorScheme: isDarkMode ? "dark" : "light",
          typography: {
            baseSize: 16,
            fontFamily: "Inter, 'Aptos', Arial, Helvetica, sans-serif",
          },
          radius: "soft",
          density: "normal",
        },
        composer: {
          placeholder: "Posez votre question...",
        },
        startScreen: {
          greeting: "Bonjour ! Comment puis-je vous aider ?",
          prompts: [
            {
              label: "Mes événements",
              prompt: "Quels sont mes prochains événements ?",
            },
            {
              label: "Mon sommeil",
              prompt: "Comment est mon sommeil récemment ?",
            },
            {
              label: "Lever/coucher du soleil",
              prompt: "À quelle heure se lève et se couche le soleil aujourd'hui ?",
            },
            {
              label: "Aide",
              prompt: "Comment utiliser cette application ?",
            }
          ]
        }
      };

      try {
        if (chatkitInstanceRef.current) {
          chatkitInstanceRef.current.destroy?.();
        }

        const chatkit = (window as any).ChatKit.mount(containerRef.current, options);
        chatkitInstanceRef.current = chatkit;
        
        return true;
      } catch (err) {
        console.error("ChatKit mount error:", err);
        return false;
      }
    };

    if (checkAndMount()) return;

    const interval = setInterval(() => {
      if (checkAndMount()) clearInterval(interval);
    }, 100);

    const timeout = setTimeout(() => clearInterval(interval), 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      if (chatkitInstanceRef.current) {
        chatkitInstanceRef.current.destroy?.();
        chatkitInstanceRef.current = null;
      }
    };
  }, [isDarkMode]);

  return (
    <div
      ref={containerRef}
      className={`fixed bottom-4 left-4 ${className || ""}`}
      style={{
        width: "400px",
        maxWidth: "calc(100vw - 2rem)",
        height: "600px",
        maxHeight: "calc(100vh - 2rem)",
        pointerEvents: "auto",
        zIndex: 9999,
        borderRadius: "12px",
        overflow: "hidden"
      }}
    />
  );
};

export default ChatkitWidget;