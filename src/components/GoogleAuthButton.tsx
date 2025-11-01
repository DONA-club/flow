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

const GoogleAuthButton: React.FC<Props> = ({ className }) => {
  const [loading, setLoading] = React.useState(false);
  const { googleConnected } = useAuthProviders();

  const handleGoogleLogin = async () => {
    setLoading(true);
    toast(googleConnected ? "Renouvellement de l’accès Google…" : "Redirection vers Google…", {
      description: "Veuillez compléter la connexion dans la fenêtre suivante.",
    });

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    const oauthOptions = {
      redirectTo: window.location.origin,
      scopes:
        "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/fitness.sleep.read",
      queryParams: {
        prompt: "consent",
        access_type: "offline",
        include_granted_scopes: "true",
      },
    } as const;

    const doAuth = user
      ? supabase.auth.linkIdentity({ provider: "google", options: oauthOptions })
      : supabase.auth.signInWithOAuth({ provider: "google", options: oauthOptions });

    const { error } = await doAuth;

    if (error) {
      const msg = String((error as any)?.message || "");
      if (msg.includes("Manual linking is disabled") || (error as any)?.status === 404) {
        toast.error("Liaison Google désactivée", {
          description:
            "Activez “Manual linking” dans Supabase (Authentication → Providers → Settings) pour lier plusieurs fournisseurs au même compte.",
        });
      } else {
        toast.error("Connexion Google indisponible", {
          description: "Le fournisseur Google n'est pas activé ou a rencontré une erreur.",
        });
      }
      setLoading(false);
      return;
    }

    toast.success("Google connecté", {
      description: "Calendrier + sommeil seront disponibles. Si un rafraîchissement échoue, re-consentez.",
    });
  };

  return (
    <SocialAuthIconButton
      onClick={handleGoogleLogin}
      disabled={loading}
      ariaLabel="Se connecter avec Google"
      title={googleConnected ? "Reconnecter Google (consent)" : "Se connecter avec Google"}
      className={[
        className || "",
        googleConnected ? "grayscale opacity-70 hover:opacity-80" : "",
      ].join(" ").trim()}
    >
      <BrandIcon name="google" />
    </SocialAuthIconButton>
  );
};

export default GoogleAuthButton;