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
  connected: boolean;
  refresh: () => void;
};

function toHourDecimal(iso: string): number {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

function resolveMicrosoftIdentity(session: any) {
  const identities: any[] = session?.user?.identities ?? [];
  return identities.find(
    (i) =>
      i?.provider === "azure" ||
      i?.provider === "azure-oidc" ||
      i?.provider === "azuread" ||
      i?.provider === "microsoft" ||
      i?.provider === "outlook"
  );
}

async function resolveMicrosoftAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const session: any = data?.session ?? null;

  // provider_token peut contenir le jeton du dernier provider connecté
  const fromProviderToken: string | null = session?.provider_token ?? null;

  const msIdentity = resolveMicrosoftIdentity(session);
  const fromIdentities: string | null =
    msIdentity?.identity_data?.access_token ?? null;

  return fromIdentities || fromProviderToken || null;
}

export function useOutlookCalendar(): Result {
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [connected, setConnected] = React.useState(false);

  const fetchEvents = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    const token = await resolveMicrosoftAccessToken();
    if (!token) {
      setConnected(false);
      setEvents([]);
      setLoading(false);
      setError("Aucun jeton Microsoft disponible. Connectez votre compte Outlook.");
      return;
    }

    setConnected(true);

    // On récupère quelques événements et on filtre localement les prochains.
    // Microsoft Graph: /me/events avec tri
    const url =
      "https://graph.microsoft.com/v1.0/me/events?$orderby=start/dateTime&$top=10&$select=subject,organizer,start,end,location,webLink";

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      setEvents([]);
      setLoading(false);
      setError(`Erreur Outlook (${res.status})`);
      return;
    }

    const json = await res.json();
    const items: any[] = json?.value ?? [];

    const now = new Date();
    const mapped: CalendarEvent[] = items
      .map((item) => {
        const title = item.subject || "Événement";
        const place =
          item.location?.displayName ||
          item.organizer?.emailAddress?.name ||
          "Agenda";
        const startIso = item.start?.dateTime;
        const endIso = item.end?.dateTime;
        if (!startIso || !endIso) return null;

        const startDec = toHourDecimal(startIso);
        const endDec = toHourDecimal(endIso);

        return {
          title,
          place,
          start: startDec,
          end: endDec,
          url: item.webLink,
          raw: item,
        };
      })
      .filter(Boolean) as CalendarEvent[];

    // Filtrer uniquement les événements à venir (optionnel)
    const upcoming = mapped.filter((e) => {
      const startDate =
        (e.raw?.start?.dateTime && new Date(e.raw.start.dateTime)) || null;
      return startDate ? startDate.getTime() >= now.getTime() : true;
    });

    setEvents(upcoming);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  React.useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(() => {
      fetchEvents();
    });
    return () => data.subscription.unsubscribe();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    connected,
    refresh: fetchEvents,
  };
}