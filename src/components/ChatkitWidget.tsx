"use client";

import React, { useEffect, useState, useMemo } from "react";
import { ChatKit, useChatKit } from "@openai/chatkit-react";
import { ChevronDown, ChevronUp } from "lucide-react";

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
  isExpanded?: boolean;
  onToggle?: () => void;
};

const ChatkitWidget: React.FC<Props> = ({ className, isExpanded = false, onToggle }) => {
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

  useEffect(() => {
    const scriptId = "chatkit-web-component-script";
    
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
  }, [debug]);

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

  const { control } = useChatKit(config as any);
  
  dlog("useChatKit returned control:", Boolean(control));

  if (!scriptLoaded) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 left-4 flex flex-col ${className || ""}`}
      style={{
        width: "400px",
        maxWidth: "calc(100vw - 2rem)",
        pointerEvents: "auto",
        zIndex: 9999,
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Poignée de contrôle */}
      <div
        onClick={onToggle}
        className="cursor-pointer select-none mb-2 px-4 py-2 rounded-lg flex items-center justify-between gap-2 hover:bg-white/10 transition-colors"
        style={{
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <span className="text-white/80 text-xs font-medium">
          {isExpanded ? "Réduire le workflow" : "Déployer le workflow"}
        </span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-white/60" />
        ) : (
          <ChevronUp className="w-4 h-4 text-white/60" />
        )}
      </div>

      {/* Widget ChatKit avec animation */}
      <div
        className="rounded-xl overflow-hidden shadow-2xl"
        style={{
          height: isExpanded ? "600px" : "0px",
          maxHeight: isExpanded ? "calc(100vh - 8rem)" : "0px",
          opacity: isExpanded ? 1 : 0,
          transform: isExpanded ? "scaleY(1)" : "scaleY(0)",
          transformOrigin: "top",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
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

        {control && <ChatKit control={control} className="w-full h-full" />}

        {debug && (
          <div className="absolute top-2 right-2 bg-black/80 text-white text-xs p-2 rounded pointer-events-none z-50 max-w-[150px]">
            <div>Script: {scriptLoaded ? "✅" : "⏳"}</div>
            <div>Control: {control ? "✅" : "❌"}</div>
            <div>Health: {healthCheck ? "✅" : "⏳"}</div>
            <div>CSP: {cspViolations.length === 0 ? "✅" : `❌ ${cspViolations.length}`}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatkitWidget;