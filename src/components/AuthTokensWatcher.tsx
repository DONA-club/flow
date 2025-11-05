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

  // Google tokens commencent par ya29.
  if (accessToken.startsWith("ya29.")) return "google";

  // Pour les JWT, vérifier l'issuer
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

function captureTokensFromUrl(): { accessToken: string | null; refreshToken: string | null } {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const providerToken = params.get('provider_token');
  const providerRefreshToken = params.get('provider_refresh_token');
  
  return { 
    accessToken: providerToken || accessToken, 
    refreshToken: providerRefreshToken || refreshToken
  };
}

async function saveProviderTokens() {
  console.log("🔍 Début saveProviderTokens");
  
  const { data } = await supabase.auth.getSession();
  const session: any = data?.session ?? null;
  const user = session?.user ?? null;
  
  if (!user) {
    console.log("❌ Pas d'utilisateur connecté");
    return;
  }

  console.log("✅ Utilisateur connecté:", user.email);

  // Récupérer le provider en attente depuis localStorage ET sessionStorage
  let pendingProvider = localStorage.getItem("pending_provider_connection") as Provider | null;
  if (!pendingProvider) {
    pendingProvider = sessionStorage.getItem("pending_provider_connection") as Provider | null;
  }
  
  console.log("🎯 Provider en attente:", pendingProvider);

  // Essayer de capturer les tokens depuis plusieurs sources
  let accessToken: string | null = null;
  let refreshToken: string | null = null;

  // Source 1: session.provider_token
  if (session?.provider_token) {
    console.log("📍 Tokens trouvés dans session.provider_token");
    accessToken = session.provider_token;
    refreshToken = session.provider_refresh_token;
  }

  // Source 2: URL hash
  if (!accessToken) {
    const urlTokens = captureTokensFromUrl();
    if (urlTokens.accessToken) {
      console.log("📍 Tokens trouvés dans l'URL");
      accessToken = urlTokens.accessToken;
      refreshToken = urlTokens.refreshToken;
    }
  }

  // Source 3: Identities (pour les tokens stockés par Supabase)
  if (!accessToken) {
    const identities = user.identities || [];
    console.log("📍 Vérification des identities:", identities.length);
    
    for (const identity of identities) {
      const idProvider = identity.provider?.toLowerCase();
      console.log("  - Identity provider:", idProvider);
      
      // Mapper les providers
      let mappedProvider: Provider | null = null;
      if (idProvider === "google") mappedProvider = "google";
      else if (["azure", "microsoft", "azure-oidc"].includes(idProvider)) mappedProvider = "microsoft";
      else if (idProvider === "apple") mappedProvider = "apple";
      else if (idProvider === "facebook") mappedProvider = "facebook";
      else if (idProvider === "amazon") mappedProvider = "amazon";
      
      if (mappedProvider && (!pendingProvider || mappedProvider === pendingProvider)) {
        // Vérifier si on a déjà ce token en base
        const { data: existingToken } = await supabase
          .from("oauth_tokens")
          .select("access_token")
          .eq("user_id", user.id)
          .eq("provider", mappedProvider)
          .maybeSingle();
        
        if (!existingToken) {
          console.log(`  ⚠️ ${mappedProvider} identity trouvée mais pas de token en base`);
          // Si on n'a pas de pending provider, on le définit maintenant
          if (!pendingProvider) {
            pendingProvider = mappedProvider;
            console.log(`  🎯 Pending provider défini sur: ${mappedProvider}`);
          }
        }
      }
    }
  }

  if (!accessToken || !isValidJWT(accessToken)) {
    console.warn("⚠️ Pas de token valide trouvé");
    
    // Si on a un pending provider mais pas de token, demander à l'utilisateur de reconnecter
    if (pendingProvider) {
      toast.info(`Reconnexion ${pendingProvider} nécessaire`, {
        description: "Cliquez à nouveau sur le logo pour obtenir les permissions.",
      });
      localStorage.removeItem("pending_provider_connection");
      sessionStorage.removeItem("pending_provider_connection");
    }
    return;
  }

  console.log("✅ Token valide trouvé");

  // Détecter le provider depuis le token si pas de pending provider
  let providerToSave: Provider | null = pendingProvider;
  
  if (!providerToSave) {
    providerToSave = detectProviderFromToken(accessToken);
    console.log("🔍 Provider détecté depuis le token:", providerToSave);
  }

  if (!providerToSave) {
    console.error("❌ Impossible de déterminer le provider");
    return;
  }

  // Vérifier que le token correspond au provider attendu
  if (pendingProvider) {
    const tokenProvider = detectProviderFromToken(accessToken);
    if (tokenProvider && tokenProvider !== pendingProvider) {
      console.warn(`⚠️ Token provider mismatch: expected ${pendingProvider}, got ${tokenProvider}`);
      // Ne pas bloquer, utiliser le provider du token
      providerToSave = tokenProvider;
    }
  }

  console.log(`💾 Sauvegarde du token pour ${providerToSave}`);

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
  
  console.log(`✅ Token ${providerToSave} sauvegardé avec succès`);
  
  localStorage.removeItem("pending_provider_connection");
  sessionStorage.removeItem("pending_provider_connection");
  
  toast.success(`${providerToSave} connecté avec succès !`, {
    description: "Vos données seront maintenant synchronisées.",
  });
  
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
      console.log("🔔 Auth state change:", event);
      
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