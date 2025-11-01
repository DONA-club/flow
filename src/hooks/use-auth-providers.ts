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

export function useAuthProviders() {
  const [googleConnected, setGoogleConnected] = useState(false);
  const [microsoftConnected, setMicrosoftConnected] = useState(false);
  const [appleConnected, setAppleConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  const compute = async () => {
    const { data } = await supabase.auth.getSession();
    const session: any = data?.session ?? null;

    const g = !!resolveGoogleIdentity(session)?.identity_data?.access_token;
    const m = !!resolveMicrosoftIdentity(session)?.identity_data?.access_token;
    const a = !!resolveAppleIdentity(session)?.identity_data?.access_token;

    setGoogleConnected(g);
    setMicrosoftConnected(m);
    setAppleConnected(a);
    setChecking(false);
  };

  useEffect(() => {
    compute();
    const { data } = supabase.auth.onAuthStateChange(() => {
      compute();
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return { googleConnected, microsoftConnected, appleConnected, checking };
}