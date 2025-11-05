import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import LogoScroller from "@/components/LogoScroller";
import SparkBurst from "@/components/SparkBurst";
import { useMultiProviderAuth } from "@/hooks/use-multi-provider-auth";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [burstActive, setBurstActive] = useState(false);
  const { connectedProviders } = useMultiProviderAuth();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(max-width: 640px)");
    const applyNoScroll = () => {
      if (mq.matches) {
        document.documentElement.classList.add("no-scroll");
        document.body.classList.add("no-scroll");
      } else {
        document.documentElement.classList.remove("no-scroll");
        document.body.classList.remove("no-scroll");
      }
    };

    applyNoScroll();
    mq.addEventListener("change", applyNoScroll);

    return () => {
      mq.removeEventListener("change", applyNoScroll);
      document.documentElement.classList.remove("no-scroll");
      document.body.classList.remove("no-scroll");
    };
  }, []);

  const hasAnyConnection = Object.values(connectedProviders || {}).some(Boolean);

  const handleChange = () => {
    setBurstActive(true);
    setTimeout(() => setBurstActive(false), 650);
  };

  const handleOpenCalendar = () => {
    if (!hasAnyConnection) {
      toast.info("Connectez un compte pour accéder au calendrier.", {
        description: "Faites défiler pour choisir un fournisseur ou cliquez sur le logo.",
      });
      setBurstActive(true);
      setTimeout(() => setBurstActive(false), 500);
      return;
    }
    navigate("/visualiser");
  };

  const sparkRadiusRem = 1.6;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 flex items-center justify-center z-10">
        <div className="relative">
          <button
            onClick={handleOpenCalendar}
            className={`point-blanc cursor-pointer ${burstActive ? "point-pulse" : ""}`}
            aria-label="Ouvrir le calendrier circulaire"
          />
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-6">
            <div className="relative">
              <LogoScroller onActiveIndexChange={handleChange} />
              <SparkBurst active={burstActive} distanceRem={sparkRadiusRem} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;