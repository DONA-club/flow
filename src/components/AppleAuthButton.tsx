"use client";

import React from "react";
import { Apple } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  className?: string;
};

const AppleAuthButton: React.FC<Props> = ({ className }) => {
  const [loading, setLoading] = React.useState(false);

  const handleAppleLogin = () => {
    toast("Redirection vers Apple…", {
      description: "Veuillez compléter la connexion dans la fenêtre suivante.",
    });
    setLoading(true);
    supabase.auth
      .signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: window.location.origin,
        },
      })
      .then(({ error }) => {
        if (error) {
          toast.error("Connexion Apple indisponible", {
            description: "Le fournisseur Apple n'est pas activé dans Supabase.",
          });
          setLoading(false);
        }
      });
  };

  return (
    <button
      type="button"
      onClick={handleAppleLogin}
      disabled={loading}
      aria-label="Se connecter avec Apple"
      title="Se connecter avec Apple"
      className={[
        "appearance-none bg-transparent border-0 p-0 cursor-pointer select-none group",
        loading ? "opacity-50 pointer-events-none" : "",
        className || ""
      ].join(" ").trim()}
    >
      <Apple className="w-12 h-12 text-black dark:text-white filter blur-[1px] saturate-50 transition-all duration-200 group-hover:blur-0 group-hover:saturate-100" />
    </button>
  );
};

export default AppleAuthButton;