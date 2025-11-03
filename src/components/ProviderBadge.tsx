"use client";

import React from "react";
import BrandIcon from "@/components/BrandIcon";
import type { Provider } from "@/hooks/use-multi-provider-auth";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  provider: Provider;
  user?: any;
  connectedProviders?: Record<Provider, boolean>;
  className?: string;
};

function getAvatarUrl(user: any, provider: Provider): string | null {
  if (!user) return null;
  const identities = user.identities || [];
  const matches =
    provider === "microsoft"
      ? ["azure", "azure-oidc", "azuread", "microsoft", "outlook"]
      : [provider];
  const identity = identities.find((i: any) => matches.includes(i.provider));
  const data = identity?.identity_data || {};

  // Avatar strictement issu de l’identité du provider courant
  const fromIdentity =
    data.avatar_url ||
    data.picture ||
    data.photo ||
    data.image ||
    null;

  return fromIdentity;
}

const ProviderBadge: React.FC<Props> = ({ provider, user, connectedProviders, className }) => {
  const isConnected = connectedProviders?.[provider] ?? false;
  const avatarUrl = isConnected ? getAvatarUrl(user, provider) : null;

  // Fallback Microsoft: récupérer la photo via Graph si non fournie
  const [msPhotoUrl, setMsPhotoUrl] = React.useState<string | null>(null);
  // Fallback Google: récupérer la photo via userinfo si non fournie
  const [ggPhotoUrl, setGgPhotoUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    let revokeUrl: string | null = null;

    async function fetchMicrosoftPhoto() {
      if (provider !== "microsoft" || !isConnected || !!avatarUrl || !user?.id) {
        if (msPhotoUrl) setMsPhotoUrl(null);
        return;
      }

      const { data, error } = await supabase
        .from("oauth_tokens")
        .select("access_token")
        .eq("user_id", user.id)
        .eq("provider", "microsoft")
        .maybeSingle();

      const token = data?.access_token || null;
      if (!token || error) {
        setMsPhotoUrl(null);
        return;
      }

      const tryUrls = [
        "https://graph.microsoft.com/v1.0/me/photos/96x96/$value",
        "https://graph.microsoft.com/v1.0/me/photo/$value",
      ];

      for (const url of tryUrls) {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const blob = await res.blob();
          revokeUrl = URL.createObjectURL(blob);
          setMsPhotoUrl(revokeUrl);
          return;
        }
      }

      setMsPhotoUrl(null);
    }

    fetchMicrosoftPhoto();

    return () => {
      if (revokeUrl) URL.revokeObjectURL(revokeUrl);
    };
  }, [provider, isConnected, avatarUrl, user?.id]);

  React.useEffect(() => {
    async function fetchGooglePhoto() {
      if (provider !== "google" || !isConnected || !!avatarUrl || !user?.id) {
        if (ggPhotoUrl) setGgPhotoUrl(null);
        return;
      }

      const { data, error } = await supabase
        .from("oauth_tokens")
        .select("access_token")
        .eq("user_id", user.id)
        .eq("provider", "google")
        .maybeSingle();

      const token = data?.access_token || null;
      if (!token || error) {
        setGgPhotoUrl(null);
        return;
      }

      // Endpoint userinfo (nécessite openid profile email)
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setGgPhotoUrl(null);
        return;
      }

      const json = await res.json();
      const pic = json?.picture || null;
      setGgPhotoUrl(pic || null);
    }

    fetchGooglePhoto();
  }, [provider, isConnected, avatarUrl, user?.id]);

  const finalAvatarUrl = avatarUrl || msPhotoUrl || ggPhotoUrl;

  const baseFilters =
    "filter grayscale blur-[1px] opacity-90 transition-all duration-200 ease-out group-hover:grayscale-0 group-hover:blur-0 group-hover:opacity-100";

  if (finalAvatarUrl) {
    return (
      <img
        src={finalAvatarUrl}
        alt={`${provider} avatar`}
        referrerPolicy="no-referrer"
        className={["w-full h-full rounded-full object-cover", baseFilters, className || ""]
          .join(" ")
          .trim()}
      />
    );
  }

  return (
    <BrandIcon
      name={provider}
      className={["w-full h-full", baseFilters, className || ""].join(" ").trim()}
    />
  );
};

export default ProviderBadge;