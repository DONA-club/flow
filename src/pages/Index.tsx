import { Link } from "react-router-dom";
import AuthProviderScroller from "@/components/AuthProviderScroller";
import ParticleBurst from "@/components/ParticleBurst";
import EventDrivenBurst from "@/components/EventDrivenBurst";
import { Toaster } from "sonner";

const Index = () => {
  return (
    <>
      <Toaster richColors closeButton />
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-transparent">
        {/* Zone relative pour ancrer l'effet de particules au point blanc */}
        <div className="relative">
          <Link to="/calendar" className="group block relative">
            <button
              className="point-blanc"
              aria-label="Ouvrir le calendrier circulaire"
              tabIndex={0}
            />
            {/* écoute l'événement global pour déclencher une ondulation autour du point blanc */}
            <EventDrivenBurst />
          </Link>
        </div>
        <AuthProviderScroller />
      </div>
    </>
  );
};

export default Index;