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
    <div className="relative min-h-[200vh] overflow-x-hidden bg-black">
      {/* Point blanc central + effets */}
      <div className="fixed inset-0 flex items-center justify-center z-10">
        <div className="relative">
          <button
            onClick={() => navigate("/calendar")}
            className={`point-blanc cursor-pointer ${burstActive ? "point-pulse" : ""}`}
            aria-label="Ouvrir le calendrier circulaire"
          />
          <SparkBurst active={burstActive} />
        </div>
      </div>

      {/* Un seul logo à la fois, qui se fond et disparaît au scroll */}
      <LogoScroller
        onActiveIndexChange={() => {
          handleChange();
        }}
      />
    </div>
  );
};

export default Index;