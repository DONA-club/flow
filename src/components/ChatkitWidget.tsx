"use client";

import React from "react";
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
  const isDarkMode = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;

  const { control } = useChatKit({
    api: {
      // SDK calls this on boot + refresh
      async getClientSecret(existingClientSecret?: string) {
        const supabaseUrl = "https://scnaqjixwuqakppnahfg.supabase.co";
        const url = `${supabaseUrl}/functions/v1/chatkit-session`;
        
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deviceId: getDeviceId(),
            existingClientSecret: existingClientSecret ?? null,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`chatkit-session ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data.client_secret;
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
  } as any);

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
      <ChatKit control={control} className="w-full h-full" />
    </div>
  );
};

export default ChatkitWidget;