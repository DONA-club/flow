import { useNavigate } from "react-router-dom";
import { useState } from "react";
import LogoScroller from "@/components/LogoScroller";
import SparkBurst from "@/components/SparkBurst";

const Index = () => {
  const navigate = useNavigate();
  const [burstActive, setBurstActive] = useState(false);

  const handleChange = () => {
    setBurstActive(true);
    setTimeout(() => setBurstActive(false), 650);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Point blanc central + effets */}
      <div className="fixed inset-0 flex items-center justify-center z-10">
        <div className="relative">
          <button
            onClick={() => navigate("/calendar")}
            className={`point-blanc cursor-pointer ${burstActive ? "point-pulse" : ""}`}
            aria-label="Ouvrir le calendrier circulaire"
          />
          <SparkBurst active={burstActive} />
          {/* Logo juste sous le point blanc, centré, taille ~1.7rem (2x plus petit que 3.4rem) */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2">
            <LogoScroller onActiveIndexChange={handleChange} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;