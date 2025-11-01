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

function isGoogleActive(session: any) {
  const p = session?.user?.app_metadata?.provider;
  return p === "google";
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

    // Google: connecté si identité, ou provider actif google, ou tokens provider présents
    const hasGoogleIdentity = !!resolveGoogleIdentity(session);
    const hasGoogleProviderTokens =
      !!session?.provider_token || !!session?.provider_refresh_token;
    const g = hasGoogleIdentity || isGoogleActive(session) || hasGoogleProviderTokens;

    // Microsoft: connecté si identité Microsoft, provider Azure actif, ou tokens provider présents
    const hasMsIdentity = !!resolveMicrosoftIdentity(session);
    const hasMsProviderTokens =
      !!session?.provider_token || !!session?.provider_refresh_token;
    const m = hasMsIdentity || isAzureActive(session) || hasMsProviderTokens;

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