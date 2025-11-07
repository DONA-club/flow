"use client";

import React, { useEffect, useState, useMemo } from "react";
import { ChatKit, useChatKit } from "@openai/chatkit-react";

function getDeviceId(): string {
  const key = "chatkit_device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
    console.log("🆔 [ChatKit] New device ID created:", id);
  } else {
    console.log("🆔 [ChatKit] Existing device ID:", id);
  }
  return id;
}

type Props = {
  className?: string;
};

const ChatkitWidget: React.FC<Props> = ({ className }) => {
  const [healthCheck, setHealthCheck] = useState<any>(null);
  const [cspViolations, setCspViolations] = useState<string[]>([]);

  const isDarkMode = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;

  // Health check
  useEffect(() => {
    const checkHealth = async () => {
      try {
        console.log("🏥 [ChatKit] Running health check...");
        const response = await fetch("https://scnaqjixwuqakppnahfg.supabase.co/functions/v1/chatkit-session/health");
        const data = await response.json();
        console.log("🏥 [ChatKit] Health check result:", data);
        setHealthCheck(data);
        
        if (!data.has_OPENAI_KEY) {
          console.error("❌ [ChatKit] Missing OPENAI_API_KEY");
        }
        if (!data.has_WORKFLOW_ID) {
          console.error("❌ [ChatKit] Missing CHATKIT_WORKFLOW_ID");
        }
      } catch (err) {
        console.error("💥 [ChatKit] Health check failed:", err);
      }
    };
    
    checkHealth();
  }, []);

  // Monitor CSP violations
  useEffect(() => {
    const handleCSPViolation = (e: SecurityPolicyViolationEvent) => {
      const violation = `${e.violatedDirective}: ${e.blockedURI}`;
      console.error("🚨 [ChatKit] CSP Violation:", {
        blockedURI: e.blockedURI,
        violatedDirective: e.violatedDirective,
        originalPolicy: e.originalPolicy,
      });
      setCspViolations(prev => [...prev, violation]);
    };

    document.addEventListener('securitypolicyviolation', handleCSPViolation);
    return () => document.removeEventListener('securitypolicyviolation', handleCSPViolation);
  }, []);

  // Stable config object with useMemo
  const config = useMemo(() => {
    console.log("⚙️ [ChatKit] Creating stable config object");
    
    return {
      api: {
        async getClientSecret(existing?: string) {
          console.log("🔑 [ChatKit] getClientSecret called, existing:", existing ? "yes" : "no");
          
          try {
            const deviceId = getDeviceId();
            const supabaseUrl = "https://scnaqjixwuqakppnahfg.supabase.co";
            const url = `${supabaseUrl}/functions/v1/chatkit-session`;
            
            console.log("📡 [ChatKit] Fetching session from:", url);
            
            const response = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                deviceId,
                existingClientSecret: existing || null,
              }),
            });

            console.log("📡 [ChatKit] Response status:", response.status);
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error("❌ [ChatKit] Session creation failed:", errorText);
              throw new Error(`chatkit-session ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log("✅ [ChatKit] Session created, client_secret:", data.client_secret?.substring(0, 10) + "...");
            
            return data.client_secret;
          } catch (err) {
            console.error("💥 [ChatKit] getClientSecret error:", err);
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
          },
        ],
      },
    };
  }, [isDarkMode]);

  console.log("🎨 [ChatKit] Calling useChatKit with stable config");
  
  let control;
  try {
    const result = useChatKit(config as any);
    control = result.control;
    console.log("✅ [ChatKit] useChatKit returned control:", !!control);
  } catch (err) {
    console.error("💥 [ChatKit] useChatKit exception:", err);
    return (
      <div className="fixed bottom-4 left-4 p-4 bg-red-500 text-white rounded-xl max-w-md z-[10000]">
        <p className="font-bold">ChatKit Error</p>
        <p className="text-sm">{String(err)}</p>
      </div>
    );
  }

  console.log("🎬 [ChatKit] Rendering ChatKit component");

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
      {/* Configuration errors */}
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

      {/* CSP violations */}
      {cspViolations.length > 0 && (
        <div className="absolute inset-0 bg-orange-500 text-white p-4 z-50 flex items-center justify-center overflow-auto">
          <div>
            <p className="font-bold">CSP Violations Detected</p>
            <ul className="text-xs mt-2 space-y-1">
              {cspViolations.map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Official ChatKit component - let the SDK handle everything */}
      <ChatKit control={control} className="w-full h-full" />
      
      {/* Debug overlay */}
      <div className="absolute top-2 right-2 bg-black/80 text-white text-xs p-2 rounded pointer-events-none z-50 max-w-[150px]">
        <div>Control: {control ? "✅" : "❌"}</div>
        <div>Health: {healthCheck ? "✅" : "⏳"}</div>
        <div>CSP: {cspViolations.length === 0 ? "✅" : `❌ ${cspViolations.length}`}</div>
      </div>
    </div>
  );
};

export default ChatkitWidget;