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

    const identities = currentUser.identities || [];
    
    const connected: ConnectedProviders = {
      google: identities.some((i: any) => i.provider === "google"),
      microsoft: identities.some((i: any) => 
        ["azure", "azure-oidc", "azuread", "microsoft", "outlook"].includes(i.provider)
      ),
      apple: identities.some((i: any) => i.provider === "apple"),
      facebook: identities.some((i: any) => i.provider === "facebook"),
      amazon: identities.some((i: any) => i.provider === "amazon"),
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

    // Si aucun utilisateur connecté, on fait un signInWithOAuth
    // Sinon, on fait un linkIdentity pour lier au compte existant
    const action = user
      ? supabase.auth.linkIdentity({ 
          provider: config.supabaseProvider as any, 
          options 
        })
      : supabase.auth.signInWithOAuth({ 
          provider: config.supabaseProvider as any, 
          options 
        });

    const { error } = await action;

    if (error) {
      const msg = String(error?.message || "");
      if (msg.includes("Manual linking is disabled") || (error as any)?.status === 404) {
        toast.error("Liaison de compte désactivée", {
          description:
            'Activez "Manual linking" dans Supabase (Authentication → Providers → Settings) pour connecter plusieurs fournisseurs au même compte.',
        });
      } else {
        toast.error(`Connexion ${provider} indisponible`, {
          description: `Le fournisseur ${provider} n'est pas activé ou a rencontré une erreur.`,
        });
      }
      return false;
    }

    return true;
  }, [user]);

  const disconnectProvider = useCallback(async (provider: Provider) => {
    if (!user) return false;

    const identities = user.identities || [];
    const identity = identities.find((i: any) => {
      if (provider === "microsoft") {
        return ["azure", "azure-oidc", "azuread", "microsoft", "outlook"].includes(i.provider);
      }
      return i.provider === provider;
    });

    if (!identity) {
      toast.error("Provider non trouvé", {
        description: `Aucune identité ${provider} trouvée pour ce compte.`,
      });
      return false;
    }

    const { error } = await supabase.auth.unlinkIdentity(identity);

    if (error) {
      toast.error(`Erreur de déconnexion ${provider}`, {
        description: error.message,
      });
      return false;
    }

    // Supprimer les tokens de la base
    await supabase
      .from("oauth_tokens")
      .delete()
      .eq("user_id", user.id)
      .eq("provider", provider === "microsoft" ? "microsoft" : provider);

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