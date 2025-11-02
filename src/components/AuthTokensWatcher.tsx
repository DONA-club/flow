"use client";

import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function normalizeProvider(p?: string | null): "google" | "microsoft" | "apple" | "facebook" | "amazon" | null {
  if (!p) return null;
  const v = p.toLowerCase();
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
  if (!user) return;

  const provider = normalizeProvider(user?.app_metadata?.provider ?? null);
  if (!provider) return;

  // Tokens fournis par Supabase pour le provider ACTIF uniquement
  const accessToken: string | null = session?.provider_token ?? null;
  const refreshToken: string | null = session?.provider_refresh_token ?? null;

  // Si aucun token, rien à sauvegarder
  if (!accessToken && !refreshToken) {
    console.warn(`⚠️ Aucun token disponible pour ${provider}`);
    return;
  }

  // Estimation d'expiration
  const expiresAtUnix: number | null = session?.expires_at ?? null;
  const expiresAtIso = expiresAtUnix ? new Date(expiresAtUnix * 1000).toISOString() : null;

  // Upsert sur (user_id, provider)
  const { error } = await supabase.from("oauth_tokens").upsert(
    {
      user_id: user.id,
      provider,
      access_token: accessToken ?? undefined,
      refresh_token: refreshToken ?? undefined,
      expires_at: expiresAtIso ? expiresAtIso : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" }
  );

  if (error) {
    console.error(`❌ Erreur sauvegarde tokens ${provider}:`, error);
  } else {
    console.log(`✅ Tokens ${provider} sauvegardés pour user ${user.id}`);
    
    // Vérifier si c'était une connexion en attente
    const pendingProvider = localStorage.getItem("pending_provider_connection");
    if (pendingProvider === provider) {
      localStorage.removeItem("pending_provider_connection");
      toast.success(`${provider} connecté avec succès !`, {
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
        saveCurrentProviderTokens();
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  return null;
};

export default AuthTokensWatcher;