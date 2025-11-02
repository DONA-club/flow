"use client";

import { useMultiProviderAuth } from "./use-multi-provider-auth";

export function useAuthProviders() {
  const { connectedProviders, loading } = useMultiProviderAuth();

  return {
    googleConnected: connectedProviders.google,
    microsoftConnected: connectedProviders.microsoft,
    appleConnected: connectedProviders.apple,
    facebookConnected: connectedProviders.facebook,
    amazonConnected: connectedProviders.amazon,
    checking: loading,
  };
}