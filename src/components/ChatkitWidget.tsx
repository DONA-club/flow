"use client";

import React, { useEffect, useState } from "react";
import { useChatKit } from "@openai/chatkit-react";
import type { ChatKitOptions } from "@openai/chatkit-react";

type Props = {
  className?: string;
};

const ChatkitWidget: React.FC<Props> = ({ className }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  // ChatKit options
  const options: ChatKitOptions = {
    workflowId: "wf_68e76f7e35b08190a65e0350e1b43ff20dc8cbc65c270e59",
    domainKey: "domain_pk_690cd9bd2a34819082a4eae88e1e171b035be3ede42b08e4",
    theme: {
      colorScheme: isDarkMode ? "dark" : "light",
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
          hue: isDarkMode ? 270 : 185,
          tint: 8,
          shade: 1
        },
        accent: {
          primary: isDarkMode ? "#9e6dfc" : "#239edb",
          level: 2
        }
      }
    },
    composer: {
      placeholder: "Posez votre question...",
      attachments: {
        enabled: true,
        maxCount: 5,
        maxSize: 10 * 1024 * 1024, // 10MB
      }
    },
    startScreen: {
      greeting: "Bonjour ! Comment puis-je vous aider ?",
      prompts: [
        {
          label: "Mes événements",
          prompt: "Quels sont mes prochains événements ?",
          icon: "calendar"
        },
        {
          label: "Mon sommeil",
          prompt: "Comment est mon sommeil récemment ?",
          icon: "search"
        },
        {
          label: "Lever/coucher du soleil",
          prompt: "À quelle heure se lève et se couche le soleil aujourd'hui ?",
          icon: "lightbulb"
        },
        {
          label: "Aide",
          prompt: "Comment utiliser cette application ?",
          icon: "circle-question"
        }
      ]
    }
  };

  // Initialize ChatKit
  const chatkit = useChatKit(options);

  return (
    <div
      ref={chatkit.ref as any}
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