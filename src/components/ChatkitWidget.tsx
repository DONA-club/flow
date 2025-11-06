"use client";

import React, { useEffect, useRef, useState } from "react";
import { createChatkitSession } from "@/services/chatkit-widget";

type Props = {
  className?: string;
  onReady?: () => void;
  onError?: (error: Error) => void;
};

// Extend Window type to include openai-chatkit
declare global {
  interface Window {
    ChatkitWidget?: any;
  }
}

const ChatkitWidget: React.FC<Props> = ({ className, onReady, onError }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const widgetInstanceRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    const initWidget = async () => {
      try {
        console.log("🚀 [ChatKit Widget] Initializing...");

        // Load ChatKit script if not already loaded
        if (!document.getElementById("chatkit-script")) {
          const script = document.createElement("script");
          script.id = "chatkit-script";
          script.src = "https://cdn.jsdelivr.net/npm/@openai/chatkit@latest/dist/chatkit.min.js";
          script.async = true;
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });

          console.log("✅ [ChatKit Widget] Script loaded");
        }

        // Create session
        const session = await createChatkitSession();
        console.log("✅ [ChatKit Widget] Session obtained");

        if (!mounted) return;

        // Wait for ChatKit to be available
        let attempts = 0;
        while (!window.ChatkitWidget && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        if (!window.ChatkitWidget) {
          throw new Error("ChatKit widget failed to load");
        }

        // Initialize widget
        if (containerRef.current) {
          widgetInstanceRef.current = new window.ChatkitWidget({
            container: containerRef.current,
            clientSecret: session.client_secret,
            theme: "light", // or "dark" based on your preference
            onReady: () => {
              console.log("✅ [ChatKit Widget] Ready");
              setIsLoading(false);
              onReady?.();
            },
            onError: (err: Error) => {
              console.error("❌ [ChatKit Widget] Error:", err);
              setError(err.message);
              onError?.(err);
            },
          });
        }

      } catch (err) {
        console.error("💥 [ChatKit Widget] Initialization failed:", err);
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          setError(errorMessage);
          setIsLoading(false);
          onError?.(err instanceof Error ? err : new Error(errorMessage));
        }
      }
    };

    initWidget();

    return () => {
      mounted = false;
      if (widgetInstanceRef.current?.destroy) {
        widgetInstanceRef.current.destroy();
      }
    };
  }, [onReady, onError]);

  if (error) {
    return (
      <div className={`flex items-center justify-center p-4 ${className || ""}`}>
        <div className="text-red-500 text-sm">
          Erreur: {error}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className || ""}`}>
        <div className="text-white/60 text-sm">
          Chargement du chat...
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={className || ""}
      style={{ minHeight: "400px" }}
    />
  );
};

export default ChatkitWidget;