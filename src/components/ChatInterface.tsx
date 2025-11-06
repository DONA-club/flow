"use client";

import React, { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import ChatkitWidget from "@/components/ChatkitWidget";

type Props = {
  className?: string;
};

const ChatInterface: React.FC<Props> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);

  return (
    <>
      {/* Floating chat button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 z-50 p-3 rounded-full shadow-lg transition-all ${
          isOpen ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
        } ${className || ""}`}
        aria-label={isOpen ? "Fermer le chat" : "Ouvrir le chat"}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageSquare className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Chat widget container */}
      {isOpen && (
        <div 
          className="fixed bottom-20 right-4 z-40 w-[90vw] max-w-[400px] h-[600px] max-h-[80vh] rounded-lg shadow-2xl overflow-hidden"
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
          }}
        >
          <ChatkitWidget
            className="w-full h-full"
            onReady={() => {
              console.log("✅ ChatKit widget ready");
              setIsReady(true);
            }}
            onError={(error) => {
              console.error("❌ ChatKit widget error:", error);
            }}
          />
        </div>
      )}
    </>
  );
};

export default ChatInterface;