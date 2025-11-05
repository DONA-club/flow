"use client";

import React from "react";
import { supabase } from "@/integrations/supabase/client";

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

function isValidGoogleToken(token: string): boolean {
  return token && typeof token === 'string' && token.startsWith('ya29.');
}

function detectProviderFromToken(accessToken: string): Provider | null {
  if (accessToken.startsWith("ya29.")) return "google";

  if (isValidJWT(accessToken)) {
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

function emitLog(message: string, type: "info" | "success" | "error" = "info") {
  window.dispatchEvent(new CustomEvent("app-log", { detail: { message, type } }));
}

async function clearInvalidMicrosoftTokens() {
  const { data: sess } = await supabase.auth.getSession();
  const userId = sess?.session?.user?.id;
  if (!userId) return;

  await supabase
    .from("oauth_tokens")
    .delete()
    .eq("user_id", userId)
    .eq("provider", "microsoft");
}

async function saveProviderTokens() {
  const { data } = await supabase.auth.getSession();
  const session: any = data?.session ?? null;
  const user = session?.user ?? null;
  
  if (!user) return;

  let pendingProvider = localStorage.getItem("pending_provider_connection") as Provider | null;
  if (!pendingProvider) {
    pendingProvider = sessionStorage.getItem("pending_provider_connection") as Provider | null;
  }

  let accessToken: string | null = null;
  let refreshToken: string | null = null;
  let tokenSource: string = "";

  const urlTokens = captureTokensFromUrl();
  if (urlTokens.accessToken) {
    accessToken = urlTokens.accessToken;
    refreshToken = urlTokens.refreshToken;
    tokenSource = "url";
  }

  if (!accessToken && session?.provider_token) {
    accessToken = session.provider_token;
    refreshToken = session.provider_refresh_token;
    tokenSource = "session";
  }

  if (pendingProvider && tokenSource === "session") {
    const sessionTokenProvider = detectProviderFromToken(accessToken!);
    if (sessionTokenProvider && sessionTokenProvider !== pendingProvider) {
      if (!urlTokens.accessToken) {
        return;
      }
    }
  }

  if (!accessToken) {
    const identities = user.identities || [];
    
    for (const identity of identities) {
      const idProvider = identity.provider?.toLowerCase();
      
      let mappedProvider: Provider | null = null;
      if (idProvider === "google") mappedProvider = "google";
      else if (["azure", "microsoft", "azure-oidc"].includes(idProvider)) mappedProvider = "microsoft";
      else if (idProvider === "apple") mappedProvider = "apple";
      else if (idProvider === "facebook") mappedProvider = "facebook";
      else if (idProvider === "amazon") mappedProvider = "amazon";
      
      if (mappedProvider && (!pendingProvider || mappedProvider === pendingProvider)) {
        const { data: existingToken } = await supabase
          .from("oauth_tokens")
          .select("access_token")
          .eq("user_id", user.id)
          .eq("provider", mappedProvider)
          .maybeSingle();
        
        if (!existingToken) {
          if (!pendingProvider) {
            pendingProvider = mappedProvider;
          }
        }
      }
    }
  }

  const isValid = accessToken && (isValidJWT(accessToken) || isValidGoogleToken(accessToken));
  
  if (!isValid) {
    if (pendingProvider) {
      emitLog(`Reconnexion ${pendingProvider} nécessaire`, "info");
      localStorage.removeItem("pending_provider_connection");
      sessionStorage.removeItem("pending_provider_connection");
    }
    return;
  }

  let providerToSave: Provider | null = pendingProvider;
  
  if (!providerToSave) {
    providerToSave = detectProviderFromToken(accessToken);
  }

  if (!providerToSave) {
    return;
  }

  if (pendingProvider) {
    const tokenProvider = detectProviderFromToken(accessToken);
    if (tokenProvider && tokenProvider !== pendingProvider) {
      emitLog(`Erreur connexion ${pendingProvider}`, "error");
      
      localStorage.removeItem("pending_provider_connection");
      sessionStorage.removeItem("pending_provider_connection");
      return;
    }
  }

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
    return;
  }
  
  localStorage.removeItem("pending_provider_connection");
  sessionStorage.removeItem("pending_provider_connection");
  
  emitLog(`${providerToSave} connecté`, "success");
  
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