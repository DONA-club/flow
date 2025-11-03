"use client";

import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSessionGroup } from "@/hooks/use-session-group";

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

  // JWT: décoder et inspecter l'issuer
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

function normalizeProviderFromIdentity(provider?: string | null): Provider | null {
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

async function saveCurrentProviderTokens(
  saveTokenFn: (provider: string, accessToken: string, refreshToken?: string, expiresAt?: string) => Promise<boolean>,
  isReady: boolean
) {
  // Attendre que le système soit prêt
  if (!isReady) {
    console.log("⏳ Système pas encore prêt, attente...");
    await new Promise(resolve => setTimeout(resolve, 500));
    return;
  }

  const { data } = await supabase.auth.getSession();
  const session: any = data?.session ?? null;
  const user = session?.user ?? null;
  if (!user) {
    console.log("⚠️ Pas d'utilisateur connecté");
    return;
  }

  const accessToken: string | null = session?.provider_token ?? null;
  const refreshToken: string | null = session?.provider_refresh_token ?? null;

  if (!accessToken) {
    console.warn("⚠️ Aucun provider_token dans la session");
    return;
  }

  // 1) Priorité absolue au provider en attente (défini au clic sur le bouton)
  const pendingProvider = (localStorage.getItem("pending_provider_connection") as Provider | null) ?? null;
  let providerToSave: Provider | null = null;

  if (pendingProvider && hasIdentity(user, pendingProvider)) {
    providerToSave = pendingProvider;
    console.log(`🎯 Provider prioritaire (pending): ${providerToSave}`);
  }

  // 2) Détection fiable via token (Google ya29, Microsoft via iss JWT)
  if (!providerToSave) {
    const detected = detectProviderFromToken(accessToken);
    if (detected && hasIdentity(user, detected)) {
      providerToSave = detected;
      console.log(`🔎 Provider détecté par token: ${providerToSave}`);
    }
  }

  if (!providerToSave) {
    console.warn("⚠️ Impossible de déterminer le provider pour l'upsert de tokens");
    return;
  }

  const expiresAtUnix: number | null = session?.expires_at ?? null;
  const expiresAtIso = expiresAtUnix ? new Date(expiresAtUnix * 1000).toISOString() : null;

  const success = await saveTokenFn(
    providerToSave,
    accessToken,
    refreshToken ?? undefined,
    expiresAtIso
  );

  if (success) {
    console.log(`✅ Tokens ${providerToSave} sauvegardés`);
    const pending = localStorage.getItem("pending_provider_connection");
    if (pending === providerToSave) {
      localStorage.removeItem("pending_provider_connection");
      toast.success(`${providerToSave} connecté avec succès !`, {
        description: "Vos données seront maintenant synchronisées.",
      });
    }
  } else {
    console.error(`❌ Erreur sauvegarde tokens ${providerToSave}`);
  }
}

const AuthTokensWatcher: React.FC = () => {
  const { saveToken, loading } = useSessionGroup();

  React.useEffect(() => {
    // Sauvegarde initiale
    const saveTokens = async () => {
      await saveCurrentProviderTokens(saveToken, !loading);
    };
    saveTokens();

    const { data } = supabase.auth.onAuthStateChange((event, _session) => {
      console.log(`🔐 Auth event: ${event}`);
      if (["SIGNED_IN", "TOKEN_REFRESHED", "USER_UPDATED"].includes(event)) {
        // Délai pour laisser le temps à la session de se mettre à jour
        setTimeout(() => {
          saveCurrentProviderTokens(saveToken, !loading);
        }, 800);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [saveToken, loading]);

  return null;
};

export default AuthTokensWatcher;