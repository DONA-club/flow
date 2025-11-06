"use client";

import React, { useState, useRef, useEffect } from "react";
import { Volume2 } from "lucide-react";

type Message = {
  id: number;
  text: string;
  type: "user" | "agent";
  timestamp: Date;
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      className={`fixed bottom-6 right-6 flex flex-col items-end gap-1 z-50 ${className || ""}`}
      style={{ pointerEvents: "auto", maxWidth: "90vw", width: "400px" }}
    >
      {/* Messages */}
      <div className="flex flex-col items-end gap-1 w-full max-h-[300px] overflow-y-auto mb-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className="text-xs leading-tight tracking-tight select-none transition-all italic px-2 py-1 rounded flex items-center gap-2"
            style={{
              color: message.type === "user" 
                ? "rgba(255, 255, 255, 0.55)" 
                : "rgba(255, 255, 255, 0.35)",
              backgroundColor: "transparent",
              opacity: 1,
            }}
          >
            <span>{message.text}</span>
            {message.type === "agent" && (
              <Volume2 className="w-3 h-3 flex-shrink-0" style={{ opacity: 0.5 }} />
            )}
          </div>
        ))}
        {isLoading && (
          <div
            className="text-xs leading-tight tracking-tight select-none italic px-2 py-1 rounded"
            style={{
              color: "rgba(255, 255, 255, 0.35)",
              backgroundColor: "transparent",
            }}
          >
            ...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 w-full">
        <span
          className="text-xs select-none"
          style={{ color: "rgba(255, 255, 255, 0.35)" }}
        >
          &lt;
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Posez votre question..."
          disabled={isLoading}
          className="flex-1 bg-transparent border-none outline-none text-xs italic px-2 py-1"
          style={{
            color: "rgba(255, 255, 255, 0.55)",
            caretColor: "rgba(255, 255, 255, 0.55)",
          }}
        />
      </div>
    </div>
  );
};

export default ChatInterface;