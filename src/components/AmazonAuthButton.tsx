"use client";

import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  className?: string;
};

const AmazonAuthButton: React.FC<Props> = ({ className }) => {
  const [loading, setLoading] = React.useState(false);

  const handleAmazonLogin = () => {
    toast("Redirection vers Amazon…", {
      description: "Veuillez compléter la connexion dans la fenêtre suivante.",
    });
    setLoading(true);
    supabase.auth
      .signInWithOAuth({
        provider: "amazon" as any,
        options: {
          redirectTo: window.location.origin,
        },
      })
      .then(({ error }) => {
        if (error) {
          toast.error("Connexion Amazon indisponible", {
            description: "Le fournisseur Amazon n'est pas activé dans Supabase.",
          });
          setLoading(false);
        }
      });
  };

  return (
    <button
      type="button"
      onClick={handleAmazonLogin}
      disabled={loading}
      aria-label="Se connecter avec Amazon"
      title="Se connecter avec Amazon"
      className={[
        "appearance-none bg-transparent border-0 p-0 cursor-pointer select-none",
        loading ? "opacity-50 pointer-events-none" : "",
        className || ""
      ].join(" ").trim()}
    >
      <svg
        className="w-12 h-12"
        viewBox="0 0 256 256"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-hidden="true"
      >
        <path d="M40 170c40 30 136 30 176 0" fill="none" stroke="#FF9900" strokeWidth="16" strokeLinecap="round" />
        <path d="M200 170l24 6-18 18" fill="#FF9900" />
      </svg>
    </button>
  );
};

export default AmazonAuthButton;