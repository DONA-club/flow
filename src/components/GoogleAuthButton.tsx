"use client";

import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  className?: string;
};

const GoogleAuthButton: React.FC<Props> = ({ className }) => {
  const [loading, setLoading] = React.useState(false);

  const handleGoogleLogin = () => {
    toast("Redirection vers Google…", {
      description: "Veuillez compléter la connexion dans la fenêtre suivante.",
    });
    setLoading(true);
    supabase.auth
      .signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      })
      .then(({ error }) => {
        if (error) {
          toast.error("Connexion Google indisponible", {
            description: "Le fournisseur Google n'est pas activé dans Supabase.",
          });
          setLoading(false);
        }
      });
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={loading}
      aria-label="Se connecter avec Google"
      title="Se connecter avec Google"
      className={[
        "appearance-none bg-transparent border-0 p-0 cursor-pointer select-none",
        loading ? "opacity-50 pointer-events-none" : "",
        className || ""
      ].join(" ").trim()}
    >
      <svg
        className="w-12 h-12"
        viewBox="0 0 256 262"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-hidden="true"
      >
        <path fill="#4285F4" d="M255.56 131.41c0-10.09-.9-19.77-2.6-29.02H130v55h71.43c-3.08 16.64-12.43 30.76-26.4 40.18l42.72 33.21c24.9-22.93 37.81-56.65 37.81-99.37z"/>
        <path fill="#34A853" d="M130 261c35.09 0 64.56-11.63 86.08-31.64l-42.72-33.21c-11.9 7.99-27.09 12.68-43.36 12.68-33.31 0-61.57-22.02-71.68-52.1l-45.96 35.45C36.58 232.84 80.68 261 130 261z"/>
        <path fill="#FBBC05" d="M58.32 156.73c-2.72-8.02-4.28-16.58-4.28-25.73s1.55-17.71 4.28-25.73l-45.96-35.45C3.95 84.31 0 106.19 0 131s3.95 46.69 11.36 67.19l46.96-41.46z"/>
        <path fill="#EA4335" d="M130 51.04c18.93-.29 36.02 6.49 49.56 18.84l37.38-37.38C194.55 11.63 165.09 0 130 0c-49.32 0-93.42 28.16-114.92 70.56l45.96 35.44C68.43 73.06 96.69 51.04 130 51.04z"/>
      </svg>
    </button>
  );
};

export default GoogleAuthButton;