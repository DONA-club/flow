"use client";

import React, { useEffect, useState, useRef } from "react";

type Props = {
  className?: string;
};

const ChatkitWidget: React.FC<Props> = ({ className }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetInitialized = useRef(false);

  // Detect theme
  useEffect(() => {
    const updateTheme = () => {
      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDarkMode(dark);
    };
    
    updateTheme();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => updateTheme();
    
    if (mq.addEventListener) {
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, []);

  // Initialize ChatKit widget
  useEffect(() => {
    if (widgetInitialized.current || !containerRef.current) return;

    // Wait for ChatKit script to load
    const initWidget = () => {
      if (typeof window === "undefined" || !(window as any).ChatKit) {
        setTimeout(initWidget, 100);
        return;
      }

      const theme = isDarkMode ? {
        colorScheme: "dark",
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
            hue: 270,
            tint: 8,
            shade: 1
          },
          accent: {
            primary: "#9e6dfc",
            level: 2
          }
        }
      } : {
        colorScheme: "light",
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
            hue: 185,
            tint: 8,
            shade: 1
          },
          accent: {
            primary: "#239edb",
            level: 2
          }
        }
      };

      try {
        (window as any).ChatKit.mount({
          container: containerRef.current,
          workflowId: "wf_68e76f7e35b08190a65e0350e1b43ff20dc8cbc65c270e59",
          domainKey: "domain_pk_690cd9bd2a34819082a4eae88e1e171b035be3ede42b08e4",
          theme,
          composer: {
            attachments: {
              enabled: true,
              maxCount: 5,
              maxSize: 10485760
            }
          },
          startScreen: {
            greeting: "Bonjour ! Comment puis-je vous aider ?",
            prompts: [
              {
                icon: "calendar",
                label: "Mes événements",
                prompt: "Quels sont mes prochains événements ?"
              },
              {
                icon: "moon",
                label: "Mon sommeil",
                prompt: "Comment est mon sommeil récemment ?"
              },
              {
                icon: "sun",
                label: "Lever/coucher du soleil",
                prompt: "À quelle heure se lève et se couche le soleil aujourd'hui ?"
              },
              {
                icon: "circle-question",
                label: "Aide",
                prompt: "Comment utiliser cette application ?"
              }
            ]
          }
        });

        widgetInitialized.current = true;
        console.log("✅ [ChatKit] Widget initialized");
      } catch (error) {
        console.error("❌ [ChatKit] Widget initialization failed:", error);
      }
    };

    initWidget();
  }, [isDarkMode]);

  return (
    <div
      ref={containerRef}
      className={`fixed bottom-4 left-4 z-50 ${className || ""}`}
      style={{
        width: "400px",
        maxWidth: "calc(100vw - 2rem)",
        height: "600px",
        maxHeight: "calc(100vh - 2rem)",
        pointerEvents: "auto"
      }}
    />
  );
};

export default ChatkitWidget;