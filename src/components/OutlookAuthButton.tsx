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
    setLoading(true);
    toast(
      microsoftConnected
        ? "Renouvellement de l’accès Microsoft…"
        : "Redirection vers Microsoft…",
      { description: "Veuillez compléter la connexion dans la fenêtre suivante." }
    );

    const oauthOptions = {
      redirectTo: window.location.origin,
      scopes: "openid profile email offline_access Calendars.Read",
      queryParams: { prompt: "consent" },
    } as const;

    // Important: utiliser signInWithOAuth pour que la session active soit 'azure'
    // et expose provider_token/provider_refresh_token à notre watcher.
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
      return;
    }

    toast.success("Microsoft connecté", {
      description:
        "Vos événements Outlook seront inclus et fusionnés dans le calendrier.",
    });
  };

  return (
    <SocialAuthIconButton
      onClick={handleOutlookLogin}
      disabled={loading}
      ariaLabel="Se connecter avec Microsoft"
      title={microsoftConnected ? "Reconnecter Microsoft (consent)" : "Se connecter avec Microsoft"}
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