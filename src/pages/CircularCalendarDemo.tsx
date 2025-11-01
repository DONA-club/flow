import React, { useEffect, useState } from "react";
import { CircularCalendar } from "@/components/CircularCalendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GoogleLogin from "@/components/GoogleLogin";
import { supabase } from "@/integrations/supabase/client";

const mockEvents = [
  { title: "Morning Meeting", place: "Office", start: 9, end: 10 },
  { title: "Lunch with Sarah", place: "Cafe", start: 12, end: 13 },
  { title: "Project Review", place: "Zoom", start: 15, end: 16 },
  { title: "Gym", place: "Fitness Center", start: 18, end: 19 },
];

const CircularCalendarDemo = () => {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-8">
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Connexion requise</CardTitle>
          </CardHeader>
          <CardContent>
            <GoogleLogin />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Utilisateur connecté : afficher le calendrier
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-8">
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Calendrier Circulaire</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative" style={{ width: 320, height: 320 }}>
            <CircularCalendar sunrise={6} sunset={20} events={mockEvents} />
          </div>
          <div className="mt-6 text-center text-gray-500 text-sm">
            Sunrise: 6:00 &nbsp;|&nbsp; Sunset: 20:00
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CircularCalendarDemo;