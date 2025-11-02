import { Link } from "react-router-dom";
import AuthProviderGrid from "@/components/AuthProviderGrid";
import { useMultiProviderAuth } from "@/hooks/use-multi-provider-auth";
import { Calendar } from "lucide-react";

const Index = () => {
  const { user } = useMultiProviderAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-12 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
          Calendrier Unifié
        </h1>
        <p className="text-white/70 text-lg max-w-md mx-auto">
          Connectez tous vos comptes pour une vue centralisée de vos événements, sommeil et activités
        </p>
      </div>

      <Link to="/calendar" className="group block relative">
        <button
          className="flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-purple-500/50"
          aria-label="Ouvrir le calendrier circulaire"
        >
          <Calendar className="w-6 h-6 text-white" />
          <span className="text-white font-semibold text-lg">Voir le calendrier</span>
        </button>
      </Link>

      <div className="glass p-8 rounded-3xl backdrop-blur-md border border-white/10">
        <h2 className="text-white text-xl font-semibold mb-6 text-center">
          Connectez vos comptes
        </h2>
        <AuthProviderGrid />
        
        {user && (
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-white/60 text-sm">
              Connecté en tant que <span className="text-white/90 font-medium">{user.email}</span>
            </p>
          </div>
        )}
      </div>

      <div className="text-center text-white/50 text-xs max-w-lg">
        <p>
          Cliquez sur chaque logo pour autoriser l'accès. Tous les comptes seront liés ensemble pour une expérience unifiée.
        </p>
      </div>
    </div>
  );
};

export default Index;