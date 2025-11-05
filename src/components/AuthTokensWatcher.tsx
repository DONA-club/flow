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
  if (!isValidJWT(accessToken)) return null;

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

function captureTokensFromUrl(): { accessToken: string | null; refreshToken: string | null; provider: Provider | null } {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const providerToken = params.get('provider_token');
  const providerRefreshToken = params.get('provider_refresh_token');
  
  const finalAccessToken = providerToken || accessToken;
  const finalRefreshToken = providerRefreshToken || refreshToken;
  
  if (!finalAccessToken) return { accessToken: null, refreshToken: null, provider: null };
  
  const provider = detectProviderFromToken(finalAccessToken);
  
  return { 
    accessToken: finalAccessToken, 
    refreshToken: finalRefreshToken, 
    provider 
  };
}

async function saveProviderTokens() {
  const { data } = await supabase.auth.getSession();
  const session: any = data?.session ?? null;
  const user = session?.user ?? null;
  
  if (!user) return;

  // Récupérer le provider en attente
  const pendingProvider = localStorage.getItem("pending_provider_connection") as Provider | null;

  let accessToken: string | null = session?.provider_token ?? null;
  let refreshToken: string | null = session?.provider_refresh_token ?? null;

  if (!accessToken) {
    const urlTokens = captureTokensFromUrl();
    if (urlTokens.accessToken) {
      accessToken = urlTokens.accessToken;
      refreshToken = urlTokens.refreshToken;
    }
  }

  if (!accessToken || !isValidJWT(accessToken)) {
    // Vérifier si l'utilisateur a des identities sans tokens
    const identities = user.identities || [];
    const googleIdentity = identities.find((i: any) => i.provider === "google");
    const microsoftIdentity = identities.find((i: any) => ["azure", "microsoft", "azure-oidc"].includes(i.provider));

    // Vérifier si on a déjà les tokens en base
    const { data: existingTokens } = await supabase
      .from("oauth_tokens")
      .select("provider")
      .eq("user_id", user.id);

    const existingProviders = new Set(existingTokens?.map(t => t.provider) || []);

    // Si Google est connecté mais n'a pas de token, forcer la reconnexion
    if (googleIdentity && !existingProviders.has("google")) {
      if (pendingProvider !== "google") {
        toast.info("Reconnexion Google nécessaire", {
          description: "Cliquez sur le logo Google pour obtenir les permissions.",
        });
      }
    }

    // Si Microsoft est connecté mais n'a pas de token, forcer la reconnexion
    if (microsoftIdentity && !existingProviders.has("microsoft")) {
      if (pendingProvider !== "microsoft") {
        toast.info("Reconnexion Microsoft nécessaire", {
          description: "Cliquez sur le logo Microsoft pour obtenir les permissions.",
        });
      }
    }

    return;
  }

  let providerToSave: Provider | null = null;

  // IMPORTANT : Utiliser UNIQUEMENT le provider en attente si disponible
  if (pendingProvider) {
    providerToSave = pendingProvider;
  } else {
    // Sinon, détecter depuis le token
    const detected = detectProviderFromToken(accessToken);
    if (detected) {
      providerToSave = detected;
    } else {
      const identityProvider = await detectProviderFromIdentities(user);
      if (identityProvider) {
        providerToSave = identityProvider;
      }
    }
  }

  if (!providerToSave) return;

  // Vérifier que le token correspond bien au provider attendu
  const tokenProvider = detectProviderFromToken(accessToken);
  if (pendingProvider && tokenProvider && tokenProvider !== pendingProvider) {
    console.warn(`⚠️ Token provider mismatch: expected ${pendingProvider}, got ${tokenProvider}`);
    // Ne pas sauvegarder si le provider ne correspond pas
    return;
  }

  const { data: existingToken } = await supabase
    .from("oauth_tokens")
    .select("access_token, refresh_token")
    .eq("user_id", user.id)
    .eq("provider", providerToSave)
    .maybeSingle();

  if (existingToken && !pendingProvider) return;

  const expiresAtUnix: number | null = session?.expires_at ?? null;
  const expiresAtIso = expiresAtUnix ? new Date(expiresAtUnix * 1000).toISOString() : null;

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
    console.error(`❌ Erreur sauvegarde token ${providerToSave}:`, error);
    return;
  }
  
  if (pendingProvider === providerToSave) {
    localStorage.removeItem("pending_provider_connection");
    toast.success(`${providerToSave} connecté avec succès !`, {
      description: "Vos données seront maintenant synchronisées.",
    });
  }
  
  if (window.location.hash) {
    window.history.replaceState(null, '', window.location.pathname);
  }
}

const AuthTokensWatcher: React.FC = () => {
  const hasRunInitialSave = React.useRef(false);

  React.useEffect(() => {
    if (!hasRunInitialSave.current) {
      hasRunInitialSave.current = true;
      saveProviderTokens();
    }

    const { data } = supabase.auth.onAuthStateChange((event, _session) => {
      if (["SIGNED_IN", "TOKEN_REFRESHED", "USER_UPDATED"].includes(event)) {
        setTimeout(() => {
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