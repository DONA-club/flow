import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthProviderGrid from "@/components/AuthProviderGrid";

const Index = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  // Gestion du scroll
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Opacité des logos basée sur le scroll
  const logoOpacity = Math.min(scrollY / 300, 1);
  const logoTranslateY = Math.max(100 - scrollY / 3, 0);

  return (
    <div className="relative min-h-[200vh] overflow-x-hidden bg-black">
      {/* Point blanc central */}
      <div className="fixed inset-0 flex items-center justify-center z-10">
        <button
          onClick={() => navigate("/calendar")}
          className="point-blanc cursor-pointer"
          aria-label="Ouvrir le calendrier circulaire"
        />
      </div>

      {/* Grille de logos qui apparaît au scroll */}
      <div
        className="fixed inset-0 flex items-center justify-center z-20 pointer-events-none"
        style={{
          opacity: logoOpacity,
          transform: `translateY(${logoTranslateY}px)`,
          transition: "opacity 0.3s ease-out, transform 0.3s ease-out",
        }}
      >
        <div className="pointer-events-auto">
          <AuthProviderGrid />
        </div>
      </div>
    </div>
  );
};

export default Index;