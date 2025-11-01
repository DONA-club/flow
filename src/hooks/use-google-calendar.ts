"use client";

import React from "react";
import { supabase } from "@/integrations/supabase/client";

export type CalendarEvent = {
  title: string;
  place: string;
  start: number; // heure décimale (0-23)
  end: number;   // heure décimale (0-23)
  url?: string;
  raw?: any;
};

type Result = {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  connected: boolean;
};

function toHourDecimal(iso: string): number {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

export function useGoogleCalendar(): Result {
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [connected, setConnected] = React.useState(false);

  async function resolveGoogleAccessToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    const session: any = data?.session ?? null;
    // Essaye différentes sources: provider_token ou identities[google].identity_data.access_token
    const fromProviderToken: string | null = session?.provider_token ?? null;
    if (fromProviderToken) return fromProviderToken;

    const identities: any[] = session?.user?.identities ?? [];
    const googleIdentity = identities.find((i) => i?.provider === "google");
    const fromIdentities: string | null = googleIdentity?.identity_data?.access_token ?? null;
    return fromIdentities || null;
  }

  const fetchEvents = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const accessToken = await resolveGoogleAccessToken();
    setConnected(!!accessToken);

    if (!accessToken) {
      setEvents([]);
      setLoading(false);
      setError("Jeton Google manquant. Réautorisez l’accès au calendrier.");
      return;
    }

    const timeMin = new Date().toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(
      timeMin
    )}&maxResults=10`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      setEvents([]);
      setLoading(false);
      setError(`Erreur Google Calendar (${res.status})`);
      return;
    }

    const json = await res.json();
    const items: any[] = json?.items ?? [];

    const mapped: CalendarEvent[] = items
      .map((item) => {
        const title = item.summary || "Événement";
        const place = item.location || (item.organizer?.displayName ?? "Agenda");
        const startIso = item.start?.dateTime || item.start?.date; // all-day éventuels
        const endIso = item.end?.dateTime || item.end?.date;
        if (!startIso || !endIso) return null;

        const startDec = toHourDecimal(startIso);
        const endDec = toHourDecimal(endIso);

        return {
          title,
          place,
          start: startDec,
          end: endDec,
          url: item.htmlLink,
          raw: item,
        };
      })
      .filter(Boolean) as CalendarEvent[];

    setEvents(mapped);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  React.useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, _session) => {
      // À toute mise à jour, on tente un refresh
      fetchEvents();
    });
    return () => data.subscription.unsubscribe();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    refresh: fetchEvents,
    connected,
  };
}