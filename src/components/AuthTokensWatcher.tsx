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

// Nouvelle fonction pour forcer la récupération des tokens via une nouvelle connexion
async function forceTokenRefresh(provider: Provider) {
  const config: Record<Provider, { supabaseProvider: string; scopes?: string; queryParams?: Record<string, string> }> = {
    google: {
      supabaseProvider: "google",
      scopes: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/fitness.sleep.read",
      queryParams: {
        prompt: "consent",
        access_type: "offline",
        include_granted_scopes: "true",
      },
    },
    microsoft: {
      supabaseProvider: "azure",
      scopes: "https://graph.microsoft.com/Calendars.Read offline_access openid profile email",
      queryParams: { prompt: "consent" },
    },
    apple: { supabaseProvider: "apple" },
    facebook: { supabaseProvider: "facebook" },
    amazon: { supabaseProvider: "amazon" },
  };

  const providerConfig = config[provider];
  if (!providerConfig) return;

  localStorage.setItem("pending_provider_connection", provider);

  const options: any = {
    redirectTo: window.location.origin,
    skipBrowserRedirect: false,
  };

  if (providerConfig.scopes) {
    options.scopes = providerConfig.scopes;
  }

  if (providerConfig.queryParams) {
    options.queryParams = providerConfig.queryParams;
  }

  await supabase.auth.linkIdentity({
    provider: providerConfig.supabaseProvider as any,
    options
  } as any);
}

async function saveProviderTokens() {
  const { data } = await supabase.auth.getSession();
  const session: any = data?.session ?? null;
  const user = session?.user ?? null;
  
  if (!user) return;

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
      const pendingProvider = localStorage.getItem("pending_provider_connection");
      if (pendingProvider !== "google") {
        toast.info("Reconnexion Google nécessaire", {
          description: "Cliquez sur le logo Google pour obtenir les permissions.",
        });
      }
    }

    // Si Microsoft est connecté mais n'a pas de token, forcer la reconnexion
    if (microsoftIdentity && !existingProviders.has("microsoft")) {
      const pendingProvider = localStorage.getItem("pending_provider_connection");
      if (pendingProvider !== "microsoft") {
        toast.info("Reconnexion Microsoft nécessaire", {
          description: "Cliquez sur le logo Microsoft pour obtenir les permissions.",
        });
      }
    }

    return;
  }

  const pendingProvider = localStorage.getItem("pending_provider_connection") as Provider | null;
  let providerToSave: Provider | null = null;

  if (pendingProvider) {
    providerToSave = pendingProvider;
  }

  if (!providerToSave) {
    const detected = detectProviderFromToken(accessToken);
    if (detected) {
      providerToSave = detected;
    }
  }

  if (!providerToSave) {
    const identityProvider = await detectProviderFromIdentities(user);
    if (identityProvider) {
      providerToSave = identityProvider;
    }
  }

  if (!providerToSave) return;

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

  if (error) return;
  
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