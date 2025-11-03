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
    console.log("🔍 useMultiProviderAuth: Vérification des providers connectés...");
    
    const { data } = await supabase.auth.getSession();
    const session = data?.session;
    const currentUser = session?.user;

    if (!currentUser) {
      console.log("⚠️ useMultiProviderAuth: Aucun utilisateur connecté");
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

    console.log("✅ useMultiProviderAuth: Utilisateur connecté:", currentUser.id);
    console.log("📋 useMultiProviderAuth: Identités liées:", currentUser.identities?.map((i: any) => i.provider).join(", ") || "aucune");
    setUser(currentUser);

    // Vérifier quels providers ont des tokens dans oauth_tokens
    const { data: tokens, error } = await supabase
      .from("oauth_tokens")
      .select("provider, access_token, refresh_token")
      .eq("user_id", currentUser.id);

    if (error) {
      console.error("❌ useMultiProviderAuth: Erreur lecture oauth_tokens:", error);
    }

    console.log("📊 useMultiProviderAuth: Tokens trouvés dans oauth_tokens:", 
      tokens?.map(t => `${t.provider} (access: ${!!t.access_token}, refresh: ${!!t.refresh_token})`).join(", ") || "aucun"
    );

    const tokenProviders = new Set(tokens?.map(t => t.provider) || []);

    const connected: ConnectedProviders = {
      google: tokenProviders.has("google"),
      microsoft: tokenProviders.has("microsoft"),
      apple: tokenProviders.has("apple"),
      facebook: tokenProviders.has("facebook"),
      amazon: tokenProviders.has("amazon"),
    };

    console.log("🎯 useMultiProviderAuth: État des connexions:", connected);

    setConnectedProviders(connected);
    setLoading(false);
  }, []);

  useEffect(() => {
    console.log("🚀 useMultiProviderAuth: Initialisation");
    checkConnectedProviders();

    // Vérification périodique toutes les 3 secondes
    const intervalId = setInterval(() => {
      console.log("⏰ useMultiProviderAuth: Vérification périodique");
      checkConnectedProviders();
    }, 3000);

    const { data } = supabase.auth.onAuthStateChange((event) => {
      console.log(`🔐 useMultiProviderAuth: Auth event: ${event}`);
      setTimeout(() => {
        checkConnectedProviders();
      }, 1500);
    });

    return () => {
      console.log("🛑 useMultiProviderAuth: Nettoyage");
      clearInterval(intervalId);
      data.subscription.unsubscribe();
    };
  }, [checkConnectedProviders]);

  const connectProvider = useCallback(async (provider: Provider) => {
    console.log(`🔗 useMultiProviderAuth: Tentative de connexion à ${provider}`);
    
    const config = PROVIDER_CONFIGS[provider];
    
    localStorage.setItem("pending_provider_connection", provider);
    console.log(`💾 useMultiProviderAuth: Provider ${provider} marqué comme pending`);
    
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

    // Vérifier si un utilisateur est déjà connecté
    const { data: sessionData } = await supabase.auth.getSession();
    const hasExistingUser = !!sessionData?.session?.user;

    let error: any = null;

    if (hasExistingUser) {
      console.log(`🔗 useMultiProviderAuth: Utilisation de linkIdentity pour ${provider} (utilisateur existant: ${sessionData.session.user.id})`);
      const result = await supabase.auth.linkIdentity({
        provider: config.supabaseProvider as any,
        options
      } as any);
      error = result.error;
      
      if (error) {
        console.error(`❌ useMultiProviderAuth: Erreur linkIdentity pour ${provider}:`, error);
      } else {
        console.log(`✅ useMultiProviderAuth: linkIdentity réussi pour ${provider}`);
      }
    } else {
      console.log(`🆕 useMultiProviderAuth: Utilisation de signInWithOAuth pour ${provider} (première connexion)`);
      const result = await supabase.auth.signInWithOAuth({ 
        provider: config.supabaseProvider as any, 
        options 
      });
      error = result.error;
    }

    if (error) {
      console.error(`❌ useMultiProviderAuth: Erreur connexion ${provider}:`, error);
      localStorage.removeItem("pending_provider_connection");
      toast.error(`Connexion ${provider} indisponible`, {
        description: error.message,
      });
      return false;
    }

    console.log(`✅ useMultiProviderAuth: Redirection OAuth ${provider} initiée`);
    return true;
  }, []);

  const disconnectProvider = useCallback(async (provider: Provider) => {
    console.log(`🔌 useMultiProviderAuth: Déconnexion de ${provider}`);
    
    if (!user) return false;

    // Supprimer les tokens de la base
    const { error } = await supabase
      .from("oauth_tokens")
      .delete()
      .eq("user_id", user.id)
      .eq("provider", provider);

    if (error) {
      console.error(`❌ useMultiProviderAuth: Erreur déconnexion ${provider}:`, error);
      toast.error(`Erreur de déconnexion ${provider}`, {
        description: error.message,
      });
      return false;
    }

    console.log(`✅ useMultiProviderAuth: Tokens ${provider} supprimés`);

    // Essayer de délier l'identité
    const identities = user.identities || [];
    const identity = identities.find((i: any) => {
      if (provider === "microsoft") {
        return ["azure", "azure-oidc", "azuread", "microsoft", "outlook"].includes(i.provider);
      }
      return i.provider === provider;
    });

    if (identity) {
      console.log(`🔗 useMultiProviderAuth: Tentative de délier l'identité ${provider}`);
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