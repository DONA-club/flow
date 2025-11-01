"use client";

import React from "react";
import { supabase } from "@/integrations/supabase/client";

function normalizeProvider(p?: string | null): "google" | "microsoft" | null {
  if (!p) return null;
  const v = p.toLowerCase();
  if (v === "google") return "google";
  if (v === "azure" || v === "azure-oidc" || v === "azuread" || v === "microsoft" || v === "outlook") {
    return "microsoft";
  }
  return null;
}

async function saveCurrentProviderTokens() {
  const { data } = await supabase.auth.getSession();
  const session: any = data?.session ?? null;
  const user = session?.user ?? null;
  if (!user) return;

  const provider = normalizeProvider(user?.app_metadata?.provider ?? null);
  if (!provider) return;

  // Tokens fournis par Supabase pour le provider ACTIF uniquement
  const accessToken: string | null = session?.provider_token ?? null;
  const refreshToken: string | null = session?.provider_refresh_token ?? null;

  // Si aucun token, rien à sauvegarder
  if (!accessToken && !refreshToken) return;

  // Estimation d’expiration: on utilise session.expires_at si dispo
  // (Unix seconds) pour calculer expires_at côté DB
  const expiresAtUnix: number | null = session?.expires_at ?? null;
  const expiresAtIso = expiresAtUnix ? new Date(expiresAtUnix * 1000).toISOString() : null;

  // Scope inconnu côté session → on le laisse tel quel si on met à jour, sinon null
  // On upsert sur (user_id, provider)
  await supabase.from("oauth_tokens").upsert(
    {
      user_id: user.id,
      provider,
      access_token: accessToken ?? undefined,
      refresh_token: refreshToken ?? undefined,
      scope: undefined,
      expires_at: expiresAtIso ? expiresAtIso : null,
    },
    { onConflict: "user_id,provider" }
  );
}

const AuthTokensWatcher: React.FC = () => {
  React.useEffect(() => {
    // Sauvegarde initiale si on arrive déjà authentifié
    saveCurrentProviderTokens();

    const { data } = supabase.auth.onAuthStateChange((_event, _session) => {
      // Sur tout rafraîchissement de session, tentative de sauvegarde
      // SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED nous intéressent
      saveCurrentProviderTokens();
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  return null;
};

export default AuthTokensWatcher;