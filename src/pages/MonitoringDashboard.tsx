import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Thermometer, Droplets, Gauge, Zap } from "lucide-react";

const mockData = {
  status: "Running",
  inletTemp: 32,
  outletTemp: 24,
  humidity: 55,
  efficiency: 75,
  power: 2.1,
};

const MonitoringDashboard = () => (
  <div className="p-6 flex flex-col gap-6">
    <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
      <Gauge className="w-6 h-6 text-primary" />
      Indirect Evaporative Cooling System
    </h1>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={mockData.status === "Running" ? "default" : "destructive"}>
            {mockData.status}
          </Badge>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Inlet Temp</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Thermometer className="text-blue-500" />
          <span className="text-xl font-semibold">{mockData.inletTemp}°C</span>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Outlet Temp</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Thermometer className="text-green-500" />
          <span className="text-xl font-semibold">{mockData.outletTemp}°C</span>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Humidity</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Droplets className="text-cyan-500" />
          <span className="text-xl font-semibold">{mockData.humidity}%</span>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Efficiency</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Gauge className="text-yellow-500" />
          <span className="text-xl font-semibold">{mockData.efficiency}%</span>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Power Usage</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Zap className="text-purple-500" />
          <span className="text-xl font-semibold">{mockData.power} kW</span>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default MonitoringDashboard;