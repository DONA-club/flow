"use client";

import React from "react";
import ProviderButton from "@/components/ProviderButton";
import { useMultiProviderAuth } from "@/hooks/use-multi-provider-auth";
import { CheckCircle2 } from "lucide-react";

const AuthProviderGrid: React.FC = () => {
  const { connectedProviders, loading } = useMultiProviderAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        <span className="text-white/80">Chargement des connexions…</span>
      </div>
    );
  }

  const providers: Array<"google" | "microsoft" | "apple" | "facebook" | "amazon"> = [
    "google",
    "microsoft",
    "apple",
    "facebook",
    "amazon",
  ];

  const connectedCount = providers.filter((p) => connectedProviders[p]).length;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-wrap items-center justify-center gap-4">
        {providers.map((provider) => (
          <div key={provider} className="relative">
            <ProviderButton provider={provider} />
            {connectedProviders[provider] && (
              <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}
      </div>

      {connectedCount > 0 && (
        <div className="text-center text-white/90 text-sm">
          <span className="font-semibold">{connectedCount}</span> compte{connectedCount > 1 ? "s" : ""} connecté{connectedCount > 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
};

export default AuthProviderGrid;