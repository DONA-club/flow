import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

const building = {
  name: "Office Block A",
  floors: 5,
  area: 3200,
  occupancy: 120,
  year: 2021,
};

const BuildingModel = () => (
  <div className="p-6 flex flex-col gap-6">
    <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
      <Building2 className="w-6 h-6 text-primary" />
      Building Modelisation
    </h1>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Building Info</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li><span className="font-semibold">Name:</span> {building.name}</li>
            <li><span className="font-semibold">Floors:</span> {building.floors}</li>
            <li><span className="font-semibold">Area:</span> {building.area} m²</li>
            <li><span className="font-semibold">Occupancy:</span> {building.occupancy} people</li>
            <li><span className="font-semibold">Year Built:</span> {building.year}</li>
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Model Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-48 bg-gray-200 rounded flex items-center justify-center text-gray-500">
            [3D Model Placeholder]
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default BuildingModel;