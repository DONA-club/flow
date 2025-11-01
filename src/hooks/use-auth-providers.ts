"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

function resolveMicrosoftIdentity(session: any) {
  const identities: any[] = session?.user?.identities ?? [];
  return identities.find(
    (i) =>
      i?.provider === "azure" ||
      i?.provider === "azure-oidc" ||
      i?.provider === "azuread" ||
      i?.provider === "microsoft" ||
      i?.provider === "outlook"
  );
}

function resolveGoogleIdentity(session: any) {
  const identities: any[] = session?.user?.identities ?? [];
  return identities.find((i) => i?.provider === "google");
}

function resolveAppleIdentity(session: any) {
  const identities: any[] = session?.user?.identities ?? [];
  return identities.find((i) => i?.provider === "apple");
}

function resolveFacebookIdentity(session: any) {
  const identities: any[] = session?.user?.identities ?? [];
  return identities.find((i) => i?.provider === "facebook");
}

function resolveAmazonIdentity(session: any) {
  const identities: any[] = session?.user?.identities ?? [];
  return identities.find((i) => i?.provider === "amazon");
}

function isAzureActive(session: any) {
  const p = session?.user?.app_metadata?.provider;
  return (
    p === "azure" ||
    p === "azure-oidc" ||
    p === "azuread" ||
    p === "microsoft" ||
    p === "outlook"
  );
}

export function useAuthProviders() {
  const [googleConnected, setGoogleConnected] = useState(false);
  const [microsoftConnected, setMicrosoftConnected] = useState(false);
  const [appleConnected, setAppleConnected] = useState(false);
  const [facebookConnected, setFacebookConnected] = useState(false);
  const [amazonConnected, setAmazonConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  const compute = async () => {
    const { data } = await supabase.auth.getSession();
    const session: any = data?.session ?? null;

    // Google: stricte présence d’un access_token
    const g = !!resolveGoogleIdentity(session)?.identity_data?.access_token;

    // Microsoft: connecté si Azure est actif (provider) OU si l’identité expose un vrai access_token
    const m =
      isAzureActive(session) ||
      !!resolveMicrosoftIdentity(session)?.identity_data?.access_token;

    const a = !!resolveAppleIdentity(session);
    const f = !!resolveFacebookIdentity(session);
    const am = !!resolveAmazonIdentity(session);

    setGoogleConnected(g);
    setMicrosoftConnected(m);
    setAppleConnected(!!a);
    setFacebookConnected(!!f);
    setAmazonConnected(!!am);
    setChecking(false);
  };

  useEffect(() => {
    compute();
    const { data } = supabase.auth.onAuthStateChange(() => {
      compute();
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return {
    googleConnected,
    microsoftConnected,
    appleConnected,
    facebookConnected,
    amazonConnected,
    checking,
  };
}