import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudSun, Thermometer, Droplets } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

const current = {
  temp: 29,
  humidity: 48,
  condition: "Sunny",
};

const forecast = [
  { hour: "08:00", temp: 22 },
  { hour: "10:00", temp: 25 },
  { hour: "12:00", temp: 28 },
  { hour: "14:00", temp: 30 },
  { hour: "16:00", temp: 31 },
  { hour: "18:00", temp: 29 },
  { hour: "20:00", temp: 26 },
];

const Meteo = () => (
  <div className="p-6 flex flex-col gap-6">
    <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
      <CloudSun className="w-6 h-6 text-primary" />
      Meteo
    </h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader>
          <CardTitle>Temperature</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Thermometer className="text-orange-500" />
          <span className="text-xl font-semibold">{current.temp}°C</span>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Humidity</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Droplets className="text-cyan-500" />
          <span className="text-xl font-semibold">{current.humidity}%</span>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Condition</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <CloudSun className="text-yellow-400" />
          <span className="text-xl font-semibold">{current.condition}</span>
        </CardContent>
      </Card>
    </div>
    <Card>
      <CardHeader>
        <CardTitle>Temperature Forecast</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecast}>
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="temp" stroke="#f59e42" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default Meteo;