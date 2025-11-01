"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";

type Props = {
  connected: boolean;
  refreshing?: boolean;
  onRefresh: () => void | Promise<void>;
  className?: string;
};

const GoogleSyncControls: React.FC<Props> = ({
  connected,
  refreshing = false,
  onRefresh,
  className,
}) => {
  return (
    <div
      className={[
        "fixed top-4 right-4 z-20",
        "glass p-3 sm:p-4 backdrop-blur-md",
        "flex items-center gap-3",
        className || "",
      ].join(" ").trim()}
      aria-label="Contrôles de synchronisation Google"
    >
      <div className="flex items-center gap-2">
        {connected ? (
          <>
            <CheckCircle className="w-4 h-4 text-emerald-400" aria-hidden />
            <span className="text-xs text-slate-200">Google connecté</span>
          </>
        ) : (
          <>
            <XCircle className="w-4 h-4 text-amber-400" aria-hidden />
            <span className="text-xs text-slate-300">Google non connecté</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <GoogleAuthButton />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onRefresh()}
          disabled={refreshing}
          aria-label="Rafraîchir Google"
          className="gap-2"
        >
          <RefreshCw className={["w-4 h-4", refreshing ? "animate-spin" : ""].join(" ")} />
          Rafraîchir
        </Button>
      </div>
    </div>
  );
};

export default GoogleSyncControls;