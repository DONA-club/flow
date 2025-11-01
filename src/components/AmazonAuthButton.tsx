"use client";

import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SocialAuthIconButton from "@/components/SocialAuthIconButton";
import BrandIcon from "@/components/BrandIcon";

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
    <SocialAuthIconButton
      onClick={handleAmazonLogin}
      disabled={loading}
      ariaLabel="Se connecter avec Amazon"
      title="Se connecter avec Amazon"
      className={className}
    >
      <BrandIcon name="amazon" />
    </SocialAuthIconButton>
  );
};

export default AmazonAuthButton;