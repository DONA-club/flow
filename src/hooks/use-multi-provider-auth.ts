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

function isTokenValid(token: string | null, provider: Provider): boolean {
  if (!token) return false;
  
  // Vérifier le format du token
  if (provider === "google") {
    return token.startsWith("ya29.");
  }
  if (provider === "microsoft") {
    return token.startsWith("eyJ") && token.split(".").length === 3;
  }
  
  return token.length > 20;
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

    // Vérifier quels providers ont des tokens VALIDES dans oauth_tokens
    const { data: tokens } = await supabase
      .from("oauth_tokens")
      .select("provider, access_token, refresh_token")
      .eq("user_id", currentUser.id);

    const connected: ConnectedProviders = {
      google: false,
      microsoft: false,
      apple: false,
      facebook: false,
      amazon: false,
    };

    if (tokens) {
      for (const token of tokens) {
        const provider = token.provider as Provider;
        // Vérifier que le token a le bon format
        if (isTokenValid(token.access_token, provider) || token.refresh_token) {
          connected[provider] = true;
        } else {
          console.warn(`⚠️ Token invalide pour ${provider}, suppression...`);
          // Supprimer le token invalide
          await supabase
            .from("oauth_tokens")
            .delete()
            .eq("user_id", currentUser.id)
            .eq("provider", provider);
        }
      }
    }

    setConnectedProviders(connected);
    setLoading(false);
  }, []);

  useEffect(() => {
    checkConnectedProviders();

    const { data } = supabase.auth.onAuthStateChange(() => {
      // Petit délai pour laisser les tokens se sauvegarder
      setTimeout(() => {
        checkConnectedProviders();
      }, 1000);
    });

    return () => data.subscription.unsubscribe();
  }, [checkConnectedProviders]);

  const connectProvider = useCallback(async (provider: Provider) => {
    const config = PROVIDER_CONFIGS[provider];
    
    // Stocker le provider demandé dans localStorage pour le récupérer après redirect
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

    // TOUJOURS utiliser signInWithOAuth pour capturer les tokens
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider: config.supabaseProvider as any, 
      options 
    });

    if (error) {
      localStorage.removeItem("pending_provider_connection");
      toast.error(`Connexion ${provider} indisponible`, {
        description: error.message,
      });
      return false;
    }

    return true;
  }, []);

  const disconnectProvider = useCallback(async (provider: Provider) => {
    if (!user) return false;

    // Supprimer les tokens de la base
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

    // Essayer de délier l'identité (optionnel, peut échouer si c'est la dernière)
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