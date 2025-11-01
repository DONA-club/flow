import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass flex flex-col items-center justify-center p-10 z-glass">
        <Link to="/calendar" className="group">
          <button
            className="btn-disrupt"
            aria-label="Ouvrir le calendrier circulaire"
          >
            <span className="transition group-hover:scale-110">Ouvrir le Calendrier</span>
          </button>
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