import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthProviderGrid from "@/components/AuthProviderGrid";

const Index = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrollY, setScrollY] = useState(0);

  // Gestion du scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Animation des particules
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }> = [];

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
      });
    }

    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fill();
      });

      // Lignes entre particules proches
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 * (1 - distance / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Opacité des logos basée sur le scroll
  const logoOpacity = Math.min(scrollY / 300, 1);
  const logoTranslateY = Math.max(100 - scrollY / 3, 0);

  return (
    <div className="relative min-h-[200vh] overflow-x-hidden">
      {/* Canvas pour les particules */}
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
      />

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

      {/* Indicateur de scroll */}
      {scrollY < 100 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-30 animate-bounce">
          <div className="text-white/50 text-sm flex flex-col items-center gap-2">
            <span>Faites défiler</span>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;