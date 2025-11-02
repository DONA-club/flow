"use client";

import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function detectProviderFromToken(accessToken: string): "google" | "microsoft" | null {
  // Google tokens commencent par "ya29."
  if (accessToken.startsWith("ya29.")) {
    return "google";
  }
  // Microsoft tokens sont des JWT (commencent par "eyJ")
  if (accessToken.startsWith("eyJ")) {
    return "microsoft";
  }
  return null;
}

function normalizeProviderFromIdentity(provider?: string | null): "google" | "microsoft" | "apple" | "facebook" | "amazon" | null {
  if (!provider) return null;
  const v = provider.toLowerCase();
  if (v === "google") return "google";
  if (v === "azure" || v === "azure-oidc" || v === "azuread" || v === "microsoft" || v === "outlook") {
    return "microsoft";
  }
  if (v === "apple") return "apple";
  if (v === "facebook") return "facebook";
  if (v === "amazon") return "amazon";
  return null;
}

async function saveCurrentProviderTokens() {
  const { data } = await supabase.auth.getSession();
  const session: any = data?.session ?? null;
  const user = session?.user ?? null;
  if (!user) {
    console.log("⚠️ Pas d'utilisateur connecté");
    return;
  }

  // Tokens fournis par Supabase
  const accessToken: string | null = session?.provider_token ?? null;
  const refreshToken: string | null = session?.provider_refresh_token ?? null;

  if (!accessToken) {
    console.warn("⚠️ Aucun access_token dans la session");
    return;
  }

  // Détecter le provider depuis le format du token
  const detectedProvider = detectProviderFromToken(accessToken);
  
  if (!detectedProvider) {
    console.warn("⚠️ Impossible de détecter le provider depuis le token");
    return;
  }

  console.log(`✅ Provider détecté: ${detectedProvider}`);

  // Vérifier que le provider détecté correspond à une identité de l'utilisateur
  const identities = user.identities || [];
  const hasIdentity = identities.some((i: any) => {
    const normalized = normalizeProviderFromIdentity(i.provider);
    return normalized === detectedProvider;
  });

  if (!hasIdentity) {
    console.warn(`⚠️ Le provider ${detectedProvider} n'est pas dans les identités de l'utilisateur`);
    return;
  }

  // Estimation d'expiration
  const expiresAtUnix: number | null = session?.expires_at ?? null;
  const expiresAtIso = expiresAtUnix ? new Date(expiresAtUnix * 1000).toISOString() : null;

  // Upsert sur (user_id, provider)
  const { error } = await supabase.from("oauth_tokens").upsert(
    {
      user_id: user.id,
      provider: detectedProvider,
      access_token: accessToken,
      refresh_token: refreshToken ?? undefined,
      expires_at: expiresAtIso,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" }
  );

  if (error) {
    console.error(`❌ Erreur sauvegarde tokens ${detectedProvider}:`, error);
  } else {
    console.log(`✅ Tokens ${detectedProvider} sauvegardés pour user ${user.id}`);
    
    // Vérifier si c'était une connexion en attente
    const pendingProvider = localStorage.getItem("pending_provider_connection");
    if (pendingProvider === detectedProvider) {
      localStorage.removeItem("pending_provider_connection");
      toast.success(`${detectedProvider} connecté avec succès !`, {
        description: "Vos données seront maintenant synchronisées.",
      });
    }
  }
}

const AuthTokensWatcher: React.FC = () => {
  React.useEffect(() => {
    // Sauvegarde initiale si on arrive déjà authentifié
    saveCurrentProviderTokens();

    const { data } = supabase.auth.onAuthStateChange((event, _session) => {
      console.log(`🔐 Auth event: ${event}`);
      
      // Sur tout rafraîchissement de session, tentative de sauvegarde
      if (["SIGNED_IN", "TOKEN_REFRESHED", "USER_UPDATED"].includes(event)) {
        // Petit délai pour laisser la session se stabiliser
        setTimeout(() => {
          saveCurrentProviderTokens();
        }, 500);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  return null;
};

export default AuthTokensWatcher;