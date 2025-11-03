"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type SessionGroup = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

type SessionToken = {
  id: string;
  session_group_id: string;
  provider: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export function useSessionGroup() {
  const [groupId, setGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Créer ou récupérer un groupe de session
  const initializeGroup = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setGroupId(null);
      setLoading(false);
      return;
    }

    // 1. Vérifier s'il y a un groupe en cours dans localStorage
    const storedGroupId = localStorage.getItem("current_session_group");
    if (storedGroupId) {
      // Vérifier que le groupe existe et appartient à l'utilisateur
      const { data, error } = await supabase
        .from("session_groups")
        .select("id")
        .eq("id", storedGroupId)
        .eq("user_id", session.user.id)
        .single();
      
      if (!error && data) {
        setGroupId(storedGroupId);
        setLoading(false);
        return;
      }
    }

    // 2. Créer un nouveau groupe
    const { data, error } = await supabase
      .from("session_groups")
      .insert([{ user_id: session.user.id }])
      .select()
      .single();

    if (error) {
      console.error("Erreur création groupe session:", error);
      setGroupId(null);
    } else {
      setGroupId(data.id);
      localStorage.setItem("current_session_group", data.id);
    }
    setLoading(false);
  }, []);

  // Sauvegarder un token dans le groupe
  const saveToken = useCallback(async (
    provider: string,
    accessToken: string,
    refreshToken?: string,
    expiresAt?: string
  ) => {
    if (!groupId) return false;

    const { error } = await supabase
      .from("session_tokens")
      .upsert({
        session_group_id: groupId,
        provider,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      }, {
        onConflict: "session_group_id,provider"
      });

    return !error;
  }, [groupId]);

  // Récupérer un token du groupe
  const getToken = useCallback(async (provider: string) => {
    if (!groupId) return null;

    const { data, error } = await supabase
      .from("session_tokens")
      .select("*")
      .eq("session_group_id", groupId)
      .eq("provider", provider)
      .maybeSingle();

    if (error) {
      console.error("Erreur récupération token:", error);
      return null;
    }

    return data;
  }, [groupId]);

  // Récupérer tous les tokens du groupe
  const getAllTokens = useCallback(async () => {
    if (!groupId) return [];

    const { data, error } = await supabase
      .from("session_tokens")
      .select("*")
      .eq("session_group_id", groupId);

    if (error) {
      console.error("Erreur récupération tokens:", error);
      return [];
    }

    return data;
  }, [groupId]);

  // Supprimer un token du groupe
  const removeToken = useCallback(async (provider: string) => {
    if (!groupId) return false;

    const { error } = await supabase
      .from("session_tokens")
      .delete()
      .eq("session_group_id", groupId)
      .eq("provider", provider);

    return !error;
  }, [groupId]);

  useEffect(() => {
    initializeGroup();
  }, [initializeGroup]);

  return {
    groupId,
    loading,
    saveToken,
    getToken,
    getAllTokens,
    removeToken,
    initializeGroup
  };
}