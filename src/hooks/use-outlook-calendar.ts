"use client";

import React from "react";
import { supabase } from "@/integrations/supabase/client";

export type CalendarEvent = {
  title: string;
  place: string;
  start: number;
  end: number;
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

type Options = {
  enabled?: boolean;
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

function isAzureActive(session: any) {
  const p = session?.user?.app_metadata?.provider;
  return (
    p === "azure" ||
    p === "azure-oidc" ||
    p === "azuread" ||
    p === "microsoft" ||
    p === "outlook"
  );
}

async function resolveMicrosoftAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const session: any = data?.session ?? null;
  const msIdentity = resolveMicrosoftIdentity(session);
  const fromIdentity: string | null =
    msIdentity?.identity_data?.access_token ?? null;

  if (fromIdentity) return fromIdentity;

  if (isAzureActive(session)) {
    return session?.provider_token ?? null;
  }
  return null;
}

async function resolveMicrosoftRefreshToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const session: any = data?.session ?? null;
  const msIdentity = resolveMicrosoftIdentity(session);
  const fromIdentity: string | null =
    msIdentity?.identity_data?.refresh_token ?? null;

  if (fromIdentity) return fromIdentity;

  if (isAzureActive(session)) {
    return session?.provider_refresh_token ?? null;
  }
  return null;
}

async function refreshAccessTokenViaEdge(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const session: any = data?.session ?? null;

  const refreshToken = await resolveMicrosoftRefreshToken();
  const supaAccess = session?.access_token;

  if (!refreshToken || !supaAccess) return null;

  const scopes = "Calendars.Read offline_access openid profile email";

  const { data: resp, error } = await supabase.functions.invoke(
    "microsoft-token-refresh",
    {
      body: { refresh_token: refreshToken, scope: scopes },
      headers: {
        Authorization: `Bearer ${supaAccess}`,
      },
    }
  );

  if (error) return null;
  const accessToken: string | undefined = (resp as any)?.access_token;
  return accessToken || null;
}

export function useOutlookCalendar(options?: Options): Result {
  const enabled = options?.enabled ?? true;

  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [connected, setConnected] = React.useState(false);

  const fetchEvents = React.useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    let token = await resolveMicrosoftAccessToken();

    // Si aucun token, essayer de rafraîchir via refresh_token
    if (!token) {
      const refreshed = await refreshAccessTokenViaEdge();
      token = refreshed;
    }

    if (!token) {
      setConnected(false);
      setEvents([]);
      setLoading(false);
      setError(
        "Aucun jeton Microsoft disponible. Cliquez sur Microsoft et acceptez l’accès (Calendars.Read + offline_access)."
      );
      return;
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

    // Premier essai avec le token disponible (opaque ou JWT, peu importe)
    let res = await doFetch(token);

    // Si non autorisé, tenter un refresh et réessayer
    if (!res.ok && (res.status === 401 || res.status === 403)) {
      const refreshed = await refreshAccessTokenViaEdge();
      if (refreshed) {
        token = refreshed;
        res = await doFetch(token);
        setConnected(true);
      } else {
        setConnected(false);
        setEvents([]);
        setLoading(false);
        setError(
          "Session Microsoft expirée et aucun refresh disponible. Reconnectez Microsoft (consent)."
        );
        return;
      }
    } else {
      setConnected(true);
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

    const upcoming = mapped.filter((e) => {
      const startDate =
        (e.raw?.start?.dateTime && new Date(e.raw.start.dateTime)) || null;
      return startDate ? startDate.getTime() >= nowRef.getTime() : true;
    });

    setEvents(upcoming);
    setLoading(false);
  }, [enabled]);

  React.useEffect(() => {
    if (!enabled) return;
    fetchEvents();
  }, [enabled, fetchEvents]);

  React.useEffect(() => {
    if (!enabled) return;
    const { data } = supabase.auth.onAuthStateChange(() => {
      fetchEvents();
    });
    return () => data.subscription.unsubscribe();
  }, [enabled, fetchEvents]);

  return {
    events,
    loading,
    error,
    connected,
    refresh: fetchEvents,
  };
}