"use client";

import React, { useState, useRef, useEffect } from "react";
import { Volume2, Mic } from "lucide-react";

type LogType = "info" | "success" | "error";

type Message = {
  id: number;
  text: string;
  type: "user" | "agent" | "system";
  timestamp: Date;
  fading?: boolean;
  pairId?: number; // Pour lier question/réponse
};

type Props = {
  className?: string;
};

const ChatInterface: React.FC<Props> = ({ className }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastUserActivity, setLastUserActivity] = useState<number>(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);
  const pairIdCounter = useRef(0);
  const timersRef = useRef<Map<number, { fadeTimeout?: number; removeTimeout?: number }>>(new Map());
  const activityListenersAttached = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Détection d'activité utilisateur
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

  // Écouter les logs système (éphémères)
  useEffect(() => {
    const handleLog = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string; type?: LogType }>;
      const isEllipsis = customEvent.detail.message.includes("...");
      const lastMessage = messages[messages.length - 1];

      setMessages((prev) => {
        // Si le dernier message contient "..." et le nouveau n'en a pas, on remplace
        if (lastMessage && lastMessage.text.includes("...") && !isEllipsis) {
          return prev.map((msg, idx) =>
            idx === prev.length - 1
              ? { ...msg, text: customEvent.detail.message, fading: false }
              : msg
          );
        }

        // Si le nouveau message contient "..." et est identique au dernier, on ignore
        if (isEllipsis && lastMessage && lastMessage.text === customEvent.detail.message) {
          return prev;
        }

        // Sinon on ajoute un nouveau message
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

  // Gestion du fade out et suppression des messages système
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

  // Gestion du fade out des couples question/réponse
  const chatVisibleMs = 30000; // 30 secondes
  const chatFadeMs = 5000; // 5 secondes
  const chatTotalMs = chatVisibleMs + chatFadeMs;

  useEffect(() => {
    // Trouver tous les pairIds uniques
    const pairIds = new Set<number>();
    messages.forEach(msg => {
      if (msg.pairId !== undefined && (msg.type === "user" || msg.type === "agent")) {
        pairIds.add(msg.pairId);
      }
    });

    const pairIdsArray = Array.from(pairIds).sort((a, b) => a - b);
    
    // Le dernier couple (le plus récent)
    const lastPairId = pairIdsArray[pairIdsArray.length - 1];

    pairIdsArray.forEach((pairId, index) => {
      const isLastPair = pairId === lastPairId;
      const pairMessages = messages.filter(m => m.pairId === pairId);
      
      // Vérifier si le couple est complet (user + agent)
      const hasUser = pairMessages.some(m => m.type === "user");
      const hasAgent = pairMessages.some(m => m.type === "agent");
      const isComplete = hasUser && hasAgent;

      if (!isComplete) return;

      // Pour les couples précédents (pas le dernier)
      if (!isLastPair) {
        pairMessages.forEach(msg => {
          const already = timersRef.current.get(msg.id);
          if (already) return;

          // Fade immédiat pour les anciens couples quand un nouveau message utilisateur arrive
          const fadeTimeout = window.setTimeout(() => {
            setMessages((prev) =>
              prev.map((m) => (m.id === msg.id ? { ...m, fading: true } : m))
            );
          }, 10000); // 10 secondes

          const removeTimeout = window.setTimeout(() => {
            setMessages((prev) => prev.filter((m) => m.id !== msg.id));
            timersRef.current.delete(msg.id);
          }, 15000); // 10s + 5s fade

          timersRef.current.set(msg.id, { fadeTimeout, removeTimeout });
        });
      } else {
        // Pour le dernier couple, attendre l'activité utilisateur
        pairMessages.forEach(msg => {
          const already = timersRef.current.get(msg.id);
          if (already) return;

          // Vérifier périodiquement s'il y a eu de l'activité
          const checkActivity = () => {
            const timeSinceActivity = Date.now() - lastUserActivity;
            
            if (timeSinceActivity >= chatVisibleMs) {
              // Pas d'activité depuis 30s, on peut fade
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
              // Réessayer plus tard
              window.setTimeout(checkActivity, 1000);
            }
          };

          // Démarrer la vérification après 30 secondes
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

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

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
    setLastUserActivity(Date.now()); // Activité détectée

    try {
      const response = await fetch("https://chatkit.openai.com/api/v1/workflows/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer domain_pk_690cd9bd2a34819082a4eae88e1e171b035be3ede42b08e4`,
        },
        body: JSON.stringify({
          workflow_id: "wf_68e76f7e35b08190a65e0350e1b43ff20dc8cbc65c270e59",
          input: {
            input_as_text: userMessage.text,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erreur API:", response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const agentMessage: Message = {
        id: ++idCounter.current,
        text: data.output_text || "Désolé, je n'ai pas pu traiter votre demande.",
        type: "agent",
        timestamp: new Date(),
        pairId: currentPairId,
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      
      const errorMessage: Message = {
        id: ++idCounter.current,
        text: "Une erreur est survenue. Veuillez réessayer.",
        type: "agent",
        timestamp: new Date(),
        pairId: currentPairId,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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
      className={`fixed bottom-4 right-4 flex flex-col items-end gap-1 z-50 ${className || ""}`}
      style={{ pointerEvents: "auto", maxWidth: "90vw", width: "340px" }}
    >
      {/* Messages (système + chat) - SANS ASCENSEUR */}
      <div 
        className="flex flex-col items-end gap-1 w-full max-h-[280px] mb-1.5"
        style={{ 
          overflowY: "hidden",
          overflowX: "hidden"
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`text-xs leading-snug tracking-tight select-none transition-all italic px-2 py-1 rounded flex items-center gap-2 ${
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
            <span>{message.text}</span>
            {message.type === "agent" && (
              <Volume2 className="w-3 h-3 flex-shrink-0" style={{ opacity: 0.6 }} />
            )}
          </div>
        ))}
        {isLoading && (
          <div
            className="text-xs leading-snug tracking-tight select-none italic px-2 py-1 rounded"
            style={{
              color: "rgba(255, 255, 255, 0.45)",
              backgroundColor: "transparent",
            }}
          >
            ...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input avec < et microphone à droite - TOUJOURS VISIBLE */}
      <div className="flex items-center gap-2 w-full justify-end">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Posez votre question..."
          disabled={isLoading}
          className="flex-1 bg-transparent border-none outline-none text-xs italic px-2 py-1 text-right"
          style={{
            color: "rgba(255, 255, 255, 0.65)",
            caretColor: "rgba(255, 255, 255, 0.65)",
            fontSize: "12px",
          }}
        />
        <span
          className="text-xs select-none flex-shrink-0"
          style={{ color: "rgba(255, 255, 255, 0.45)" }}
        >
          &lt;
        </span>
        <Mic 
          className="w-3.5 h-3.5 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity" 
          style={{ color: "rgba(255, 255, 255, 0.45)" }}
        />
      </div>
    </div>
  );
};

export default ChatInterface;