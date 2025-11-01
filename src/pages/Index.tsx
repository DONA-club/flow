import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass flex flex-col items-center justify-center p-10 z-glass">
        <Link to="/calendar" className="group">
          <button
            className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-indigo-500 via-fuchsia-400 to-emerald-300 shadow-2xl border-4 border-white/40 outline-none transition-all duration-300 hover:scale-110 hover:shadow-[0_0_0_8px_rgba(236,72,153,0.10)] focus:scale-105 focus:ring-4 focus:ring-fuchsia-300"
            aria-label="Ouvrir le calendrier circulaire"
            tabIndex={0}
          />
        </Link>
        <div className="mt-8 text-center text-gray-700 font-mono text-base opacity-80">
          <span>
            <span className="text-fuchsia-500 font-bold">Disrupt</span> your time.<br />
            <span className="text-indigo-500">Visualisez vos journées autrement.</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Index;