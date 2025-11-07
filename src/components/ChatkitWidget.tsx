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
  }
  return id;
}

const ChatkitWidget: React.FC<Props> = ({ className }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Detect theme changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    
    if (mq.addEventListener) {
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, []);

  // Get client secret from Edge Function
  const getClientSecret = async (existingClientSecret?: string) => {
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

      if (!response.ok) {
        const error = await response.text();
        console.error("Failed to get client secret:", error);
        throw new Error("Failed to get client secret");
      }

      const data = await response.json();
      return data.client_secret;
    } catch (err) {
      console.error("Error getting client secret:", err);
      throw err;
    }
  };

  // Initialize ChatKit with secure client secret
  const { control } = useChatKit({
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
      }}
    >
      <ChatKit 
        control={control} 
        className="w-full h-full rounded-xl overflow-hidden shadow-2xl"
      />
    </div>
  );
};

export default ChatkitWidget;