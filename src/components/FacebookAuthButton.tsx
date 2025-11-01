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

const FacebookAuthButton: React.FC<Props> = ({ className }) => {
  const [loading, setLoading] = React.useState(false);
  const { facebookConnected } = useAuthProviders();

  const handleFacebookLogin = () => {
    if (facebookConnected) return;
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
    <SocialAuthIconButton
      onClick={handleFacebookLogin}
      disabled={loading || facebookConnected}
      ariaLabel="Se connecter avec Facebook"
      title="Se connecter avec Facebook"
      className={[
        className || "",
        facebookConnected ? "grayscale opacity-70 hover:opacity-80" : "",
      ].join(" ").trim()}
    >
      <BrandIcon name="facebook" />
    </SocialAuthIconButton>
  );
};

export default FacebookAuthButton;