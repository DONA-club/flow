"use client";

import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SocialAuthIconButton from "@/components/SocialAuthIconButton";
import BrandIcon from "@/components/BrandIcon";

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
          scopes: "https://www.googleapis.com/auth/calendar.readonly",
          queryParams: { prompt: "consent", access_type: "offline" },
        },
      })
      .then(({ error }) => {
        if (error) {
          toast.error("Connexion Google indisponible", {
            description: "Le fournisseur Google n'est pas activé dans Supabase.",
          });
          setLoading(false);
        } else {
          toast.success("Connexion Google", {
            description: "Autorisation du calendrier accordée, retour à l'app…",
          });
        }
      });
  };

  return (
    <SocialAuthIconButton
      onClick={handleGoogleLogin}
      disabled={loading}
      ariaLabel="Se connecter avec Google"
      title="Se connecter avec Google"
      className={className}
    >
      <BrandIcon name="google" />
    </SocialAuthIconButton>
  );
};

export default GoogleAuthButton;