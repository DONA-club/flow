import { MadeWithDyad } from "@/components/made-with-dyad";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart2 } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to Your Monitoring App</h1>
        <p className="text-xl text-gray-600 mb-6">
          Monitor your indirect evaporative cooling system, building, and meteo data.
        </p>
        <Link to="/monitoring">
          <Button size="lg" className="gap-2">
            <BarChart2 className="w-5 h-5" />
            Open Monitoring Dashboard
          </Button>
        </Link>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;