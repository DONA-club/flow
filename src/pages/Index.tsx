import { Link } from "react-router-dom";
import AuthProviderScroller from "@/components/AuthProviderScroller";
import { Toaster } from "sonner";

const Index = () => {
  return (
    <>
      <Toaster richColors closeButton />
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-transparent">
        <Link to="/calendar" className="group">
          <button
            className="point-blanc"
            aria-label="Ouvrir le calendrier circulaire"
            tabIndex={0}
          />
        </Link>
        <AuthProviderScroller />
      </div>
    </>
  );
};

export default Index;