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
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      console.warn("⏳ [ChatKit] Container ref not ready");
      return;
    }

    // Wait for ChatKit to load
    const checkAndMount = () => {
      if (typeof window === "undefined" || !(window as any).ChatKit) {
        console.log("⏳ [ChatKit] Waiting for library to load...");
        return false;
      }

      console.log("🚀 [ChatKit] Library loaded, initializing widget");

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
        // Destroy previous instance if exists
        if (chatkitInstanceRef.current) {
          console.log("🔄 [ChatKit] Destroying previous instance");
          chatkitInstanceRef.current.destroy?.();
        }

        // Mount ChatKit
        const chatkit = (window as any).ChatKit.mount(containerRef.current, options);
        chatkitInstanceRef.current = chatkit;
        
        console.log("✅ [ChatKit] Widget mounted successfully");
        setIsReady(true);
        setError(null);
        return true;
      } catch (err) {
        console.error("❌ [ChatKit] Failed to mount:", err);
        setError(String(err));
        return false;
      }
    };

    // Try immediately
    if (checkAndMount()) {
      return;
    }

    // If not ready, poll until loaded
    const interval = setInterval(() => {
      if (checkAndMount()) {
        clearInterval(interval);
      }
    }, 100);

    // Timeout after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!isReady) {
        console.error("❌ [ChatKit] Timeout waiting for library");
        setError("ChatKit library failed to load");
      }
    }, 10000);

    // Cleanup
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      if (chatkitInstanceRef.current) {
        console.log("🧹 [ChatKit] Cleaning up");
        chatkitInstanceRef.current.destroy?.();
        chatkitInstanceRef.current = null;
      }
    };
  }, [isDarkMode, isReady]);

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
        border: isReady ? "2px solid green" : error ? "2px solid red" : "2px solid orange",
        borderRadius: "12px",
        overflow: "hidden"
      }}
    >
      {/* Fallback while loading */}
      {!isReady && (
        <div style={{ 
          padding: "20px", 
          color: isDarkMode ? "white" : "black",
          fontSize: "14px"
        }}>
          {error ? (
            <>
              <p>❌ ChatKit failed to load</p>
              <p style={{ fontSize: "12px", opacity: 0.7, marginTop: "10px" }}>
                {error}
              </p>
            </>
          ) : (
            <>
              <p>🔄 ChatKit loading...</p>
              <p style={{ fontSize: "12px", opacity: 0.7, marginTop: "10px" }}>
                Waiting for library...
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatkitWidget;