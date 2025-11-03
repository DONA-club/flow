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

  // Avatar strictement issu de l'identité du provider courant
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

      console.log("🔍 ProviderBadge: Tentative de récupération de la photo Microsoft via Graph API");

      const { data, error } = await supabase
        .from("oauth_tokens")
        .select("access_token")
        .eq("user_id", user.id)
        .eq("provider", "microsoft")
        .maybeSingle();

      const token = data?.access_token || null;
      if (!token || error) {
        console.log("⚠️ ProviderBadge: Pas de token Microsoft disponible");
        setMsPhotoUrl(null);
        return;
      }

      const tryUrls = [
        "https://graph.microsoft.com/v1.0/me/photos/96x96/$value",
        "https://graph.microsoft.com/v1.0/me/photo/$value",
      ];

      for (const url of tryUrls) {
        console.log(`🌐 ProviderBadge: Tentative de récupération depuis ${url}`);
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const blob = await res.blob();
          revokeUrl = URL.createObjectURL(blob);
          setMsPhotoUrl(revokeUrl);
          console.log("✅ ProviderBadge: Photo Microsoft récupérée avec succès");
          return;
        } else {
          console.log(`❌ ProviderBadge: Échec ${res.status} pour ${url}`);
        }
      }

      console.log("⚠️ ProviderBadge: Aucune photo Microsoft trouvée");
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

      console.log("🔍 ProviderBadge: Tentative de récupération de la photo Google via userinfo");

      const { data, error } = await supabase
        .from("oauth_tokens")
        .select("access_token")
        .eq("user_id", user.id)
        .eq("provider", "google")
        .maybeSingle();

      const token = data?.access_token || null;
      if (!token || error) {
        console.log("⚠️ ProviderBadge: Pas de token Google disponible");
        setGgPhotoUrl(null);
        return;
      }

      // Endpoint userinfo (nécessite openid profile email)
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.log(`❌ ProviderBadge: Échec récupération photo Google (${res.status})`);
        setGgPhotoUrl(null);
        return;
      }

      const json = await res.json();
      const pic = json?.picture || null;
      setGgPhotoUrl(pic || null);
      
      if (pic) {
        console.log("✅ ProviderBadge: Photo Google récupérée avec succès");
      } else {
        console.log("⚠️ ProviderBadge: Aucune photo Google trouvée");
      }
    }

    fetchGooglePhoto();
  }, [provider, isConnected, avatarUrl, user?.id]);

  const finalAvatarUrl = avatarUrl || msPhotoUrl || ggPhotoUrl;

  // Désaturation partielle (50%) et flou léger, pas complètement gris
  const baseFilters =
    "filter saturate-50 blur-[1.5px] transition-all duration-200 ease-out group-hover:saturate-100 group-hover:blur-0";

  // Badge du provider sous la photo
  const badgeSize = "w-3.5 h-3.5";

  // Si connecté mais pas de photo : point vert avec check
  if (isConnected && !finalAvatarUrl) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className={["w-full h-full rounded-full bg-green-500 flex items-center justify-center shadow-md", baseFilters].join(" ")}>
          <Check className="w-1/2 h-1/2 text-white" strokeWidth={3} />
        </div>
        {/* Badge provider directement sous le point vert */}
        <div className={["rounded-full", badgeSize].join(" ")}>
          <BrandIcon
            name={provider}
            className={["w-full h-full", baseFilters].join(" ")}
          />
        </div>
      </div>
    );
  }

  // Si photo disponible
  if (finalAvatarUrl) {
    return (
      <div className="flex flex-col items-center gap-1">
        <img
          src={finalAvatarUrl}
          alt={`${provider} avatar`}
          referrerPolicy="no-referrer"
          className={["w-full h-full rounded-full object-cover", baseFilters, className || ""]
            .join(" ")
            .trim()}
        />
        {/* Badge provider directement sous la photo */}
        <div className={["rounded-full", badgeSize].join(" ")}>
          <BrandIcon
            name={provider}
            className={["w-full h-full", baseFilters].join(" ")}
          />
        </div>
      </div>
    );
  }

  // Sinon : logo du provider (non connecté)
  return (
    <BrandIcon
      name={provider}
      className={["w-full h-full", baseFilters, className || ""].join(" ").trim()}
    />
  );
};

export default ProviderBadge;