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
  hasEllipsis?: boolean;
};

type ToolActivity = {
  name?: string;
  status: "running" | "done";
};

type Props = {
  className?: string;
  onWorkflowTrigger?: () => void;
  onWorkflowClose?: () => void;
  chatkitExpanded?: boolean;
};

const ChatInterface: React.FC<Props> = ({ className, onWorkflowTrigger, onWorkflowClose, chatkitExpanded = false }) => {
  const [debug, setDebug] = useState(false);
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const byQuery = q.get("debug") === "1";
      const byStorage = localStorage.getItem("debug_chat") === "1";
      setDebug(Boolean(byQuery || byStorage));
    } catch {
      setDebug(false);
    }
  }, []);
  const dlog = (...args: any[]) => {
    if (debug) console.log("[Chat]", ...args);
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toolActivity, setToolActivity] = useState<ToolActivity | null>(null);
  const [lastUserActivity, setLastUserActivity] = useState<number>(Date.now());
  const [isDarkMode, setIsDarkMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);
  const pairIdCounter = useRef(0);
  const timersRef = useRef<Map<number, { fadeTimeout?: number; removeTimeout?: number }>>(new Map());
  const activityListenersAttached = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const workflowTriggeredRef = useRef(false);
  const prevChatkitExpandedRef = useRef(chatkitExpanded);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  useEffect(() => {
    if (activityListenersAttached.current) return;

    const updateActivity = () => setLastUserActivity(Date.now());

    const events = ["click", "scroll", "touchstart", "touchmove", "keydown", "mousemove", "wheel"];
    events.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    activityListenersAttached.current = true;

    return () => {
      events.forEach((event) => {
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
            idx === prev.length - 1 ? { ...msg, text: customEvent.detail.message, fading: false } : msg,
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
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, fading: true } : m)));
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

  useEffect(() => {
    const pairIds = new Set<number>();
    messages.forEach((msg) => {
      if (msg.pairId !== undefined && (msg.type === "user" || msg.type === "agent")) {
        pairIds.add(msg.pairId);
      }
    });

    const pairIdsArray = Array.from(pairIds).sort((a, b) => a - b);

    pairIdsArray.forEach((pairId) => {
      const pairMessages = messages.filter((m) => m.pairId === pairId);

      const hasUser = pairMessages.some((m) => m.type === "user");
      const agentMsg = pairMessages.find((m) => m.type === "agent");
      const hasAgent = !!agentMsg;
      const isStreaming = agentMsg?.streaming ?? false;
      const hasEllipsis = agentMsg?.hasEllipsis ?? false;

      // Pair is NOT complete if:
      // - No agent message yet
      // - Agent is still streaming
      // - Agent message ends with "..."
      const isComplete = hasUser && hasAgent && !isStreaming && !hasEllipsis;

      if (!isComplete) {
        // Clear any existing timers for this pair
        pairMessages.forEach((msg) => {
          const existing = timersRef.current.get(msg.id);
          if (existing) {
            if (existing.fadeTimeout) window.clearTimeout(existing.fadeTimeout);
            if (existing.removeTimeout) window.clearTimeout(existing.removeTimeout);
            timersRef.current.delete(msg.id);
          }
        });
        return;
      }

      // Pair is complete - start timeout
      pairMessages.forEach((msg) => {
        const already = timersRef.current.get(msg.id);
        if (already) return;

        const checkActivity = () => {
          const timeSinceActivity = Date.now() - lastUserActivity;

          if (timeSinceActivity >= chatVisibleMs) {
            const fadeTimeout = window.setTimeout(() => {
              setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, fading: true } : m)));
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
    });
  }, [messages, lastUserActivity, chatVisibleMs, chatFadeMs]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage &&
      lastMessage.type === "agent" &&
      lastMessage.text.trim() === "Chargement du workflow..." &&
      !workflowTriggeredRef.current
    ) {
      dlog("Workflow trigger detected! Replacing message and opening ChatKit");
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === lastMessage.id ? { ...msg, text: "Agent actif." } : msg
        )
      );
      
      workflowTriggeredRef.current = true;
      onWorkflowTrigger?.();
    }
  }, [messages, onWorkflowTrigger, dlog]);

  useEffect(() => {
    const wasExpanded = prevChatkitExpandedRef.current;
    const isNowClosed = !chatkitExpanded;
    
    if (wasExpanded && isNowClosed) {
      const lastMessage = messages[messages.length - 1];
      
      if (lastMessage && lastMessage.type === "agent" && lastMessage.text.trim() === "Agent actif.") {
        dlog("ChatKit closed while 'Agent actif.' displayed, changing to 'Conclu.'");
        
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === lastMessage.id ? { ...msg, text: "Conclu." } : msg
          )
        );
        
        workflowTriggeredRef.current = false;
      }
    }
    
    prevChatkitExpandedRef.current = chatkitExpanded;
  }, [chatkitExpanded, messages, dlog]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage &&
      lastMessage.type === "agent" &&
      lastMessage.text.trim() === "Conclu." &&
      !lastMessage.streaming &&
      chatkitExpanded
    ) {
      dlog("Workflow concluded! Closing ChatKit");
      
      setTimeout(() => {
        onWorkflowClose?.();
        workflowTriggeredRef.current = false;
      }, 1500);
    }
  }, [messages, onWorkflowClose, chatkitExpanded, dlog]);

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
      dlog("Stopping stream");
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setToolActivity(null);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    dlog("User sending message:", input.trim());

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

    const agentMessageId = ++idCounter.current;
    const agentMessage: Message = {
      id: agentMessageId,
      text: "",
      type: "agent",
      timestamp: new Date(),
      pairId: currentPairId,
      streaming: true,
      hasEllipsis: false,
    };

    setMessages((prev) => [...prev, agentMessage]);

    abortControllerRef.current = new AbortController();

    dlog("Starting stream...");

    try {
      const conversationMessages = messages
        .filter((m) => m.type === "user" || m.type === "agent")
        .map((m) => ({
          role: m.type === "user" ? ("user" as const) : ("assistant" as const),
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
            prev.map((msg) => {
              if (msg.id === agentMessageId) {
                const newText = msg.text + token;
                const hasEllipsis = newText.trim().endsWith("...");
                return { ...msg, text: newText, hasEllipsis };
              }
              return msg;
            })
          );
        },
        onToolDelta: (payload) => {
          const toolName =
            payload?.tool_call?.name ??
            payload?.function_call?.name ??
            payload?.tool?.name ??
            "outil";
          dlog("Tool activity:", toolName);
          setToolActivity({ name: toolName, status: "running" });
        },
        onToolResult: () => {
          dlog("Tool completed");
          setToolActivity((prev) => (prev ? { ...prev, status: "done" } : { status: "done" }));
          setTimeout(() => setToolActivity(null), 2000);
        },
        onToolStatus: (payload) => {
          dlog("Tool status:", payload?.status);
        },
        onEvent: (payload) => {
          dlog("Event:", payload);
        },
        onDone: () => {
          dlog("Stream completed");
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === agentMessageId) {
                const hasEllipsis = msg.text.trim().endsWith("...");
                return { ...msg, streaming: false, hasEllipsis };
              }
              return msg;
            })
          );
          setIsLoading(false);
          setToolActivity(null);
          abortControllerRef.current = null;
        },
        onError: (error) => {
          console.warn("[Chat] Stream error:", error);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === agentMessageId ? { ...msg, text: "Une erreur est survenue.", streaming: false, hasEllipsis: false } : msg,
            ),
          );
          setIsLoading(false);
          setToolActivity(null);
          abortControllerRef.current = null;
        },
        signal: abortControllerRef.current.signal,
      });
    } catch (error) {
      console.warn("[Chat] Error:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === agentMessageId ? { ...msg, text: "Une erreur est survenue.", streaming: false, hasEllipsis: false } : msg,
        ),
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

  const placeholderColor = isDarkMode ? "rgba(255, 255, 255, 0.65)" : "#1d4ed8";
  const chevronColor = isDarkMode ? "rgba(255, 255, 255, 0.45)" : "rgba(255, 255, 255, 0.85)";

  // Separate messages into categories for rendering order
  const systemMessages = messages.filter(m => m.type === "system");
  const qaPairs = messages.filter(m => m.type === "user" || m.type === "agent");

  // Group Q/A pairs
  const pairGroups = new Map<number, Message[]>();
  qaPairs.forEach(msg => {
    if (msg.pairId !== undefined) {
      if (!pairGroups.has(msg.pairId)) {
        pairGroups.set(msg.pairId, []);
      }
      pairGroups.get(msg.pairId)!.push(msg);
    }
  });

  // Sort pairs by most recent first
  const sortedPairIds = Array.from(pairGroups.keys()).sort((a, b) => b - a);

  // Find pairs with ellipsis (incomplete)
  const ellipsisPairs = sortedPairIds.filter(pairId => {
    const pair = pairGroups.get(pairId)!;
    const agentMsg = pair.find(m => m.type === "agent");
    return agentMsg?.hasEllipsis || agentMsg?.streaming;
  });

  // Most recent ellipsis pair goes to bottom
  const bottomPairId = ellipsisPairs.length > 0 ? ellipsisPairs[0] : null;

  // Other pairs (complete or older ellipsis)
  const otherPairIds = sortedPairIds.filter(id => id !== bottomPairId);

  return (
    <div
      className={`fixed bottom-4 right-4 flex flex-col items-end gap-0 z-50 ${className || ""}`}
      style={{ pointerEvents: "auto", maxWidth: "90vw", width: "340px" }}
    >
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
          paddingRight: "calc(14px + 0.5rem + 3.5px + 0.5rem)",
        }}
      >
        {/* System messages (always on top) */}
        {systemMessages.map((message) => (
          <div key={message.id} className="w-full" style={{ marginTop: "0.125rem" }}>
            <div
              className={`text-[13px] leading-snug tracking-tight select-none transition-all italic px-2 py-0.5 rounded flex items-center gap-2 justify-end text-right ${
                message.fading ? "opacity-20 translate-y-1" : "opacity-100 translate-y-0"
              }`}
              style={{
                color: "rgba(255, 255, 255, 0.45)",
                backgroundColor: "transparent",
                transition: `opacity ${message.fading ? systemFadeMs : 300}ms ease, transform ${message.fading ? systemFadeMs : 220}ms ease`,
              }}
            >
              <span className="text-right">{message.text}</span>
            </div>
          </div>
        ))}

        {/* Other Q/A pairs (complete or older ellipsis) */}
        {otherPairIds.map(pairId => {
          const pair = pairGroups.get(pairId)!;
          const userMsg = pair.find(m => m.type === "user");
          const agentMsg = pair.find(m => m.type === "agent");

          return (
            <React.Fragment key={pairId}>
              {userMsg && (
                <div className="w-full" style={{ marginTop: "0.5rem" }}>
                  <div
                    className={`text-[13px] leading-snug tracking-tight select-none transition-all italic px-2 py-0.5 rounded flex items-center gap-2 justify-end text-right ${
                      userMsg.fading ? "opacity-20 translate-y-1" : "opacity-100 translate-y-0"
                    }`}
                    style={{
                      color: "rgba(255, 255, 255, 0.65)",
                      backgroundColor: "transparent",
                      transition: `opacity ${userMsg.fading ? chatFadeMs : 300}ms ease, transform ${userMsg.fading ? chatFadeMs : 220}ms ease`,
                    }}
                  >
                    <span className="text-right">{userMsg.text}</span>
                  </div>
                </div>
              )}

              {agentMsg && (
                <>
                  <div
                    className="w-full h-px mb-0.5"
                    style={{
                      background: "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.08) 50%, transparent 100%)",
                      opacity: agentMsg.fading ? 0.2 : 0.6,
                      transition: "opacity 300ms ease",
                    }}
                  />
                  <div className="w-full">
                    <div
                      className={`text-[13px] leading-snug tracking-tight select-none transition-all italic px-2 py-0.5 rounded flex items-center gap-2 justify-end text-right ${
                        agentMsg.fading ? "opacity-20 translate-y-1" : "opacity-100 translate-y-0"
                      }`}
                      style={{
                        color: "rgba(255, 255, 255, 0.45)",
                        backgroundColor: "transparent",
                        transition: `opacity ${agentMsg.fading ? chatFadeMs : 300}ms ease, transform ${agentMsg.fading ? chatFadeMs : 220}ms ease`,
                      }}
                    >
                      <span className="text-right">
                        {agentMsg.text}
                        {agentMsg.streaming && "▊"}
                      </span>
                      {!agentMsg.streaming && (
                        <Volume2 className="w-3.5 h-3.5 flex-shrink-0" style={{ opacity: 0.6 }} />
                      )}
                    </div>
                  </div>
                </>
              )}
            </React.Fragment>
          );
        })}

        {/* Bottom pair (most recent ellipsis or streaming) */}
        {bottomPairId !== null && (() => {
          const pair = pairGroups.get(bottomPairId)!;
          const userMsg = pair.find(m => m.type === "user");
          const agentMsg = pair.find(m => m.type === "agent");

          return (
            <React.Fragment key={bottomPairId}>
              {userMsg && (
                <div className="w-full" style={{ marginTop: "0.5rem" }}>
                  <div
                    className="text-[13px] leading-snug tracking-tight select-none transition-all italic px-2 py-0.5 rounded flex items-center gap-2 justify-end text-right opacity-100 translate-y-0"
                    style={{
                      color: "rgba(255, 255, 255, 0.65)",
                      backgroundColor: "transparent",
                    }}
                  >
                    <span className="text-right">{userMsg.text}</span>
                  </div>
                </div>
              )}

              {agentMsg && (
                <>
                  <div
                    className="w-full h-px mb-0.5"
                    style={{
                      background: "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.08) 50%, transparent 100%)",
                      opacity: 0.6,
                    }}
                  />
                  <div className="w-full">
                    <div
                      className="text-[13px] leading-snug tracking-tight select-none transition-all italic px-2 py-0.5 rounded flex items-center gap-2 justify-end text-right opacity-100 translate-y-0"
                      style={{
                        color: "rgba(255, 255, 255, 0.45)",
                        backgroundColor: "transparent",
                      }}
                    >
                      <span className="text-right">
                        {agentMsg.text}
                        {agentMsg.streaming && "▊"}
                      </span>
                      {!agentMsg.streaming && (
                        <Volume2 className="w-3.5 h-3.5 flex-shrink-0" style={{ opacity: 0.6 }} />
                      )}
                    </div>
                  </div>
                </>
              )}
            </React.Fragment>
          );
        })()}

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
          className="flex-1 bg-transparent border-none outline-none text-[13px] italic py-1 text-right pr-2 placeholder-custom"
          style={{
            color: "rgba(255, 255, 255, 0.65)",
            caretColor: "rgba(255, 255, 255, 0.65)",
            paddingLeft: "0.5rem",
            ["--placeholder-color" as any]: placeholderColor,
          }}
        />
        <span
          className="text-xs select-none flex-shrink-0 animate-pulse-soft"
          style={{ color: chevronColor, animation: "pulse-soft 2s ease-in-out infinite" }}
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
        
        .placeholder-custom::placeholder {
          color: var(--placeholder-color);
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;