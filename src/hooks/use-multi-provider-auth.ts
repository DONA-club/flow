"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Provider = "google" | "microsoft" | "apple" | "facebook" | "amazon";

type ProviderConfig = {
  supabaseProvider: string;
  scopes?: string;
  queryParams?: Record<string, string>;
};

const PROVIDER_CONFIGS: Record<Provider, ProviderConfig> = {
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
    scopes: "openid profile email offline_access Calendars.Read",
    queryParams: { prompt: "consent" },
  },
  apple: {
    supabaseProvider: "apple",
  },
  facebook: {
    supabaseProvider: "facebook",
  },
  amazon: {
    supabaseProvider: "amazon",
  },
};

type ConnectedProviders = {
  [K in Provider]: boolean;
};

function isTokenValid(token: string | null, _provider: Provider): boolean {
  if (!token) return false;
  // Heuristique permissive: tout token non trivial est considéré comme présent
  return token.length > 10;
}

function identityMatchesProvider(identityProvider: string, target: Provider): boolean {
  if (target === "microsoft") {
    return ["azure", "azure-oidc", "azuread", "microsoft", "outlook"].includes(identityProvider);
  }
  return identityProvider === target;
}

export function useMultiProviderAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connectedProviders, setConnectedProviders] = useState<ConnectedProviders>({
    google: false,
    microsoft: false,
    apple: false,
    facebook: false,
    amazon: false,
  });

  const checkConnectedProviders = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const session = data?.session;
    const currentUser = session?.user;

    if (!currentUser) {
      setUser(null);
      setConnectedProviders({
        google: false,
        microsoft: false,
        apple: false,
        facebook: false,
        amazon: false,
      });
      setLoading(false);
      return;
    }

    setUser(currentUser);

    // 1) Partir des identities (compte réellement lié)
    const identities = currentUser.identities || [];
    const connectedFromIdentities: ConnectedProviders = {
      google: identities.some((i: any) => identityMatchesProvider(i.provider, "google")),
      microsoft: identities.some((i: any) => identityMatchesProvider(i.provider, "microsoft")),
      apple: identities.some((i: any) => identityMatchesProvider(i.provider, "apple")),
      facebook: identities.some((i: any) => identityMatchesProvider(i.provider, "facebook")),
      amazon: identities.some((i: any) => identityMatchesProvider(i.provider, "amazon")),
    };

    // 2) Vérifier les tokens dans oauth_tokens (si présents)
    const { data: tokens } = await supabase
      .from("oauth_tokens")
      .select("provider, access_token, refresh_token")
      .eq("user_id", currentUser.id);

    const connected: ConnectedProviders = { ...connectedFromIdentities };

    if (tokens) {
      for (const token of tokens) {
        const provider = token.provider as Provider;
        if (isTokenValid(token.access_token, provider) || token.refresh_token) {
          connected[provider] = true;
        }
        // Ne plus supprimer agressivement: certains providers changent le format du token
      }
    }

    setConnectedProviders(connected);
    setLoading(false);
  }, []);

  useEffect(() => {
    checkConnectedProviders();

    const { data } = supabase.auth.onAuthStateChange(() => {
      // Laisser le temps au session/user de se stabiliser
      setTimeout(() => {
        checkConnectedProviders();
      }, 800);
    });

    return () => data.subscription.unsubscribe();
  }, [checkConnectedProviders]);

  const connectProvider = useCallback(async (provider: Provider) => {
    const config = PROVIDER_CONFIGS[provider];
    
    localStorage.setItem("pending_provider_connection", provider);
    
    toast(`Redirection vers ${provider}…`, {
      description: "Veuillez compléter la connexion dans la fenêtre suivante.",
    });

    const options: any = {
      redirectTo: window.location.origin,
    };

    if (config.scopes) {
      options.scopes = config.scopes;
    }

    if (config.queryParams) {
      options.queryParams = config.queryParams;
    }

    // Si un utilisateur est déjà connecté, on LIE l'identité au compte existant
    const { data: sess } = await supabase.auth.getSession();
    const hasUser = !!sess?.session?.user;

    let err: any = null;

    if (hasUser) {
      const { error } = await supabase.auth.linkIdentity(
        { provider: config.supabaseProvider as any, options } as any
      );
      err = error;
    } else {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: config.supabaseProvider as any, 
        options 
      });
      err = error;
    }

    if (err) {
      localStorage.removeItem("pending_provider_connection");
      toast.error(`Connexion ${provider} indisponible`, {
        description: err.message,
      });
      return false;
    }

    return true;
  }, []);

  const disconnectProvider = useCallback(async (provider: Provider) => {
    if (!user) return false;

    const { error } = await supabase
      .from("oauth_tokens")
      .delete()
      .eq("user_id", user.id)
      .eq("provider", provider);

    if (error) {
      toast.error(`Erreur de déconnexion ${provider}`, {
        description: error.message,
      });
      return false;
    }

    const identities = user.identities || [];
    const identity = identities.find((i: any) => {
      if (provider === "microsoft") {
        return ["azure", "azure-oidc", "azuread", "microsoft", "outlook"].includes(i.provider);
      }
      return i.provider === provider;
    });

    if (identity) {
      await supabase.auth.unlinkIdentity(identity);
    }

    toast.success(`${provider} déconnecté`, {
      description: "Le fournisseur a été retiré de votre compte.",
    });

    await checkConnectedProviders();
    return true;
  }, [user, checkConnectedProviders]);

  return {
    user,
    loading,
    connectedProviders,
    connectProvider,
    disconnectProvider,
    refresh: checkConnectedProviders,
  };
}