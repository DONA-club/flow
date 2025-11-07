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
    const handler = (e: MediaQueryListEvent) => {
      console.log("🎨 [ChatKit] Theme changed:", e.matches ? "dark" : "light");
      setIsDarkMode(e.matches);
    };
    
    if (mq.addEventListener) {
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, []);

  // Initialize ChatKit with direct API
  useEffect(() => {
    if (!containerRef.current) {
      console.warn("⚠️ [ChatKit] Container ref not ready");
      return;
    }

    // Check if ChatKit is loaded
    if (typeof window === "undefined" || !(window as any).ChatKit) {
      console.error("❌ [ChatKit] ChatKit library not loaded");
      return;
    }

    console.log("🚀 [ChatKit] Initializing with direct API");

    const options = {
      workflowId: "wf_68e76f7e35b08190a65e0350e1b43ff20dc8cbc65c270e59",
      domainKey: "domain_pk_690cd9bd2a34819082a4eae88e1e171b035be3ede42b08e4",
      theme: {
        colorScheme: isDarkMode ? "dark" : "light",
        typography: {
          baseSize: 16,
          fontFamily: "Inter, 'Aptos', Arial, Helvetica, sans-serif",
          fontSources: [
            {
              family: "Inter",
              src: "https://rsms.me/inter/font-files/Inter-Regular.woff2",
              weight: 400,
              style: "normal"
            }
          ]
        },
        radius: "soft",
        density: "normal",
        color: {
          grayscale: {
            hue: isDarkMode ? 270 : 185,
            tint: 8,
            shade: 1
          },
          accent: {
            primary: isDarkMode ? "#9e6dfc" : "#239edb",
            level: 2
          }
        }
      },
      composer: {
        placeholder: "Posez votre question...",
        attachments: {
          enabled: true,
          maxCount: 5,
          maxSize: 10 * 1024 * 1024,
        }
      },
      startScreen: {
        greeting: "Bonjour ! Comment puis-je vous aider ?",
        prompts: [
          {
            label: "Mes événements",
            prompt: "Quels sont mes prochains événements ?",
            icon: "calendar"
          },
          {
            label: "Mon sommeil",
            prompt: "Comment est mon sommeil récemment ?",
            icon: "search"
          },
          {
            label: "Lever/coucher du soleil",
            prompt: "À quelle heure se lève et se couche le soleil aujourd'hui ?",
            icon: "lightbulb"
          },
          {
            label: "Aide",
            prompt: "Comment utiliser cette application ?",
            icon: "circle-question"
          }
        ]
      }
    };

    try {
      // Destroy previous instance if exists
      if (chatkitInstanceRef.current) {
        console.log("🔄 [ChatKit] Destroying previous instance");
        chatkitInstanceRef.current.destroy?.();
      }

      // Mount ChatKit
      const chatkit = (window as any).ChatKit.mount(containerRef.current, options);
      chatkitInstanceRef.current = chatkit;
      
      console.log("✅ [ChatKit] Widget mounted successfully");
    } catch (error) {
      console.error("❌ [ChatKit] Failed to mount:", error);
    }

    // Cleanup
    return () => {
      if (chatkitInstanceRef.current) {
        console.log("🧹 [ChatKit] Cleaning up");
        chatkitInstanceRef.current.destroy?.();
        chatkitInstanceRef.current = null;
      }
    };
  }, [isDarkMode]); // Re-mount when theme changes

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
        backgroundColor: isDarkMode ? "rgba(30, 30, 30, 0.95)" : "rgba(255, 255, 255, 0.95)",
        border: "2px solid red",
        borderRadius: "12px",
        overflow: "hidden"
      }}
    >
      {/* Fallback while loading */}
      <div style={{ 
        padding: "20px", 
        color: isDarkMode ? "white" : "black",
        fontSize: "14px"
      }}>
        <p>🔄 ChatKit loading...</p>
        <p style={{ fontSize: "12px", opacity: 0.7, marginTop: "10px" }}>
          If you see this, check the console for errors.
        </p>
      </div>
    </div>
  );
};

export default ChatkitWidget;