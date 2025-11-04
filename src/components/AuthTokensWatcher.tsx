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

async function saveProviderTokens() {
  const { data } = await supabase.auth.getSession();
  const session: any = data?.session ?? null;
  const user = session?.user ?? null;
  
  if (!user) return;

  const accessToken: string | null = session?.provider_token ?? null;
  const refreshToken: string | null = session?.provider_refresh_token ?? null;

  if (!accessToken) return;

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

  if (error) {
    console.error(`❌ Erreur sauvegarde tokens ${providerToSave}:`, error);
    return;
  }
  
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