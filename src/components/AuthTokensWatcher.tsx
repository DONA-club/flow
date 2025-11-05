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

function isValidJWT(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  return parts.length === 3;
}

function detectProviderFromToken(accessToken: string): Provider | null {
  if (!isValidJWT(accessToken)) {
    console.warn("⚠️ Token invalide détecté dans detectProviderFromToken");
    return null;
  }

  if (accessToken.startsWith("ya29.")) return "google";

  if (accessToken.startsWith("eyJ")) {
    const claims = getJwtClaims(accessToken);
    const iss = (claims?.iss || "").toLowerCase();

    if (
      iss.includes("login.microsoftonline.com") ||
      iss.includes("sts.windows.net")
    ) {
      return "microsoft";
    }

    if (iss.includes("accounts.google.com")) {
      return "google";
    }

    if (iss.includes("appleid.apple.com")) {
      return "apple";
    }
  }

  return null;
}

async function detectProviderFromIdentities(user: any): Promise<Provider | null> {
  const identities = user?.identities || [];
  
  for (const identity of identities) {
    const provider = identity.provider?.toLowerCase();
    console.log("🔍 Identity provider détecté:", provider);
    
    if (provider === "azure" || provider === "microsoft" || provider === "azure-oidc") {
      return "microsoft";
    }
    if (provider === "google") return "google";
    if (provider === "apple") return "apple";
    if (provider === "facebook") return "facebook";
    if (provider === "amazon") return "amazon";
  }
  
  return null;
}

async function saveProviderTokens() {
  const { data } = await supabase.auth.getSession();
  const session: any = data?.session ?? null;
  const user = session?.user ?? null;
  
  if (!user) {
    console.log("❌ Pas d'utilisateur connecté");
    return;
  }

  const accessToken: string | null = session?.provider_token ?? null;
  const refreshToken: string | null = session?.provider_refresh_token ?? null;

  console.log("🔑 Tokens disponibles:", {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    accessTokenPreview: accessToken ? accessToken.substring(0, 20) + "..." : null
  });

  if (!accessToken) {
    console.log("❌ Pas de provider_token dans la session");
    return;
  }

  // Valider le token avant de continuer
  if (!isValidJWT(accessToken)) {
    console.warn("⚠️ Token invalide détecté, ignoré:", accessToken.substring(0, 20) + "...");
    return;
  }

  const pendingProvider = localStorage.getItem("pending_provider_connection") as Provider | null;
  let providerToSave: Provider | null = null;

  console.log("📋 Pending provider:", pendingProvider);

  if (pendingProvider) {
    providerToSave = pendingProvider;
    console.log("✅ Utilisation du pending provider:", providerToSave);
  }

  if (!providerToSave) {
    const detected = detectProviderFromToken(accessToken);
    if (detected) {
      providerToSave = detected;
      console.log("✅ Provider détecté depuis le token:", providerToSave);
    }
  }

  if (!providerToSave) {
    const identityProvider = await detectProviderFromIdentities(user);
    if (identityProvider) {
      providerToSave = identityProvider;
      console.log("✅ Provider détecté depuis les identities:", providerToSave);
    }
  }

  if (!providerToSave) {
    console.log("❌ Impossible de détecter le provider");
    return;
  }

  console.log("💾 Tentative de sauvegarde pour:", providerToSave);

  const { data: existingToken } = await supabase
    .from("oauth_tokens")
    .select("access_token, refresh_token")
    .eq("user_id", user.id)
    .eq("provider", providerToSave)
    .maybeSingle();

  if (existingToken && !pendingProvider) {
    console.log("ℹ️ Token déjà existant, pas de mise à jour nécessaire");
    return;
  }

  const expiresAtUnix: number | null = session?.expires_at ?? null;
  const expiresAtIso = expiresAtUnix ? new Date(expiresAtUnix * 1000).toISOString() : null;

  console.log("💾 Sauvegarde des tokens:", {
    provider: providerToSave,
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    expiresAt: expiresAtIso
  });

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
    console.error(`❌ Erreur sauvegarde tokens ${providerToSave}:`, error);
    return;
  }
  
  console.log(`✅ Tokens ${providerToSave} sauvegardés avec succès`);
  
  if (pendingProvider === providerToSave) {
    localStorage.removeItem("pending_provider_connection");
    toast.success(`${providerToSave} connecté avec succès !`, {
      description: "Vos données seront maintenant synchronisées.",
    });
  }
}

const AuthTokensWatcher: React.FC = () => {
  const hasRunInitialSave = React.useRef(false);

  React.useEffect(() => {
    if (!hasRunInitialSave.current) {
      hasRunInitialSave.current = true;
      console.log("🚀 AuthTokensWatcher: Sauvegarde initiale");
      saveProviderTokens();
    }

    const { data } = supabase.auth.onAuthStateChange((event, _session) => {
      console.log("🔄 Auth state changed:", event);
      if (["SIGNED_IN", "TOKEN_REFRESHED", "USER_UPDATED"].includes(event)) {
        setTimeout(() => {
          console.log("🚀 AuthTokensWatcher: Sauvegarde après", event);
          saveProviderTokens();
        }, 800);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  return null;
};

export default AuthTokensWatcher;