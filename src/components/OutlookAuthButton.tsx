"use client";

import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SocialAuthIconButton from "@/components/SocialAuthIconButton";
import BrandIcon from "@/components/BrandIcon";

type Props = {
  className?: string;
};

const OutlookAuthButton: React.FC<Props> = ({ className }) => {
  const [loading, setLoading] = React.useState(false);

  const handleOutlookLogin = () => {
    toast("Redirection vers Outlook…", {
      description: "Veuillez compléter la connexion dans la fenêtre suivante.",
    });
    setLoading(true);
    supabase.auth
      .signInWithOAuth({
        provider: "azure",
        options: {
          redirectTo: window.location.origin,
        },
      })
      .then(({ error }) => {
        if (error) {
          toast.error("Connexion Outlook indisponible", {
            description: "Le fournisseur Microsoft (Azure) n'est pas activé dans Supabase.",
          });
          setLoading(false);
        }
      });
  };

  return (
    <SocialAuthIconButton
      onClick={handleOutlookLogin}
      disabled={loading}
      ariaLabel="Se connecter avec Microsoft"
      title="Se connecter avec Microsoft"
      className={className}
    >
      <BrandIcon name="outlook" />
    </SocialAuthIconButton>
  );
};

export default OutlookAuthButton;