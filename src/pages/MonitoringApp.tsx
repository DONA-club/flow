import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";

const MonitoringApp = () => (
  <div className="min-h-screen flex bg-gray-50">
    <Sidebar />
    <main className="flex-1 min-h-screen">
      <Outlet />
    </main>
  </div>
);

export default MonitoringApp;