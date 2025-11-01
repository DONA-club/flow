import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Link to="/calendar" className="group">
        <button
          className="
            w-32 h-32 rounded-full bg-gray-900 flex items-center justify-center
            shadow-lg transition hover:scale-105 hover:bg-gray-800
            focus:outline-none focus:ring-4 focus:ring-blue-400
            text-white text-xl font-bold
          "
          aria-label="Open Circular Calendar"
        >
          <span className="group-hover:scale-110 transition">Open</span>
        </button>
      </Link>
    </div>
  );
};

export default Index;