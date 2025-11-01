"use client";

import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SocialAuthIconButton from "@/components/SocialAuthIconButton";
import BrandIcon from "@/components/BrandIcon";
import { useAuthProviders } from "@/hooks/use-auth-providers";

type Props = {
  className?: string;
};

const AmazonAuthButton: React.FC<Props> = ({ className }) => {
  const [loading, setLoading] = React.useState(false);
  const { amazonConnected } = useAuthProviders();

  const handleAmazonLogin = () => {
    if (amazonConnected) return;
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
      disabled={loading || amazonConnected}
      ariaLabel="Se connecter avec Amazon"
      title="Se connecter avec Amazon"
      className={[
        className || "",
        amazonConnected ? "grayscale opacity-70 hover:opacity-80" : "",
      ].join(" ").trim()}
    >
      <BrandIcon name="amazon" />
    </SocialAuthIconButton>
  );
};

export default AmazonAuthButton;