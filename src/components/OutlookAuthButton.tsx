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

const OutlookAuthButton: React.FC<Props> = ({ className }) => {
  const [loading, setLoading] = React.useState(false);
  const { microsoftConnected } = useAuthProviders();

  const handleOutlookLogin = async () => {
    if (microsoftConnected) return;
    setLoading(true);
    toast("Redirection vers Microsoft…", {
      description: "Veuillez compléter la connexion dans la fenêtre suivante.",
    });

    const oauthOptions = {
      redirectTo: window.location.origin,
      scopes: "openid profile email offline_access Calendars.Read",
      queryParams: { prompt: "consent" },
    } as const;

    // Toujours créer une session Azure active pour exposer provider_token/provider_refresh_token
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: oauthOptions,
    });

    if (error) {
      toast.error("Connexion Microsoft indisponible", {
        description:
          "Le fournisseur Azure n'est pas activé ou a rencontré une erreur.",
      });
      setLoading(false);
    }
  };

  return (
    <SocialAuthIconButton
      onClick={handleOutlookLogin}
      disabled={loading || microsoftConnected}
      ariaLabel="Se connecter avec Microsoft"
      title="Se connecter avec Microsoft"
      className={[
        className || "",
        microsoftConnected ? "grayscale opacity-70 hover:opacity-80" : "",
      ]
        .join(" ")
        .trim()}
    >
      <BrandIcon name="microsoft" />
    </SocialAuthIconButton>
  );
};

export default OutlookAuthButton;