"use client";

import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Provider = "google" | "microsoft" | "apple" | "facebook" | "amazon";

function base64UrlDecode(input: string) {
  const s = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4;
  const padded = pad ? s + "=".repeat(4 - pad) : s;
  return atob(padded);
}

function getJwtClaims(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = base64UrlDecode(parts[1]);
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

function detectProviderFromToken(accessToken: string): Provider | null {
  // Access token Google typique
  if (accessToken.startsWith("ya29.")) return "google";

  // JWT: décoder et inspecer l'issuer
  if (accessToken.startsWith("eyJ")) {
    const claims = getJwtClaims(accessToken);
    const iss = (claims?.iss || "").toLowerCase();

    // Microsoft (Azure AD)
    if (
      iss.includes("login.microsoftonline.com") ||
      iss.includes("sts.windows.net")
    ) {
      return "microsoft";
    }

    // Google OpenID
    if (iss.includes("accounts.google.com")) {
      return "google";
    }

    // Apple
    if (iss.includes("appleid.apple.com")) {
      return "apple";
    }
  }

  return null;
}

async function saveProviderTokens() {
  const { data } = await supabase.auth.getSession();
  const session: any = data?.session ?? null;
  const user = session?.user ?? null;
  
  if (!user) {
    console.log("⚠️ AuthTokensWatcher: Pas d'utilisateur connecté");
    return;
  }

  const accessToken: string | null = session?.provider_token ?? null;
  const refreshToken: string | null = session?.provider_refresh_token ?? null;

  if (!accessToken) {
    console.warn("⚠️ AuthTokensWatcher: Aucun provider_token dans la session");
    return;
  }

  console.log("🔍 AuthTokensWatcher: Tokens détectés dans la session", {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    accessTokenPrefix: accessToken.substring(0, 10) + "...",
  });

  // 1) Priorité au provider en attente (défini au clic sur le bouton)
  const pendingProvider = localStorage.getItem("pending_provider_connection") as Provider | null;
  let providerToSave: Provider | null = null;

  if (pendingProvider) {
    providerToSave = pendingProvider;
    console.log(`🎯 AuthTokensWatcher: Provider prioritaire (pending): ${providerToSave}`);
  }

  // 2) Détection via token si pas de pending
  if (!providerToSave) {
    const detected = detectProviderFromToken(accessToken);
    if (detected) {
      providerToSave = detected;
      console.log(`🔎 AuthTokensWatcher: Provider détecté par token: ${providerToSave}`);
    }
  }

  if (!providerToSave) {
    console.warn("⚠️ AuthTokensWatcher: Impossible de déterminer le provider, abandon pour éviter d'écraser d'autres tokens");
    return;
  }

  // 3) Vérifier si ce provider a déjà des tokens enregistrés
  const { data: existingToken } = await supabase
    .from("oauth_tokens")
    .select("access_token, refresh_token")
    .eq("user_id", user.id)
    .eq("provider", providerToSave)
    .maybeSingle();

  // Si le provider a déjà des tokens ET qu'il n'y a pas de pending_provider_connection,
  // on ne fait rien pour éviter d'écraser avec des tokens d'un autre provider
  if (existingToken && !pendingProvider) {
    console.log(`⏭️ AuthTokensWatcher: ${providerToSave} a déjà des tokens et pas de pending, on ne fait rien`);
    return;
  }

  const expiresAtUnix: number | null = session?.expires_at ?? null;
  const expiresAtIso = expiresAtUnix ? new Date(expiresAtUnix * 1000).toISOString() : null;

  console.log(`💾 AuthTokensWatcher: Sauvegarde tokens ${providerToSave}...`);

  const { error } = await supabase
    .from("oauth_tokens")
    .upsert({
      user_id: user.id,
      provider: providerToSave,
      access_token: accessToken,
      refresh_token: refreshToken ?? undefined,
      expires_at: expiresAtIso,
      updated_at: new Date().toISOString()
    }, {
      onConflict: "user_id,provider"
    });

  if (error) {
    console.error(`❌ AuthTokensWatcher: Erreur sauvegarde tokens ${providerToSave}:`, error);
    return;
  }

  console.log(`✅ AuthTokensWatcher: Tokens ${providerToSave} sauvegardés avec succès`);
  
  if (pendingProvider === providerToSave) {
    localStorage.removeItem("pending_provider_connection");
    toast.success(`${providerToSave} connecté avec succès !`, {
      description: "Vos données seront maintenant synchronisées.",
    });
  }

  // Vérifier tous les tokens sauvegardés
  const { data: allTokens } = await supabase
    .from("oauth_tokens")
    .select("provider")
    .eq("user_id", user.id);

  console.log("📊 AuthTokensWatcher: Providers actuellement sauvegardés:", 
    allTokens?.map(t => t.provider).join(", ") || "aucun"
  );
}

const AuthTokensWatcher: React.FC = () => {
  const hasRunInitialSave = React.useRef(false);

  React.useEffect(() => {
    console.log("🚀 AuthTokensWatcher: Initialisation");

    // Sauvegarde initiale (une seule fois au montage)
    if (!hasRunInitialSave.current) {
      hasRunInitialSave.current = true;
      console.log("🔄 AuthTokensWatcher: Sauvegarde initiale...");
      saveProviderTokens();
    }

    const { data } = supabase.auth.onAuthStateChange((event, _session) => {
      console.log(`🔐 AuthTokensWatcher: Auth event: ${event}`);
      
      if (["SIGNED_IN", "TOKEN_REFRESHED", "USER_UPDATED"].includes(event)) {
        // Délai pour laisser le temps à la session de se mettre à jour
        console.log(`⏱️ AuthTokensWatcher: Attente 800ms avant sauvegarde (event: ${event})`);
        setTimeout(() => {
          saveProviderTokens();
        }, 800);
      }
    });

    return () => {
      console.log("🛑 AuthTokensWatcher: Nettoyage");
      data.subscription.unsubscribe();
    };
  }, []);

  return null;
};

export default AuthTokensWatcher;