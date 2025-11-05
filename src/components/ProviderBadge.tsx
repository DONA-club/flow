"use client";

import React from "react";
import BrandIcon from "@/components/BrandIcon";
import type { Provider } from "@/hooks/use-multi-provider-auth";
import { supabase } from "@/integrations/supabase/client";
import { Check } from "lucide-react";

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

  const [isMobile, setIsMobile] = React.useState(false);
  const [msPhotoUrl, setMsPhotoUrl] = React.useState<string | null>(null);
  const [ggPhotoUrl, setGgPhotoUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

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
  }, [provider, isConnected, avatarUrl, user?.id, msPhotoUrl]);

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
  }, [provider, isConnected, avatarUrl, user?.id, ggPhotoUrl]);

  const finalAvatarUrl = avatarUrl || msPhotoUrl || ggPhotoUrl;

  const filterClasses = [
    "transition-all duration-200 ease-out",
    isMobile ? "" : "filter saturate-50 blur-[1.5px] group-hover:saturate-100 group-hover:blur-0",
  ]
    .join(" ")
    .trim();

  const badgeSize = "w-3.5 h-3.5";

  if (isConnected && !finalAvatarUrl) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div
          className={[
            "w-full aspect-square rounded-full bg-green-500 flex items-center justify-center shadow-md",
            filterClasses,
          ]
            .join(" ")
            .trim()}
        >
          <Check className="w-1/2 h-1/2 text-white" strokeWidth={3} />
        </div>
        <div className={["rounded-full", badgeSize].join(" ")}>
          <BrandIcon
            name={provider}
            className={[
              "w-full h-full",
              filterClasses,
            ]
              .join(" ")
              .trim()}
          />
        </div>
      </div>
    );
  }

  if (finalAvatarUrl) {
    return (
      <div className="flex flex-col items-center gap-1">
        <img
          src={finalAvatarUrl}
          alt={`${provider} avatar`}
          referrerPolicy="no-referrer"
          className={[
            "w-full aspect-square rounded-full object-cover",
            filterClasses,
            className || "",
          ]
            .join(" ")
            .trim()}
        />
        <div className={["rounded-full", badgeSize].join(" ")}>
          <BrandIcon
            name={provider}
            className={[
              "w-full h-full",
              filterClasses,
            ]
              .join(" ")
              .trim()}
          />
        </div>
      </div>
    );
  }

  return (
    <BrandIcon
      name={provider}
      className={[
        "w-full h-full",
        filterClasses,
        className || "",
      ]
        .join(" ")
        .trim()}
    />
  );
};

export default ProviderBadge;