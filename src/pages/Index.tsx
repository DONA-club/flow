import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <Link to="/calendar" className="group">
        <button
          className="point-blanc"
          aria-label="Ouvrir le calendrier circulaire"
          tabIndex={0}
        />
      </Link>
    </div>
  );
};

export default Index;