"use client";

import React, { useEffect, useState, useMemo } from "react";
import { ChatKit, useChatKit } from "@openai/chatkit-react";
import { ChevronDown } from "lucide-react";
import type { PageContext } from "@/utils/page-context";

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
  pageContext?: PageContext | null;
};

const ChatkitWidget: React.FC<Props> = ({ className, isExpanded = false, onToggle, pageContext }) => {
  const [healthCheck, setHealthCheck] = useState<any>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const isDarkMode =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  useEffect(() => {
    const scriptId = "chatkit-web-component-script";
    
    if (document.getElementById(scriptId)) {
      setScriptLoaded(true);
      return;
    }

    const s = document.createElement("script");
    s.id = scriptId;
    s.src = "https://cdn.platform.openai.com/deployments/chatkit/chatkit.js";
    s.async = true;
    
    s.onload = () => setScriptLoaded(true);
    s.onerror = () => console.error("❌ [ChatKit] Script load failed");
    
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(
          "https://scnaqjixwuqakppnahfg.supabase.co/functions/v1/chatkit-session/health",
        );
        const data = await response.json();
        setHealthCheck(data);
      } catch (err) {
        console.error("❌ [ChatKit] Health check failed:", err);
      }
    };

    checkHealth();
  }, []);

  const config = useMemo(() => {
    return {
      api: {
        async getClientSecret(existing?: string) {
          try {
            const deviceId = getDeviceId();
            const supabaseUrl = "https://scnaqjixwuqakppnahfg.supabase.co";
            const url = `${supabaseUrl}/functions/v1/chatkit-session`;

            console.log("📤 [ChatKit] Sending context to server:", !!pageContext);

            const response = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                deviceId,
                existingClientSecret: existing || null,
                pageContext: pageContext || null,
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error("❌ [ChatKit] Session failed:", response.status, errorText);
              throw new Error(`chatkit-session ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log("✅ [ChatKit] Session created, context sent:", data.context_sent);
            return data.client_secret;
          } catch (err) {
            console.error("❌ [ChatKit] getClientSecret error:", err);
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
        ],
      },
    };
  }, [isDarkMode, pageContext]);

  const { control } = useChatKit(config as any);

  if (!scriptLoaded || !isExpanded) {
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
      }}
    >
      <div
        className="rounded-xl overflow-hidden shadow-2xl relative"
        style={{
          height: "600px",
          maxHeight: "calc(100vh - 8rem)",
          opacity: isExpanded ? 1 : 0,
          transform: isExpanded ? "scaleY(1)" : "scaleY(0)",
          transformOrigin: "top",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div
          onClick={onToggle}
          className="absolute top-0 left-1/2 -translate-x-1/2 z-50 cursor-pointer group"
          style={{
            pointerEvents: "auto",
          }}
        >
          <div
            className="px-4 py-2 rounded-b-xl flex items-center justify-center transition-all duration-300 group-hover:py-3"
            style={{
              background: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(12px) saturate(160%)",
              WebkitBackdropFilter: "blur(12px) saturate(160%)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderTop: "none",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
            }}
          >
            <ChevronDown 
              className="w-4 h-4 text-white/50 group-hover:text-white/70 transition-colors" 
              strokeWidth={2.5}
            />
          </div>
        </div>

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
      </div>
    </div>
  );
};

export default ChatkitWidget;