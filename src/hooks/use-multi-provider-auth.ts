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

    // Vérifier quels providers ont des tokens dans oauth_tokens
    const { data: tokens } = await supabase
      .from("oauth_tokens")
      .select("provider")
      .eq("user_id", currentUser.id);

    const tokenProviders = new Set(tokens?.map(t => t.provider) || []);

    const connected: ConnectedProviders = {
      google: tokenProviders.has("google"),
      microsoft: tokenProviders.has("microsoft"),
      apple: tokenProviders.has("apple"),
      facebook: tokenProviders.has("facebook"),
      amazon: tokenProviders.has("amazon"),
    };

    setConnectedProviders(connected);
    setLoading(false);
  }, []);

  useEffect(() => {
    checkConnectedProviders();

    const { data } = supabase.auth.onAuthStateChange(() => {
      checkConnectedProviders();
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
    // Si l'utilisateur existe déjà, Supabase va automatiquement lier l'identité
    // si "Manual linking" est activé
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