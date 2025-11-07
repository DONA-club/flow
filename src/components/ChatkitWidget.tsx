"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
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
  const [containerReady, setContainerReady] = useState(false);
  const contextSentRef = useRef(false);

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
    s.onerror = () => console.error("❌ [ChatKit] Script failed to load");
    
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
        console.error("❌ [ChatKit] Health check failed");
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

            const shouldSendContext = !contextSentRef.current && pageContext;
            
            if (shouldSendContext) {
              console.log("📤 [ChatKit] Sending page_context to assistant");
            }

            const response = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                deviceId,
                existingClientSecret: existing || null,
                pageContext: shouldSendContext ? pageContext : null,
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error("❌ [ChatKit] Session creation failed:", response.status, errorText);
              throw new Error(`Session failed: ${response.status}`);
            }

            const data = await response.json();
            
            if (shouldSendContext && data.context_sent) {
              contextSentRef.current = true;
              console.log("✅ [ChatKit] page_context sent successfully");
            }
            
            return data.client_secret;
          } catch (err) {
            console.error("❌ [ChatKit] Error:", err);
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

  // Animation du conteneur - un seul bounce synchrone
  useEffect(() => {
    if (scriptLoaded && isExpanded && control) {
      const timer = setTimeout(() => {
        setContainerReady(true);
      }, 50);
      return () => clearTimeout(timer);
    } else if (!isExpanded) {
      setContainerReady(false);
    }
  }, [scriptLoaded, isExpanded, control]);

  // Reset du flag quand le widget se ferme
  useEffect(() => {
    if (!isExpanded) {
      contextSentRef.current = false;
    }
  }, [isExpanded]);

  if (!scriptLoaded || !isExpanded) {
    return null;
  }

  // Couleurs de fond selon le thème
  const backgroundColor = isDarkMode 
    ? "hsl(270, 8%, 15%)" // Dark mode: teinte violette sombre
    : "hsl(185, 8%, 95%)"; // Light mode: teinte cyan très claire

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
        className="rounded-xl relative"
        style={{
          height: "600px",
          maxHeight: "calc(100vh - 8rem)",
          backgroundColor: backgroundColor,
          opacity: containerReady ? 1 : 0,
          transform: containerReady ? "scaleY(1)" : "scaleY(0)",
          transformOrigin: "bottom",
          transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
          boxShadow: containerReady 
            ? "0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)"
            : "0 0 0 rgba(0, 0, 0, 0)",
        }}
      >
        {/* Bouton flèche - centré et au-dessus du conteneur */}
        <div
          onClick={onToggle}
          className="absolute left-1/2 cursor-pointer group"
          style={{
            top: 0,
            transform: "translate(-50%, 0)",
            pointerEvents: "auto",
            opacity: containerReady ? 1 : 0,
            transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
            zIndex: 50,
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
          <div className="absolute inset-0 bg-red-500 text-white p-4 z-50 flex items-center justify-center rounded-xl">
            <div>
              <p className="font-bold">Configuration Error</p>
              <p className="text-sm">Missing OPENAI_API_KEY</p>
            </div>
          </div>
        )}
        {healthCheck && !healthCheck.has_WORKFLOW_ID && (
          <div className="absolute inset-0 bg-red-500 text-white p-4 z-50 flex items-center justify-center rounded-xl">
            <div>
              <p className="font-bold">Configuration Error</p>
              <p className="text-sm">Missing CHATKIT_WORKFLOW_ID</p>
            </div>
          </div>
        )}

        {/* ChatKit - prend toute la hauteur du conteneur */}
        {control && (
          <div 
            className="w-full h-full rounded-xl overflow-hidden"
            style={{
              opacity: containerReady ? 1 : 0,
              transition: "opacity 0.4s ease 0.3s",
            }}
          >
            <ChatKit control={control} className="w-full h-full" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatkitWidget;