"use client";

import React from "react";
import BrandIcon from "@/components/BrandIcon";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SocialAuthIconButton from "@/components/SocialAuthIconButton";
import { useAuthProviders } from "@/hooks/use-auth-providers";

type Props = {
  className?: string;
};

const AppleAuthButton: React.FC<Props> = ({ className }) => {
  const [loading, setLoading] = React.useState(false);
  const { appleConnected } = useAuthProviders();

  const handleAppleLogin = async () => {
    if (appleConnected) return;
    toast("Redirection vers Apple…", {
      description: "Veuillez compléter la connexion dans la fenêtre suivante.",
    });
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    const oauthOptions = {
      redirectTo: window.location.origin,
    } as const;

    const action = user
      ? supabase.auth.linkIdentity({ provider: "apple", options: oauthOptions })
      : supabase.auth.signInWithOAuth({ provider: "apple", options: oauthOptions });

    action.then(({ error }) => {
      if (error) {
        const msg = String((error as any)?.message || "");
        if (msg.includes("Manual linking is disabled") || (error as any)?.status === 404) {
          toast.error("Liaison de compte désactivée", {
            description:
              "Activez “Manual linking” dans Supabase (Authentication → Providers → Settings) pour connecter plusieurs fournisseurs au même compte.",
          });
        } else {
          toast.error("Connexion Apple indisponible", {
            description:
              "Le fournisseur Apple n'est pas activé dans Supabase ou a rencontré une erreur.",
          });
        }
        setLoading(false);
      } else {
        toast.success("Apple connecté", {
          description: "Votre compte Apple a été relié avec succès.",
        });
      }
    });
  };

  return (
    <SocialAuthIconButton
      onClick={handleAppleLogin}
      disabled={loading || appleConnected}
      ariaLabel="Se connecter avec Apple"
      title="Se connecter avec Apple"
      className={[
        className || "",
        appleConnected ? "grayscale opacity-70 hover:opacity-80" : "",
      ]
        .join(" ")
        .trim()}
    >
      <BrandIcon name="apple" />
    </SocialAuthIconButton>
  );
};

export default AppleAuthButton;