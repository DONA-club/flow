"use client";

import React, { useEffect, useState, useMemo } from "react";
import { ChatKit, useChatKit } from "@openai/chatkit-react";

function getDeviceId(): string {
  const key = "chatkit_device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

type Props = {
  className?: string;
};

const ChatkitWidget: React.FC<Props> = ({ className }) => {
  // Debug flag contrôlable par query ?debug=1 ou localStorage.setItem('debug_chatkit','1')
  const [debug, setDebug] = useState(false);
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const byQuery = q.get("debug") === "1";
      const byStorage = localStorage.getItem("debug_chatkit") === "1";
      setDebug(Boolean(byQuery || byStorage));
    } catch {
      setDebug(false);
    }
  }, []);
  const dlog = (...args: any[]) => {
    if (debug) console.log("[ChatKit]", ...args);
  };

  const [healthCheck, setHealthCheck] = useState<any>(null);
  const [cspViolations, setCspViolations] = useState<string[]>([]);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const isDarkMode =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  // Inject ChatKit script BEFORE useChatKit
  useEffect(() => {
    const scriptId = "chatkit-web-component-script";
    
    // Check if already loaded
    if (document.getElementById(scriptId)) {
      dlog("ChatKit script already present");
      setScriptLoaded(true);
      return;
    }

    dlog("Injecting ChatKit web component script...");
    const s = document.createElement("script");
    s.id = scriptId;
    s.src = "https://cdn.platform.openai.com/deployments/chatkit/chatkit.js";
    s.async = true;
    
    s.onload = () => {
      dlog("ChatKit script loaded successfully");
      setScriptLoaded(true);
    };
    
    s.onerror = () => {
      console.error("[ChatKit] Failed to load web component script");
      setScriptLoaded(false);
    };
    
    document.head.appendChild(s);

    return () => {
      // Cleanup on unmount (optional, usually you want to keep it)
      // const existing = document.getElementById(scriptId);
      // if (existing) existing.remove();
    };
  }, [debug]);

  // Health check
  useEffect(() => {
    const checkHealth = async () => {
      try {
        dlog("Running health check...");
        const response = await fetch(
          "https://scnaqjixwuqakppnahfg.supabase.co/functions/v1/chatkit-session/health",
        );
        const data = await response.json();
        dlog("Health check result:", data);
        setHealthCheck(data);
        if (!data.has_OPENAI_KEY || !data.has_WORKFLOW_ID) {
          console.error(
            "[ChatKit] Configuration Edge Function manquante (OPENAI_API_KEY / CHATKIT_WORKFLOW_ID).",
          );
        }
      } catch (err) {
        console.error("[ChatKit] Health check failed:", err);
      }
    };

    checkHealth();
  }, [debug]);

  // Monitor CSP violations (log uniquement en debug)
  useEffect(() => {
    const handleCSPViolation = (e: SecurityPolicyViolationEvent) => {
      const violation = `${e.violatedDirective}: ${e.blockedURI}`;
      setCspViolations((prev) => [...prev, violation]);
      dlog("CSP Violation:", {
        blockedURI: e.blockedURI,
        violatedDirective: e.violatedDirective,
      });
    };

    document.addEventListener("securitypolicyviolation", handleCSPViolation);
    return () =>
      document.removeEventListener("securitypolicyviolation", handleCSPViolation);
  }, [debug]);

  // Stable config object with useMemo
  const config = useMemo(() => {
    dlog("Creating stable config object");

    return {
      api: {
        async getClientSecret(existing?: string) {
          dlog("getClientSecret called, existing:", Boolean(existing));
          try {
            const deviceId = getDeviceId();
            const supabaseUrl = "https://scnaqjixwuqakppnahfg.supabase.co";
            const url = `${supabaseUrl}/functions/v1/chatkit-session`;

            const response = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                deviceId,
                existingClientSecret: existing || null,
              }),
            });

            dlog("getClientSecret status:", response.status);

            if (!response.ok) {
              const errorText = await response.text();
              console.error(
                "[ChatKit] Session creation failed:",
                response.status,
                errorText,
              );
              throw new Error(`chatkit-session ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            dlog(
              "Session created, client_secret:",
              data?.client_secret ? data.client_secret.substring(0, 10) + "..." : "none",
            );

            return data.client_secret;
          } catch (err) {
            console.error("[ChatKit] getClientSecret error:", err);
            throw err;
          }
        },
      },
      theme: {
        colorScheme: isDarkMode ? ("dark" as const) : ("light" as const),
        radius: "soft" as const,
        density: "normal" as const,
        color: {
          grayscale: {
            hue: isDarkMode ? 270 : 185,
            tint: 8,
            shade: 1,
          },
          accent: {
            primary: isDarkMode ? "#9e6dfc" : "#239edb",
            level: 2,
          },
        },
        typography: {
          baseSize: 16,
          fontFamily: "Inter, 'Aptos', Arial, Helvetica, sans-serif",
          fontSources: [
            {
              family: "Inter",
              src: "https://rsms.me/inter/font-files/Inter-Regular.woff2",
              weight: 400,
              style: "normal" as const,
            },
            {
              family: "Inter",
              src: "https://rsms.me/inter/font-files/Inter-Medium.woff2",
              weight: 500,
              style: "normal" as const,
            },
            {
              family: "Inter",
              src: "https://rsms.me/inter/font-files/Inter-Bold.woff2",
              weight: 700,
              style: "normal" as const,
            },
          ],
        },
      },
      composer: {
        placeholder: "Posez votre question...",
      },
      startScreen: {
        greeting: "Bonjour ! Comment puis-je vous aider ?",
        prompts: [
          { label: "Mes événements", prompt: "Quels sont mes prochains événements ?" },
          { label: "Mon sommeil", prompt: "Comment est mon sommeil récemment ?" },
          {
            label: "Lever/coucher du soleil",
            prompt: "À quelle heure se lève et se couche le soleil aujourd'hui ?",
          },
          { label: "Aide", prompt: "Comment utiliser cette application ?" },
        ],
      },
    };
  }, [isDarkMode, debug]);

  // Wait for script to load before calling useChatKit
  let control;
  try {
    if (!scriptLoaded) {
      dlog("Waiting for ChatKit script to load...");
      control = null;
    } else {
      const result = useChatKit(config as any);
      control = result.control;
      dlog("useChatKit returned control:", Boolean(control));
    }
  } catch (err) {
    console.error("[ChatKit] useChatKit exception:", err);
    return (
      <div className="fixed bottom-4 left-4 p-4 bg-red-500 text-white rounded-xl max-w-md z-[10000]">
        <p className="font-bold">ChatKit Error</p>
        <p className="text-sm">{String(err)}</p>
      </div>
    );
  }

  // Show loading state while script loads
  if (!scriptLoaded) {
    return (
      <div
        className={`fixed bottom-4 left-4 rounded-xl overflow-hidden shadow-2xl ${className || ""}`}
        style={{
          width: "400px",
          maxWidth: "calc(100vw - 2rem)",
          height: "600px",
          maxHeight: "calc(100vh - 2rem)",
          pointerEvents: "auto",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0, 0, 0, 0.8)",
        }}
      >
        <div className="text-white text-sm">Chargement ChatKit...</div>
      </div>
    );
  }

  return (
    <div
      className={`fixed bottom-4 left-4 rounded-xl overflow-hidden shadow-2xl ${className || ""}`}
      style={{
        width: "400px",
        maxWidth: "calc(100vw - 2rem)",
        height: "600px",
        maxHeight: "calc(100vh - 2rem)",
        pointerEvents: "auto",
        zIndex: 9999,
      }}
    >
      {/* Configuration errors (affiche seulement si vraiment absent) */}
      {healthCheck && !healthCheck.has_OPENAI_KEY && (
        <div className="absolute inset-0 bg-red-500 text-white p-4 z-50 flex items-center justify-center">
          <div>
            <p className="font-bold">Configuration Error</p>
            <p className="text-sm">Missing OPENAI_API_KEY</p>
          </div>
        </div>
      )}
      {healthCheck && !healthCheck.has_WORKFLOW_ID && (
        <div className="absolute inset-0 bg-red-500 text-white p-4 z-50 flex items-center justify-center">
          <div>
            <p className="font-bold">Configuration Error</p>
            <p className="text-sm">Missing CHATKIT_WORKFLOW_ID</p>
          </div>
        </div>
      )}

      {/* Official ChatKit component */}
      {control && <ChatKit control={control} className="w-full h-full" />}

      {/* Debug overlay (affiché uniquement si debug actif) */}
      {debug && (
        <div className="absolute top-2 right-2 bg-black/80 text-white text-xs p-2 rounded pointer-events-none z-50 max-w-[150px]">
          <div>Script: {scriptLoaded ? "✅" : "⏳"}</div>
          <div>Control: {control ? "✅" : "❌"}</div>
          <div>Health: {healthCheck ? "✅" : "⏳"}</div>
          <div>CSP: {cspViolations.length === 0 ? "✅" : `❌ ${cspViolations.length}`}</div>
        </div>
      )}
    </div>
  );
};

export default ChatkitWidget;