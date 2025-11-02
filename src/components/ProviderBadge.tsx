"use client";

import React from "react";
import BrandIcon from "@/components/BrandIcon";
import type { Provider } from "@/hooks/use-multi-provider-auth";

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
  return (
    data.avatar_url ||
    data.picture ||
    data.photo ||
    data.image ||
    null
  );
}

const ProviderBadge: React.FC<Props> = ({ provider, user, connectedProviders, className }) => {
  const isConnected = connectedProviders?.[provider] ?? false;
  const avatarUrl = isConnected ? getAvatarUrl(user, provider) : null;

  const baseFilters =
    "filter grayscale blur-[1px] opacity-90 transition-all duration-200 ease-out group-hover:grayscale-0 group-hover:blur-0 group-hover:opacity-100";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`${provider} avatar`}
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