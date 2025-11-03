"use client";

import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Provider = "google" | "microsoft";

function detectProviderFromToken(accessToken: string): Provider | null {
  // On ne classe plus 'eyJ' en Microsoft (ambigu: peut être un id_token Google)
  if (accessToken.startsWith("ya29.")) return "google";
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

function hasIdentity(user: any, provider: Provider) {
  const identities = user?.identities || [];
  return identities.some((i: any) => normalizeProviderFromIdentity(i.provider) === provider);
}

function pickSingleIdentityProvider(user: any): Provider | null {
  const identities = user?.identities || [];
  const normalized = identities
    .map((i: any) => normalizeProviderFromIdentity(i.provider))
    .filter((p) => p === "google" || p === "microsoft") as Provider[];
  const unique = Array.from(new Set(normalized));
  if (unique.length === 1) return unique[0] as Provider;
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

  // Tokens fournis par Supabase (du provider courant)
  const accessToken: string | null = session?.provider_token ?? null;
  const refreshToken: string | null = session?.provider_refresh_token ?? null;

  if (!accessToken) {
    console.warn("⚠️ Aucun provider_token dans la session");
    return;
  }

  // 1) Si un provider est en attente (on vient de cliquer sur un bouton), on le privilégie
  const pendingProvider = (localStorage.getItem("pending_provider_connection") as Provider | null) ?? null;
  let providerToSave: Provider | null = null;

  if (pendingProvider && hasIdentity(user, pendingProvider)) {
    providerToSave = pendingProvider;
    console.log(`🎯 Provider prioritaire (pending): ${providerToSave}`);
  }

  // 2) Sinon, tenter la détection par token (Google "ya29.")
  if (!providerToSave) {
    const detected = detectProviderFromToken(accessToken);
    if (detected && hasIdentity(user, detected)) {
      providerToSave = detected;
      console.log(`🔎 Provider détecté par token: ${providerToSave}`);
    }
  }

  // 3) Sinon, si une seule identité pertinente, on la prend
  if (!providerToSave) {
    const single = pickSingleIdentityProvider(user);
    if (single) {
      providerToSave = single;
      console.log(`🧩 Provider déduit par identité unique: ${providerToSave}`);
    }
  }

  if (!providerToSave) {
    console.warn("⚠️ Impossible de déterminer le provider pour l’upsert de tokens");
    return;
  }

  // Estimation d'expiration
  const expiresAtUnix: number | null = session?.expires_at ?? null;
  const expiresAtIso = expiresAtUnix ? new Date(expiresAtUnix * 1000).toISOString() : null;

  // Upsert sur (user_id, provider)
  const { error } = await supabase.from("oauth_tokens").upsert(
    {
      user_id: user.id,
      provider: providerToSave,
      access_token: accessToken,
      refresh_token: refreshToken ?? undefined,
      expires_at: expiresAtIso,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" }
  );

  if (error) {
    console.error(`❌ Erreur sauvegarde tokens ${providerToSave}:`, error);
  } else {
    console.log(`✅ Tokens ${providerToSave} sauvegardés pour user ${user.id}`);
    
    // Confirmation si c'était une connexion en attente
    const pending = localStorage.getItem("pending_provider_connection");
    if (pending === providerToSave) {
      localStorage.removeItem("pending_provider_connection");
      toast.success(`${providerToSave} connecté avec succès !`, {
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
      
      // Sur signin, refresh, ou update, tenter la sauvegarde
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