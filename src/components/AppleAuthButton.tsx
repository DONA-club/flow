"use client";

import React from "react";
import { Apple } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  className?: string;
};

const AppleAuthButton: React.FC<Props> = ({ className }) => {
  const [loading, setLoading] = React.useState(false);

  const handleAppleLogin = () => {
    toast("Redirection vers Apple…", {
      description: "Veuillez compléter la connexion dans la fenêtre suivante.",
    });
    setLoading(true);
    void supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={handleAppleLogin}
      disabled={loading}
      className={className}
      aria-label="Se connecter avec Apple"
    >
      <Apple className="text-black dark:text-white" />
      <span>Se connecter avec Apple</span>
    </Button>
  );
};

export default AppleAuthButton;