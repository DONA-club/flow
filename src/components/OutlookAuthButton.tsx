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
    toast("Redirection vers Microsoft…", {
      description: "Veuillez compléter la connexion dans la fenêtre suivante.",
    });

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    const oauthOptions = { redirectTo: window.location.origin } as const;

    const action = user
      ? supabase.auth.linkIdentity({ provider: "azure", options: oauthOptions })
      : supabase.auth.signInWithOAuth({ provider: "azure", options: oauthOptions });

    action.then(({ error }) => {
      if (error) {
        toast.error("Connexion Outlook indisponible", {
          description: "Le fournisseur Microsoft (Azure) n'est pas activé ou a rencontré une erreur.",
        });
        setLoading(false);
      } else {
        toast.success("Microsoft connecté", {
          description: "Accès à l’agenda Outlook accordé.",
        });
      }
    });
  };

  return (
    <SocialAuthIconButton
      onClick={handleOutlookLogin}
      disabled={loading}
      ariaLabel="Se connecter avec Microsoft"
      title="Se connecter avec Microsoft"
      className={[
        className || "",
        microsoftConnected ? "grayscale opacity-70 hover:opacity-80" : "",
      ].join(" ").trim()}
    >
      <BrandIcon name="microsoft" />
    </SocialAuthIconButton>
  );
};

export default OutlookAuthButton;