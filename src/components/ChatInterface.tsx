"use client";

import React, { useState, useRef, useEffect } from "react";
import { Volume2, Mic, Square, Wrench } from "lucide-react";
import { chatStream, resetChatkitSession } from "@/services/chatkit";

type LogType = "info" | "success" | "error";

type Message = {
  id: number;
  text: string;
  type: "user" | "agent" | "system";
  timestamp: Date;
  fading?: boolean;
  pairId?: number;
  streaming?: boolean;
};

type ToolActivity = {
  name?: string;
  status: "running" | "done";
};

type Props = {
  className?: string;
};

const ChatInterface: React.FC<Props> = ({ className }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toolActivity, setToolActivity] = useState<ToolActivity | null>(null);
  const [lastUserActivity, setLastUserActivity] = useState<number>(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);
  const pairIdCounter = useRef(0);
  const timersRef = useRef<Map<number, { fadeTimeout?: number; removeTimeout?: number }>>(new Map());
  const activityListenersAttached = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (activityListenersAttached.current) return;

    const updateActivity = () => {
      setLastUserActivity(Date.now());
    };

    const events = ['click', 'scroll', 'touchstart', 'touchmove', 'keydown', 'mousemove', 'wheel'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    activityListenersAttached.current = true;

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      activityListenersAttached.current = false;
    };
  }, []);

  useEffect(() => {
    const handleLog = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string; type?: LogType }>;
      const isEllipsis = customEvent.detail.message.includes("...");
      const lastMessage = messages[messages.length - 1];

      setMessages((prev) => {
        if (lastMessage && lastMessage.text.includes("...") && !isEllipsis) {
          return prev.map((msg, idx) =>
            idx === prev.length - 1
              ? { ...msg, text: customEvent.detail.message, fading: false }
              : msg
          );
        }

        if (isEllipsis && lastMessage && lastMessage.text === customEvent.detail.message) {
          return prev;
        }

        return [
          ...prev,
          {
            id: ++idCounter.current,
            text: customEvent.detail.message,
            type: "system",
            timestamp: new Date(),
            fading: false,
          },
        ];
      });
    };

    window.addEventListener("app-log", handleLog);
    return () => window.removeEventListener("app-log", handleLog);
  }, [messages]);

  const systemVisibleMs = 10000;
  const systemFadeMs = 5000;
  const systemTotalMs = systemVisibleMs + systemFadeMs;

  useEffect(() => {
    messages.forEach((msg) => {
      if (msg.type !== "system") return;
      const isEllipsis = msg.text.includes("...");
      if (isEllipsis) return;

      const already = timersRef.current.get(msg.id);
      if (already) return;

      const fadeTimeout = window.setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, fading: true } : m))
        );
      }, systemVisibleMs);

      const removeTimeout = window.setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== msg.id));
        timersRef.current.delete(msg.id);
      }, systemTotalMs);

      timersRef.current.set(msg.id, { fadeTimeout, removeTimeout });
    });

    return () => {};
  }, [messages, systemVisibleMs, systemFadeMs, systemTotalMs]);

  const chatVisibleMs = 30000;
  const chatFadeMs = 5000;
  const chatTotalMs = chatVisibleMs + chatFadeMs;

  useEffect(() => {
    const pairIds = new Set<number>();
    messages.forEach(msg => {
      if (msg.pairId !== undefined && (msg.type === "user" || msg.type === "agent")) {
        pairIds.add(msg.pairId);
      }
    });

    const pairIdsArray = Array.from(pairIds).sort((a, b) => a - b);
    
    const lastPairId = pairIdsArray[pairIdsArray.length - 1];

    pairIdsArray.forEach((pairId, index) => {
      const isLastPair = pairId === lastPairId;
      const pairMessages = messages.filter(m => m.pairId === pairId);
      
      const hasUser = pairMessages.some(m => m.type === "user");
      const hasAgent = pairMessages.some(m => m.type === "agent");
      const isComplete = hasUser && hasAgent;

      if (!isComplete) return;

      if (!isLastPair) {
        pairMessages.forEach(msg => {
          const already = timersRef.current.get(msg.id);
          if (already) return;

          const fadeTimeout = window.setTimeout(() => {
            setMessages((prev) =>
              prev.map((m) => (m.id === msg.id ? { ...m, fading: true } : m))
            );
          }, 10000);

          const removeTimeout = window.setTimeout(() => {
            setMessages((prev) => prev.filter((m) => m.id !== msg.id));
            timersRef.current.delete(msg.id);
          }, 15000);

          timersRef.current.set(msg.id, { fadeTimeout, removeTimeout });
        });
      } else {
        pairMessages.forEach(msg => {
          const already = timersRef.current.get(msg.id);
          if (already) return;

          const checkActivity = () => {
            const timeSinceActivity = Date.now() - lastUserActivity;
            
            if (timeSinceActivity >= chatVisibleMs) {
              const fadeTimeout = window.setTimeout(() => {
                setMessages((prev) =>
                  prev.map((m) => (m.id === msg.id ? { ...m, fading: true } : m))
                );
              }, 0);

              const removeTimeout = window.setTimeout(() => {
                setMessages((prev) => prev.filter((m) => m.id !== msg.id));
                timersRef.current.delete(msg.id);
              }, chatFadeMs);

              timersRef.current.set(msg.id, { fadeTimeout, removeTimeout });
            } else {
              window.setTimeout(checkActivity, 1000);
            }
          };

          window.setTimeout(checkActivity, chatVisibleMs);
        });
      }
    });
  }, [messages, lastUserActivity, chatVisibleMs, chatFadeMs]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => {
        if (t.fadeTimeout) window.clearTimeout(t.fadeTimeout);
        if (t.removeTimeout) window.clearTimeout(t.removeTimeout);
      });
      timersRef.current.clear();
    };
  }, []);

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      console.log("🛑 [Chat] Stopping stream");
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setToolActivity(null);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    console.log("💬 [Chat] User sending message:", input.trim());

    const currentPairId = ++pairIdCounter.current;

    const userMessage: Message = {
      id: ++idCounter.current,
      text: input.trim(),
      type: "user",
      timestamp: new Date(),
      pairId: currentPairId,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setToolActivity(null);
    setLastUserActivity(Date.now());

    // Create agent message placeholder
    const agentMessageId = ++idCounter.current;
    const agentMessage: Message = {
      id: agentMessageId,
      text: "",
      type: "agent",
      timestamp: new Date(),
      pairId: currentPairId,
      streaming: true,
    };

    setMessages((prev) => [...prev, agentMessage]);

    // Create abort controller
    abortControllerRef.current = new AbortController();

    console.log("🌊 [Chat] Starting stream...");

    try {
      // Build conversation history
      const conversationMessages = messages
        .filter(m => m.type === "user" || m.type === "agent")
        .map(m => ({
          role: m.type === "user" ? "user" as const : "assistant" as const,
          content: m.text,
        }));

      conversationMessages.push({
        role: "user",
        content: userMessage.text,
      });

      await chatStream({
        messages: conversationMessages,
        onToken: (token) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === agentMessageId
                ? { ...msg, text: msg.text + token }
                : msg
            )
          );
        },
        onToolDelta: (payload) => {
          const toolName = 
            payload?.tool_call?.name ?? 
            payload?.function_call?.name ?? 
            payload?.tool?.name ?? 
            "outil";
          console.log("🔧 [Chat] Tool activity:", toolName);
          setToolActivity({ name: toolName, status: "running" });
        },
        onToolResult: (payload) => {
          console.log("✅ [Chat] Tool completed");
          setToolActivity(prev => prev ? { ...prev, status: "done" } : { status: "done" });
          // Auto-hide after 2s
          setTimeout(() => setToolActivity(null), 2000);
        },
        onToolStatus: (payload) => {
          console.log("📊 [Chat] Tool status:", payload?.status);
        },
        onEvent: (payload) => {
          console.log("📡 [Chat] Generic event:", payload);
        },
        onDone: () => {
          console.log("✅ [Chat] Stream completed");
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === agentMessageId
                ? { ...msg, streaming: false }
                : msg
            )
          );
          setIsLoading(false);
          setToolActivity(null);
          abortControllerRef.current = null;
        },
        onError: (error) => {
          console.error("💥 [Chat] Stream error:", error);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === agentMessageId
                ? { ...msg, text: "Une erreur est survenue.", streaming: false }
                : msg
            )
          );
          setIsLoading(false);
          setToolActivity(null);
          abortControllerRef.current = null;
        },
        signal: abortControllerRef.current.signal,
      });
    } catch (error) {
      console.error("💥 [Chat] Error:", error);
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === agentMessageId
            ? { ...msg, text: "Une erreur est survenue.", streaming: false }
            : msg
        )
      );
      setIsLoading(false);
      setToolActivity(null);
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      className={`fixed bottom-4 right-4 flex flex-col items-end gap-0 z-50 ${className || ""}`}
      style={{ pointerEvents: "auto", maxWidth: "90vw", width: "340px" }}
    >
      {/* Tool activity indicator */}
      {toolActivity && (
        <div 
          className="mb-2 flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg"
          style={{
            backgroundColor: "rgba(251, 191, 36, 0.15)",
            border: "1px solid rgba(251, 191, 36, 0.3)",
            color: "rgba(251, 191, 36, 0.9)",
          }}
        >
          <Wrench className="w-3.5 h-3.5 animate-pulse" />
          <span className="italic">
            {toolActivity.name ? `${toolActivity.name}` : "Outil"} 
            {toolActivity.status === "running" ? " en cours…" : " terminé"}
          </span>
        </div>
      )}

      <div 
        className="flex flex-col items-end gap-0 w-full max-h-[280px] mb-2"
        style={{ 
          overflowY: "hidden",
          overflowX: "hidden",
          paddingRight: "calc(14px + 0.5rem + 3.5px + 0.5rem)"
        }}
      >
        {messages.map((message, index) => {
          const prevMessage = index > 0 ? messages[index - 1] : null;
          const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
          
          const isFirstOfPair = message.pairId !== undefined && 
            (!prevMessage || prevMessage.pairId !== message.pairId);
          
          const isUserInPair = message.type === "user" && message.pairId !== undefined;
          const isAgentInPair = message.type === "agent" && message.pairId !== undefined;
          const hasAgentAfter = isUserInPair && nextMessage?.pairId === message.pairId && nextMessage?.type === "agent";
          
          // Spacing logic
          let marginTop = "0";
          let marginBottom = "0";
          
          if (message.type === "system") {
            // System messages: normal spacing
            marginTop = index > 0 ? "0.125rem" : "0";
          } else if (isUserInPair) {
            // User message in pair: larger top margin, small bottom if agent follows
            marginTop = index > 0 ? "0.5rem" : "0";
            marginBottom = hasAgentAfter ? "0.125rem" : "0";
          } else if (isAgentInPair) {
            // Agent message in pair: small top margin (already set by user), normal bottom
            marginTop = "0";
            marginBottom = "0";
          }
          
          return (
            <div
              key={message.id}
              className="w-full"
              style={{
                marginTop,
                marginBottom,
              }}
            >
              {/* Liquid glass connector for Q&A pairs */}
              {isUserInPair && hasAgentAfter && (
                <div 
                  className="w-full h-px mb-0.5"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.08) 50%, transparent 100%)",
                    opacity: message.fading ? 0.2 : 0.6,
                    transition: "opacity 300ms ease",
                  }}
                />
              )}
              
              <div
                className={`text-[13px] leading-snug tracking-tight select-none transition-all italic px-2 py-0.5 rounded flex items-center gap-2 justify-end text-right ${
                  message.fading ? "opacity-20 translate-y-1" : "opacity-100 translate-y-0"
                }`}
                style={{
                  color: message.type === "user" 
                    ? "rgba(255, 255, 255, 0.65)" 
                    : "rgba(255, 255, 255, 0.45)",
                  backgroundColor: "transparent",
                  transition: `opacity ${message.fading ? (message.type === "system" ? systemFadeMs : chatFadeMs) : 300}ms ease, transform ${message.fading ? (message.type === "system" ? systemFadeMs : chatFadeMs) : 220}ms ease`,
                }}
              >
                <span className="text-right">{message.text}{message.streaming && "▊"}</span>
                {message.type === "agent" && !message.streaming && (
                  <Volume2 className="w-3.5 h-3.5 flex-shrink-0" style={{ opacity: 0.6 }} />
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex items-center gap-2 w-full justify-end">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Prenez le contrôle..."
          disabled={isLoading}
          className="flex-1 bg-transparent border-none outline-none text-[13px] italic py-1 text-right pr-2"
          style={{
            color: "rgba(255, 255, 255, 0.65)",
            caretColor: "rgba(255, 255, 255, 0.65)",
            paddingLeft: "0.5rem",
          }}
        />
        <span
          className="text-xs select-none flex-shrink-0 animate-pulse-soft"
          style={{ 
            color: "rgba(255, 255, 255, 0.45)",
            animation: "pulse-soft 2s ease-in-out infinite",
          }}
        >
          &lt;
        </span>
        {isLoading ? (
          <Square 
            className="w-3.5 h-3.5 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity" 
            style={{ color: "rgba(255, 255, 255, 0.45)" }}
            onClick={stopStreaming}
          />
        ) : (
          <Mic 
            className="w-3.5 h-3.5 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity" 
            style={{ color: "rgba(255, 255, 255, 0.45)" }}
          />
        )}
      </div>

      <style>{`
        @keyframes pulse-soft {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.15; }
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;