import { useNavigate } from "react-router-dom";
import { useState } from "react";
import LogoScroller from "@/components/LogoScroller";
import SparkBurst from "@/components/SparkBurst";
import { useMultiProviderAuth } from "@/hooks/use-multi-provider-auth";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [burstActive, setBurstActive] = useState(false);
  const { connectedProviders } = useMultiProviderAuth();

  const hasAnyConnection = connectedProviders.google || connectedProviders.microsoft;

  const handleChange = () => {
    // déclenche le jet à chaque changement de logo
    setBurstActive(true);
    setTimeout(() => setBurstActive(false), 650);
  };

  const handleOpenCalendar = () => {
    if (!hasAnyConnection) {
      toast.info("Connectez un compte pour accéder au calendrier.", {
        description: "Faites défiler pour choisir un fournisseur ou cliquez sur le logo.",
      });
      // effet de stabilisation court
      setBurstActive(true);
      setTimeout(() => setBurstActive(false), 500);
      return;
    }
    navigate("/calendar");
  };

  // distance centre point -> centre logo : 2.75rem (demi point 5.5rem) + 0.875rem (mt-3.5) + 1.125rem (demi logo 2.25rem) = 4.75rem
  const sparkDistanceRem = 4.75;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Point blanc central + effets */}
      <div className="fixed inset-0 flex items-center justify-center z-10">
        <div className="relative">
          <button
            onClick={handleOpenCalendar}
            className={`point-blanc cursor-pointer ${burstActive ? "point-pulse" : ""}`}
            aria-label="Ouvrir le calendrier circulaire"
          />
          <SparkBurst active={burstActive} distanceRem={sparkDistanceRem} />
          {/* Logo sous le point blanc, centré, un peu plus bas pour l’ergonomie */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3.5">
            <LogoScroller onActiveIndexChange={handleChange} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;