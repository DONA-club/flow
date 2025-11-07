"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useChatKit } from "@openai/chatkit-react";

type Props = {
  className?: string;
};

const ChatkitWidget: React.FC<Props> = ({ className }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  
  const [isReady, setIsReady] = useState(false);

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

  // Memoize options - use 'as any' to bypass strict typing issues
  const options = useMemo(() => ({
    workflowId: "wf_68e76f7e35b08190a65e0350e1b43ff20dc8cbc65c270e59",
    domainKey: "domain_pk_690cd9bd2a34819082a4eae88e1e171b035be3ede42b08e4",
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
  } as any), [isDarkMode]);

  console.log("🔧 [ChatKit] Options created:", { 
    theme: options.theme.colorScheme,
    workflowId: options.workflowId.substring(0, 20) + "..."
  });

  // Initialize ChatKit
  const chatkit = useChatKit(options);

  // Monitor when widget is ready
  useEffect(() => {
    if (!chatkit.ref?.current) {
      console.log("⏳ [ChatKit] Waiting for ref...");
      return;
    }

    console.log("📦 [ChatKit] Ref available:", {
      element: chatkit.ref.current.tagName,
      children: chatkit.ref.current.children.length
    });

    // Wait a bit for ChatKit to mount
    const timer = setTimeout(() => {
      if (chatkit.ref?.current) {
        const childCount = chatkit.ref.current.children.length;
        console.log("🔍 [ChatKit] Checking widget status, children:", childCount);
        
        if (childCount > 0) {
          console.log("✅ [ChatKit] Widget appears to be mounted!");
          setIsReady(true);
        } else {
          console.warn("⚠️ [ChatKit] No children found in container");
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [chatkit.ref?.current]);

  return (
    <div
      ref={chatkit.ref as any}
      className={`fixed bottom-4 left-4 ${className || ""}`}
      style={{
        width: "400px",
        maxWidth: "calc(100vw - 2rem)",
        height: "600px",
        maxHeight: "calc(100vh - 2rem)",
        pointerEvents: "auto",
        zIndex: 9999,
        border: isReady ? "2px solid green" : "2px solid red",
        borderRadius: "12px",
        overflow: "hidden",
        backgroundColor: isDarkMode ? "rgba(30, 30, 30, 0.95)" : "rgba(255, 255, 255, 0.95)",
      }}
    >
      {/* Fallback - should be replaced by ChatKit */}
      {!isReady && (
        <div style={{ 
          padding: "20px", 
          color: isDarkMode ? "white" : "black",
          fontSize: "14px"
        }}>
          <p>🔄 ChatKit initializing...</p>
          <p style={{ fontSize: "12px", opacity: 0.7, marginTop: "10px" }}>
            Workflow: {options.workflowId.substring(0, 30)}...
          </p>
          <p style={{ fontSize: "11px", opacity: 0.5, marginTop: "10px" }}>
            Check console for details
          </p>
        </div>
      )}
    </div>
  );
};

export default ChatkitWidget;