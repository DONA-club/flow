"use client";

import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  className?: string;
};

const FacebookAuthButton: React.FC<Props> = ({ className }) => {
  const [loading, setLoading] = React.useState(false);

  const handleFacebookLogin = () => {
    toast("Redirection vers Facebook…", {
      description: "Veuillez compléter la connexion dans la fenêtre suivante.",
    });
    setLoading(true);
    supabase.auth
      .signInWithOAuth({
        provider: "facebook",
        options: {
          redirectTo: window.location.origin,
        },
      })
      .then(({ error }) => {
        if (error) {
          toast.error("Connexion Facebook indisponible", {
            description: "Le fournisseur Facebook n'est pas activé dans Supabase.",
          });
          setLoading(false);
        }
      });
  };

  return (
    <button
      type="button"
      onClick={handleFacebookLogin}
      disabled={loading}
      aria-label="Se connecter avec Facebook"
      title="Se connecter avec Facebook"
      className={[
        "appearance-none bg-transparent border-0 p-0 cursor-pointer select-none group",
        loading ? "opacity-50 pointer-events-none" : "",
        className || ""
      ].join(" ").trim()}
    >
      <svg
        className="w-12 h-12 filter blur-[1px] saturate-50 transition-all duration-200 group-hover:blur-0 group-hover:saturate-100"
        viewBox="0 0 256 256"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-hidden="true"
      >
        <circle cx="128" cy="128" r="110" fill="#1877F2" />
        <path
          d="M154 92h-18c-9 0-16 7-16 16v22h-18v26h18v52h28v-52h20l4-26h-24v-16c0-3.3 2.7-6 6-6h16z"
          fill="#fff"
        />
      </svg>
    </button>
  );
};

export default FacebookAuthButton;