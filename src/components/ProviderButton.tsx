"use client";

import React from "react";
import BrandIcon from "@/components/BrandIcon";
import SocialAuthIconButton from "@/components/SocialAuthIconButton";
import { useMultiProviderAuth, Provider } from "@/hooks/use-multi-provider-auth";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  provider: Provider;
  className?: string;
};

const PROVIDER_LABELS: Record<Provider, string> = {
  google: "Google",
  microsoft: "Microsoft",
  apple: "Apple",
  facebook: "Facebook",
  amazon: "Amazon",
};

function isValidJWT(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  return parts.length === 3;
}

async function saveCurrentSessionTokens() {
  const { data } = await supabase.auth.getSession();
  const session: any = data?.session ?? null;
  const user = session?.user ?? null;
  
  if (!user) return;

  const accessToken: string | null = session?.provider_token ?? null;
  const refreshToken: string | null = session?.provider_refresh_token ?? null;

  console.log("🔑 saveCurrentSessionTokens - Tokens:", {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken
  });

  if (!accessToken) return;

  // Valider le token avant de le sauvegarder
  if (!isValidJWT(accessToken)) {
    console.warn("⚠️ Token invalide détecté, ignoré:", accessToken.substring(0, 20) + "...");
    return;
  }

  const identities = user.identities || [];
  let currentProvider: string | null = null;

  for (const identity of identities) {
    const provider = identity.provider?.toLowerCase();
    console.log("🔍 Identity provider:", provider);
    
    if (provider === "google" || provider === "azure" || provider === "microsoft" || 
        provider === "apple" || provider === "facebook" || provider === "amazon") {
      
      if (provider === "azure" || provider === "microsoft") {
        currentProvider = "microsoft";
      } else {
        currentProvider = provider;
      }
      
      console.log("✅ Provider détecté:", currentProvider);
      
      const { data: existing } = await supabase
        .from("oauth_tokens")
        .select("provider")
        .eq("user_id", user.id)
        .eq("provider", currentProvider)
        .maybeSingle();

      if (!existing) {
        const expiresAtUnix: number | null = session?.expires_at ?? null;
        const expiresAtIso = expiresAtUnix ? new Date(expiresAtUnix * 1000).toISOString() : null;

        console.log("💾 Sauvegarde des tokens pour:", currentProvider);

        const { error } = await supabase
          .from("oauth_tokens")
          .upsert({
            user_id: user.id,
            provider: currentProvider,
            access_token: accessToken,
            refresh_token: refreshToken ?? undefined,
            expires_at: expiresAtIso,
            updated_at: new Date().toISOString()
          }, {
            onConflict: "user_id,provider"
          });

        if (error) {
          console.error("❌ Erreur sauvegarde:", error);
        } else {
          console.log("✅ Tokens sauvegardés avec succès");
        }

        break;
      }
    }
  }
}

const ProviderButton: React.FC<Props> = ({ provider, className }) => {
  const { connectedProviders, connectProvider } = useMultiProviderAuth();
  const [loading, setLoading] = React.useState(false);

  const isConnected = connectedProviders[provider];
  const label = PROVIDER_LABELS[provider];

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);

    console.log("🔘 Clic sur provider:", provider);
    await saveCurrentSessionTokens();
    await connectProvider(provider);
  };

  return (
    <div className="relative">
      <SocialAuthIconButton
        onClick={handleClick}
        disabled={loading}
        ariaLabel={`Se connecter avec ${label}`}
        title={isConnected ? `Reconnecter ${label}` : `Se connecter avec ${label}`}
        className={[
          className || "",
          isConnected ? "ring-2 ring-green-400 ring-offset-2" : "",
          loading ? "opacity-50" : "",
        ]
          .join(" ")
          .trim()}
      >
        {loading ? (
          <Loader2 className="w-8 h-8 animate-spin" />
        ) : (
          <BrandIcon name={provider === "microsoft" ? "outlook" : provider} />
        )}
      </SocialAuthIconButton>
      {isConnected && !loading && (
        <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
};

export default ProviderButton;