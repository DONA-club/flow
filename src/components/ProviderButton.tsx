"use client";

import React from "react";
import BrandIcon from "@/components/BrandIcon";
import SocialAuthIconButton from "@/components/SocialAuthIconButton";
import { useMultiProviderAuth, Provider } from "@/hooks/use-multi-provider-auth";

type Props = {
  provider: Provider;
  className?: string;
};

const PROVIDER_LABELS: Record<Provider, string> = {
  google: "Google",
  microsoft: "Microsoft",
  apple: "Apple",
  facebook: "Facebook",
  amazon: "Amazon",
};

const ProviderButton: React.FC<Props> = ({ provider, className }) => {
  const { connectedProviders, connectProvider } = useMultiProviderAuth();
  const [loading, setLoading] = React.useState(false);

  const isConnected = connectedProviders[provider];
  const label = PROVIDER_LABELS[provider];

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    await connectProvider(provider);
    setLoading(false);
  };

  return (
    <SocialAuthIconButton
      onClick={handleClick}
      disabled={loading}
      ariaLabel={`Se connecter avec ${label}`}
      title={isConnected ? `Reconnecter ${label}` : `Se connecter avec ${label}`}
      className={[
        className || "",
        isConnected ? "ring-2 ring-green-400 ring-offset-2" : "",
      ]
        .join(" ")
        .trim()}
    >
      <BrandIcon name={provider === "microsoft" ? "outlook" : provider} />
    </SocialAuthIconButton>
  );
};

export default ProviderButton;