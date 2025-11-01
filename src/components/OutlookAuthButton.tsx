"use client";

import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SocialAuthIconButton from "@/components/SocialAuthIconButton";

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
      <svg
        className="w-full h-full"
        viewBox="0 0 256 256"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid meet"
      >
        <rect x="20" y="20" width="100" height="100" fill="#F25022" rx="8" />
        <rect x="136" y="20" width="100" height="100" fill="#7FBA00" rx="8" />
        <rect x="20" y="136" width="100" height="100" fill="#00A4EF" rx="8" />
        <rect x="136" y="136" width="100" height="100" fill="#FFB900" rx="8" />
      </svg>
    </SocialAuthIconButton>
  );
};

export default OutlookAuthButton;