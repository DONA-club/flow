"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSessionGroup() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialiser avec l'utilisateur actuel
  const initializeGroup = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setUserId(null);
      setLoading(false);
      return;
    }

    setUserId(session.user.id);
    setLoading(false);
  }, []);

  // Sauvegarder un token dans oauth_tokens
  const saveToken = useCallback(async (
    provider: string,
    accessToken: string,
    refreshToken?: string,
    expiresAt?: string
  ) => {
    if (loading) {
      console.log("⏳ Attente initialisation...");
      await new Promise(resolve => setTimeout(resolve, 300));
      if (loading) {
        console.error("❌ Pas prêt après attente");
        return false;
      }
    }

    if (!userId) {
      console.error("❌ Pas d'utilisateur connecté");
      return false;
    }

    const { error } = await supabase
      .from("oauth_tokens")
      .upsert({
        user_id: userId,
        provider,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      }, {
        onConflict: "user_id,provider"
      });

    if (error) {
      console.error("❌ Erreur sauvegarde token:", error);
      return false;
    }

    return true;
  }, [userId, loading]);

  // Récupérer un token depuis oauth_tokens
  const getToken = useCallback(async (provider: string) => {
    if (loading) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (loading) return null;
    }

    if (!userId) return null;

    const { data, error } = await supabase
      .from("oauth_tokens")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", provider)
      .maybeSingle();

    if (error) {
      console.error("Erreur récupération token:", error);
      return null;
    }

    return data;
  }, [userId, loading]);

  // Récupérer tous les tokens
  const getAllTokens = useCallback(async () => {
    if (loading) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (loading) return [];
    }

    if (!userId) return [];

    const { data, error } = await supabase
      .from("oauth_tokens")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Erreur récupération tokens:", error);
      return [];
    }

    return data;
  }, [userId, loading]);

  // Supprimer un token
  const removeToken = useCallback(async (provider: string) => {
    if (loading) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (loading) return false;
    }

    if (!userId) return false;

    const { error } = await supabase
      .from("oauth_tokens")
      .delete()
      .eq("user_id", userId)
      .eq("provider", provider);

    return !error;
  }, [userId, loading]);

  useEffect(() => {
    initializeGroup();
  }, [initializeGroup]);

  return {
    groupId: userId, // Pour compatibilité
    loading,
    saveToken,
    getToken,
    getAllTokens,
    removeToken,
    initializeGroup
  };
}