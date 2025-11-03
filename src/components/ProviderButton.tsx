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

// Fonction pour sauvegarder les tokens de la session actuelle AVANT de se connecter à un autre provider
async function saveCurrentSessionTokens() {
  const { data } = await supabase.auth.getSession();
  const session: any = data?.session ?? null;
  const user = session?.user ?? null;
  
  if (!user) {
    console.log("⚠️ ProviderButton: Pas d'utilisateur pour sauvegarder les tokens actuels");
    return;
  }

  const accessToken: string | null = session?.provider_token ?? null;
  const refreshToken: string | null = session?.provider_refresh_token ?? null;

  if (!accessToken) {
    console.log("⚠️ ProviderButton: Pas de provider_token dans la session actuelle");
    return;
  }

  // Détecter le provider actuel depuis les identités
  const identities = user.identities || [];
  let currentProvider: string | null = null;

  // Chercher le provider qui correspond au token actuel
  for (const identity of identities) {
    const provider = identity.provider?.toLowerCase();
    if (provider === "google" || provider === "azure" || provider === "microsoft" || 
        provider === "apple" || provider === "facebook" || provider === "amazon") {
      
      // Normaliser le provider
      if (provider === "azure" || provider === "microsoft") {
        currentProvider = "microsoft";
      } else {
        currentProvider = provider;
      }
      
      // Vérifier si on a déjà ce token en base
      const { data: existing } = await supabase
        .from("oauth_tokens")
        .select("provider")
        .eq("user_id", user.id)
        .eq("provider", currentProvider)
        .maybeSingle();

      if (!existing) {
        console.log(`💾 ProviderButton: Sauvegarde préventive des tokens ${currentProvider} avant nouvelle connexion`);
        
        const expiresAtUnix: number | null = session?.expires_at ?? null;
        const expiresAtIso = expiresAtUnix ? new Date(expiresAtUnix * 1000).toISOString() : null;

        await supabase
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

        console.log(`✅ ProviderButton: Tokens ${currentProvider} sauvegardés avec succès`);
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

    // IMPORTANT: Sauvegarder les tokens de la session actuelle AVANT de se connecter au nouveau provider
    console.log(`🔄 ProviderButton: Sauvegarde préventive avant connexion à ${provider}`);
    await saveCurrentSessionTokens();

    // Maintenant on peut se connecter au nouveau provider
    await connectProvider(provider);
    // Ne pas remettre loading à false car on va être redirigé
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