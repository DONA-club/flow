"use client";

import React, { useEffect, useState } from "react";
import { ChatKit, useChatKit } from "@openai/chatkit-react";

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
    console.log("🆔 [ChatKit] New device ID created:", id);
  } else {
    console.log("🆔 [ChatKit] Existing device ID:", id);
  }
  return id;
}

const ChatkitWidget: React.FC<Props> = ({ className }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [error, setError] = useState<string | null>(null);

  console.log("🎨 [ChatKit] Component rendering, theme:", isDarkMode ? "dark" : "light");

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

  // Get client secret from Edge Function
  const getClientSecret = async (existingClientSecret?: string) => {
    console.log("🔑 [ChatKit] Requesting client secret...", {
      hasExisting: !!existingClientSecret,
      deviceId: getDeviceId()
    });

    const supabaseUrl = "https://scnaqjixwuqakppnahfg.supabase.co";
    const url = `${supabaseUrl}/functions/v1/chatkit-session`;
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          deviceId: getDeviceId(),
          existingClientSecret 
        }),
      });

      console.log("📡 [ChatKit] Edge Function response:", response.status, response.statusText);

      if (!response.ok) {
        const error = await response.text();
        console.error("❌ [ChatKit] Failed to get client secret:", error);
        setError(`Failed to get client secret: ${error}`);
        throw new Error("Failed to get client secret");
      }

      const data = await response.json();
      console.log("✅ [ChatKit] Client secret received:", data.client_secret ? "YES" : "NO");
      setError(null);
      return data.client_secret;
    } catch (err) {
      console.error("💥 [ChatKit] Error getting client secret:", err);
      setError(String(err));
      throw err;
    }
  };

  // Initialize ChatKit with secure client secret
  console.log("🔧 [ChatKit] Calling useChatKit...");
  
  let control;
  try {
    const result = useChatKit({
      api: { getClientSecret },
      theme: {
        colorScheme: isDarkMode ? ("dark" as const) : ("light" as const),
        typography: {
          baseSize: 16,
          fontFamily: "Inter, 'Aptos', Arial, Helvetica, sans-serif",
        },
        radius: "soft" as const,
        density: "normal" as const,
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
    } as any);
    
    control = result.control;
    console.log("✅ [ChatKit] useChatKit returned control:", !!control);
  } catch (err) {
    console.error("💥 [ChatKit] useChatKit error:", err);
    setError(String(err));
  }

  console.log("🎯 [ChatKit] Rendering ChatKit component...");

  return (
    <div
      className={`fixed bottom-4 left-4 ${className || ""}`}
      style={{
        width: "400px",
        maxWidth: "calc(100vw - 2rem)",
        height: "600px",
        maxHeight: "calc(100vh - 2rem)",
        pointerEvents: "auto",
        zIndex: 9999,
        backgroundColor: isDarkMode ? "rgba(30, 30, 30, 0.95)" : "rgba(255, 255, 255, 0.95)",
        border: error ? "2px solid red" : "2px solid green",
        borderRadius: "12px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {error && (
        <div style={{ 
          padding: "20px", 
          color: "red",
          fontSize: "12px",
          borderBottom: "1px solid red"
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {control ? (
        <>
          <div style={{ 
            padding: "10px", 
            fontSize: "10px", 
            color: "green",
            borderBottom: "1px solid green"
          }}>
            ✅ Control ready
          </div>
          <ChatKit 
            control={control} 
            className="flex-1"
          />
        </>
      ) : (
        <div style={{ 
          padding: "20px", 
          color: isDarkMode ? "white" : "black",
          fontSize: "14px"
        }}>
          ⏳ Initializing ChatKit...
        </div>
      )}
    </div>
  );
};

export default ChatkitWidget;