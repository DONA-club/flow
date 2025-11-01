import { Link } from "react-router-dom";
import AuthProviderScroller from "@/components/AuthProviderScroller";
import EventDrivenBurst from "@/components/EventDrivenBurst";
import { useAuthProviders } from "@/hooks/use-auth-providers";
import { useEffect, useRef } from "react";
import { useGoogleCalendar } from "@/hooks/use-google-calendar";
import { useOutlookCalendar } from "@/hooks/use-outlook-calendar";
import { useGoogleFitSleep } from "@/hooks/use-google-fit";
import { toast } from "sonner";

const Index = () => {
  // État de connexion providers
  const { googleConnected, microsoftConnected } = useAuthProviders();

  // Précharge conditionnelle: Google Calendar, Outlook Calendar, Fit
  useGoogleCalendar({ enabled: googleConnected });
  useOutlookCalendar({ enabled: microsoftConnected });
  useGoogleFitSleep({ enabled: googleConnected });

  // Confirmation visible quand une connexion est détectée
  const prevGoogle = useRef<boolean>(false);
  const prevMicrosoft = useRef<boolean>(false);

  useEffect(() => {
    if (googleConnected && !prevGoogle.current) {
      toast.success("Google connecté", {
        description: "Vos événements Google seront affichés dans le calendrier.",
      });
    }
    prevGoogle.current = googleConnected;
  }, [googleConnected]);

  useEffect(() => {
    if (microsoftConnected && !prevMicrosoft.current) {
      toast.success("Microsoft connecté", {
        description: "Vos événements Outlook seront affichés dans le calendrier.",
      });
    }
    prevMicrosoft.current = microsoftConnected;
  }, [microsoftConnected]);

  return (
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

      {/* Scroller unique: choisir un provider, cliquer pour se connecter; 
         les fournisseurs déjà connectés sont grisées et un toast confirme la connexion */}
      <AuthProviderScroller />
    </div>
  );
};

export default Index;