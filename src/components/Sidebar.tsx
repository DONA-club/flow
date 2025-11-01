import { Link, useLocation } from "react-router-dom";
import { BarChart2, Building2, CloudSun } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/monitoring", label: "Evap Cooling", icon: <BarChart2 className="w-5 h-5" /> },
  { to: "/building", label: "Building Model", icon: <Building2 className="w-5 h-5" /> },
  { to: "/meteo", label: "Meteo", icon: <CloudSun className="w-5 h-5" /> },
];

export const Sidebar = () => {
  const location = useLocation();
  return (
    <aside className="h-full w-56 bg-sidebar px-4 py-8 border-r border-sidebar-border flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-6 text-sidebar-foreground">Monitoring</h2>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition",
              location.pathname === item.to && "bg-sidebar-accent font-semibold"
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};