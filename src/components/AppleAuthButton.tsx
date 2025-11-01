"use client";

import React from "react";
import { Apple } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SocialAuthIconButton from "@/components/SocialAuthIconButton";

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
    <SocialAuthIconButton
      onClick={handleAppleLogin}
      disabled={loading}
      ariaLabel="Se connecter avec Apple"
      title="Se connecter avec Apple"
      className={className}
    >
      <Apple className="w-full h-full text-black dark:text-white" />
    </SocialAuthIconButton>
  );
};

export default AppleAuthButton;