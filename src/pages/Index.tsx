import { Link } from "react-router-dom";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import AppleAuthButton from "@/components/AppleAuthButton";
import AmazonAuthButton from "@/components/AmazonAuthButton";
import OutlookAuthButton from "@/components/OutlookAuthButton";
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
        <div className="flex items-center gap-4">
          <GoogleAuthButton />
          <AppleAuthButton />
          <AmazonAuthButton />
          <OutlookAuthButton />
        </div>
      </div>
    </>
  );
};

export default Index;