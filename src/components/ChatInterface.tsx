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
};

type Props = {
  className?: string;
};

const ChatInterface: React.FC<Props> = ({ className }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);
  const timersRef = useRef<Map<number, { fadeTimeout?: number; removeTimeout?: number }>>(new Map());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
  const visibleMs = 10000;
  const fadeMs = 5000;
  const totalMs = visibleMs + fadeMs;

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
      }, visibleMs);

      const removeTimeout = window.setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== msg.id));
        timersRef.current.delete(msg.id);
      }, totalMs);

      timersRef.current.set(msg.id, { fadeTimeout, removeTimeout });
    });

    return () => {};
  }, [messages, visibleMs, fadeMs, totalMs]);

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

    const userMessage: Message = {
      id: ++idCounter.current,
      text: input.trim(),
      type: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

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
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      
      const errorMessage: Message = {
        id: ++idCounter.current,
        text: "Une erreur est survenue. Veuillez réessayer.",
        type: "agent",
        timestamp: new Date(),
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
              transition: `opacity ${message.fading ? fadeMs : 300}ms ease, transform ${message.fading ? fadeMs : 220}ms ease`,
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