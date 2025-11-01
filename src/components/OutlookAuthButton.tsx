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

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    const oauthOptions = {
      redirectTo: window.location.origin,
      scopes: "openid profile email offline_access Calendars.Read",
      queryParams: { prompt: "consent" },
    } as const;

    const action = user
      ? supabase.auth.linkIdentity({ provider: "azure", options: oauthOptions })
      : supabase.auth.signInWithOAuth({ provider: "azure", options: oauthOptions });

    action.then(({ error }) => {
      if (error) {
        const msg = String((error as any)?.message || "");
        if (msg.includes("Manual linking is disabled") || (error as any)?.status === 404) {
          toast.error("Liaison de compte désactivée", {
            description:
              "Activez “Manual linking” dans Supabase (Authentication → Providers → Settings) pour connecter Microsoft à votre compte.",
          });
        } else {
          toast.error("Connexion Microsoft indisponible", {
            description: "Le fournisseur Azure n'est pas activé ou a rencontré une erreur.",
          });
        }
        setLoading(false);
      } else {
        toast.success("Microsoft connecté", {
          description:
            "Accès au calendrier accordé. Si rien ne s’affiche, re-cliquez pour re-consentir.",
        });
      }
    });
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