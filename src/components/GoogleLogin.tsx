import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export default function GoogleLogin({ onLogin }: { onLogin?: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/calendar",
      },
    });
    if (error) {
      alert("Erreur lors de la connexion Google : " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[320px]">
      <Button
        onClick={handleLogin}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full text-lg font-bold shadow-lg"
      >
        {loading ? "Connexion..." : "Se connecter avec Google"}
      </Button>
    </div>
  );
}