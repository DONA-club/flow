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

// IMPORTANT: n'utilise plus provider_token pour Microsoft (risque de récupérer le jeton Google)
async function resolveMicrosoftAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const session: any = data?.session ?? null;
  const msIdentity = resolveMicrosoftIdentity(session);
  const fromIdentity: string | null = msIdentity?.identity_data?.access_token ?? null;
  return fromIdentity || null;
}

// IMPORTANT: n'utilise plus provider_refresh_token pour Microsoft (risque de récupérer le refresh Google)
async function resolveMicrosoftRefreshToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const session: any = data?.session ?? null;
  const msIdentity = resolveMicrosoftIdentity(session);
  const fromIdentity: string | null = msIdentity?.identity_data?.refresh_token ?? null;
  return fromIdentity || null;
}

function isLikelyJwt(token: string | null): boolean {
  if (!token || typeof token !== "string") return false;
  return token.split(".").length === 3;
}

async function refreshAccessTokenViaEdge(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const session: any = data?.session ?? null;

  const refreshToken = await resolveMicrosoftRefreshToken();
  const supaAccess = session?.access_token;

  if (!refreshToken || !supaAccess) return null;

  const scopes = "Calendars.Read offline_access openid profile email";

  const { data: resp, error } = await supabase.functions.invoke("microsoft-token-refresh", {
    body: { refresh_token: refreshToken, scope: scopes },
    headers: {
      Authorization: `Bearer ${supaAccess}`,
    },
  });

  if (error) return null;
  const accessToken: string | undefined = (resp as any)?.access_token;
  return accessToken || null;
}

export function useOutlookCalendar(): Result {
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [connected, setConnected] = React.useState(false);

  const fetchEvents = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    let token = await resolveMicrosoftAccessToken();

    // Si pas de token identité ou token non-JWT => tenter refresh uniquement si on a un refresh_token Microsoft
    if (!isLikelyJwt(token || null)) {
      const refreshed = await refreshAccessTokenViaEdge();
      if (refreshed && isLikelyJwt(refreshed)) {
        token = refreshed;
        setConnected(true);
      } else {
        setConnected(false);
        setEvents([]);
        setLoading(false);
        setError(
          "Jeton Microsoft manquant/expiré. Cliquez sur Microsoft et acceptez l’accès (Calendars.Read + offline_access)."
        );
        return;
      }
    } else {
      setConnected(true);
    }

    // Fenêtre de 3 jours via calendarView
    const now = new Date();
    const end = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const startISO = now.toISOString();
    const endISO = end.toISOString();

    const url =
      "https://graph.microsoft.com/v1.0/me/calendarview" +
      `?startDateTime=${encodeURIComponent(startISO)}` +
      `&endDateTime=${encodeURIComponent(endISO)}` +
      "&$orderby=start/dateTime" +
      "&$select=subject,organizer,start,end,location,webLink";

    const doFetch = async (tkn: string) => {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${tkn}`,
          Accept: "application/json",
        },
      });
      return res;
    };

    let res = await doFetch(token as string);
    if (!res.ok && (res.status === 401 || res.status === 403)) {
      // Tentative de refresh si non autorisé (et si refresh_token Microsoft disponible)
      const refreshed = await refreshAccessTokenViaEdge();
      if (refreshed && isLikelyJwt(refreshed)) {
        token = refreshed;
        setConnected(true);
        res = await doFetch(token);
      } else {
        setConnected(false);
        setEvents([]);
        setLoading(false);
        setError("Session Microsoft expirée et aucun refresh disponible. Reconnectez Microsoft (consent).");
        return;
      }
    }

    if (!res.ok) {
      setEvents([]);
      setLoading(false);
      setError(
        res.status === 403
          ? "Accès Outlook refusé. Autorisez Calendars.Read et réessayez."
          : `Erreur Outlook (${res.status})`
      );
      return;
    }

    const json = await res.json();
    const items: any[] = json?.value ?? [];
    const nowRef = new Date();

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

    // Sécurité: ne garder que les événements à venir
    const upcoming = mapped.filter((e) => {
      const startDate =
        (e.raw?.start?.dateTime && new Date(e.raw.start.dateTime)) || null;
      return startDate ? startDate.getTime() >= nowRef.getTime() : true;
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