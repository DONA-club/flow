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
    scopes: "https://graph.microsoft.com/Calendars.Read offline_access openid profile email",
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
    console.log("🔍 Vérification des providers connectés...");
    
    const { data } = await supabase.auth.getSession();
    const session = data?.session;
    const currentUser = session?.user;

    if (!currentUser) {
      console.log("❌ Pas d'utilisateur connecté");
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

    console.log("✅ Utilisateur connecté:", currentUser.id);
    setUser(currentUser);

    const { data: tokens, error } = await supabase
      .from("oauth_tokens")
      .select("provider, access_token, refresh_token")
      .eq("user_id", currentUser.id);

    if (error) {
      console.error("❌ Erreur lecture oauth_tokens:", error);
    }

    console.log("📋 Tokens trouvés:", tokens?.map(t => t.provider) || []);

    const tokenProviders = new Set(tokens?.map(t => t.provider) || []);

    const connected: ConnectedProviders = {
      google: tokenProviders.has("google"),
      microsoft: tokenProviders.has("microsoft"),
      apple: tokenProviders.has("apple"),
      facebook: tokenProviders.has("facebook"),
      amazon: tokenProviders.has("amazon"),
    };

    console.log("✅ Providers connectés:", connected);

    setConnectedProviders(connected);
    setLoading(false);
  }, []);

  useEffect(() => {
    checkConnectedProviders();

    const intervalId = setInterval(() => {
      checkConnectedProviders();
    }, 3000);

    const { data } = supabase.auth.onAuthStateChange((event) => {
      console.log("🔄 Auth state changed:", event);
      if (["SIGNED_IN", "TOKEN_REFRESHED", "USER_UPDATED"].includes(event)) {
        setTimeout(() => {
          checkConnectedProviders();
        }, 1500);
      }
    });

    return () => {
      clearInterval(intervalId);
      data.subscription.unsubscribe();
    };
  }, [checkConnectedProviders]);

  const connectProvider = useCallback(async (provider: Provider) => {
    console.log("🔗 Connexion au provider:", provider);
    
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

    const { data: sessionData } = await supabase.auth.getSession();
    const hasExistingUser = !!sessionData?.session?.user;

    console.log("👤 Utilisateur existant:", hasExistingUser);

    let error: any = null;

    if (hasExistingUser) {
      console.log("🔗 Utilisation de linkIdentity");
      const result = await supabase.auth.linkIdentity({
        provider: config.supabaseProvider as any,
        options
      } as any);
      error = result.error;
    } else {
      console.log("🔗 Utilisation de signInWithOAuth");
      const result = await supabase.auth.signInWithOAuth({ 
        provider: config.supabaseProvider as any, 
        options 
      });
      error = result.error;
    }

    if (error) {
      console.error(`❌ Erreur connexion ${provider}:`, error);
      localStorage.removeItem("pending_provider_connection");
      toast.error(`Connexion ${provider} indisponible`, {
        description: error.message,
      });
      return false;
    }

    console.log(`✅ Redirection vers ${provider} réussie`);
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
      console.error(`❌ Erreur déconnexion ${provider}:`, error);
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