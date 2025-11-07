"use client";

import React, { useEffect, useRef, useState } from "react";

type Props = {
  className?: string;
};

// Generate or retrieve device ID
function getDeviceId(): string {
  const key = "chatkit_device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

const ChatkitWidget: React.FC<Props> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chatkitInstanceRef = useRef<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Load ChatKit CDN script
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="chatkit.js"]');
    if (existingScript) return;

    const script = document.createElement("script");
    script.src = "https://cdn.platform.openai.com/deployments/chatkit/chatkit.js";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Mount ChatKit widget
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
          colorScheme: "auto" as const,
          radius: "soft" as const,
          density: "normal" as const,
          color: {
            grayscale: {
              hue: 220,
              tint: 10,
              shade: -10,
            },
            accent: {
              primary: "#6d28d9",
              level: 5,
            },
          },
          typography: {
            baseSize: 16,
            fontFamily: "Inter, 'Aptos', Arial, Helvetica, sans-serif",
          },
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

    // Try to mount immediately
    if (checkAndMount()) return;

    // If not ready, poll until ChatKit is available
    const interval = setInterval(() => {
      if (checkAndMount()) {
        clearInterval(interval);
      }
    }, 100);

    // Give up after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      if (chatkitInstanceRef.current) {
        chatkitInstanceRef.current.destroy?.();
        chatkitInstanceRef.current = null;
      }
    };
  }, []);

  // Auto theme switching
  useEffect(() => {
    if (!chatkitInstanceRef.current) return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    
    const updateTheme = () => {
      const colorScheme = mq.matches ? "dark" : "light";
      setIsDarkMode(mq.matches);
      
      chatkitInstanceRef.current?.update?.({
        theme: {
          colorScheme,
          radius: "soft",
          density: "normal",
          color: {
            grayscale: {
              hue: 220,
              tint: 10,
              shade: -10,
            },
            accent: {
              primary: "#6d28d9",
              level: 5,
            },
          },
          typography: {
            baseSize: 16,
            fontFamily: "Inter, 'Aptos', Arial, Helvetica, sans-serif",
          },
        },
      });
    };

    mq.addEventListener("change", updateTheme);
    return () => mq.removeEventListener("change", updateTheme);
  }, []);

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
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
      }}
    />
  );
};

export default ChatkitWidget;