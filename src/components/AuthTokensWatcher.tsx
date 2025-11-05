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
  const { data } = await supabase.auth.getSession();
  const session: any = data?.session ?? null;
  const user = session?.user ?? null;
  
  if (!user) return;

  // Récupérer le provider en attente
  const pendingProvider = localStorage.getItem("pending_provider_connection") as Provider | null;
  
  if (!pendingProvider) return;

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
    console.warn("⚠️ Pas de token valide trouvé");
    return;
  }

  // Vérifier que le token correspond bien au provider attendu
  const tokenProvider = detectProviderFromToken(accessToken);
  if (tokenProvider && tokenProvider !== pendingProvider) {
    console.warn(`⚠️ Token provider mismatch: expected ${pendingProvider}, got ${tokenProvider}`);
    return;
  }

  const expiresAtUnix: number | null = session?.expires_at ?? null;
  const expiresAtIso = expiresAtUnix ? new Date(expiresAtUnix * 1000).toISOString() : null;

  const { error } = await supabase
    .from("oauth_tokens")
    .upsert({
      user_id: user.id,
      provider: pendingProvider,
      access_token: accessToken,
      refresh_token: refreshToken ?? undefined,
      expires_at: expiresAtIso,
      updated_at: new Date().toISOString()
    }, {
      onConflict: "user_id,provider"
    });

  if (error) {
    console.error(`❌ Erreur sauvegarde token ${pendingProvider}:`, error);
    return;
  }
  
  localStorage.removeItem("pending_provider_connection");
  toast.success(`${pendingProvider} connecté avec succès !`, {
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