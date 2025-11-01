import React from "react";
import { CircularCalendar } from "@/components/CircularCalendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const mockEvents = [
  { title: "Morning Meeting", place: "Office", start: 9, end: 10 },
  { title: "Lunch with Sarah", place: "Cafe", start: 12, end: 13 },
  { title: "Project Review", place: "Zoom", start: 15, end: 16 },
  { title: "Gym", place: "Fitness Center", start: 18, end: 19 },
];

const CircularCalendarDemo = () => {
  // Example: sunrise at 6, sunset at 20
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-8">
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Circular Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <CircularCalendar sunrise={6} sunset={20} events={mockEvents} />
          <div className="mt-6 text-center text-gray-500 text-sm">
            Sunrise: 6:00 &nbsp;|&nbsp; Sunset: 20:00
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CircularCalendarDemo;