/* @ts-nocheck */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const CHATKIT_WORKFLOW_ID = Deno.env.get("CHATKIT_WORKFLOW_ID");
const CHATKIT_DOMAIN_KEY = Deno.env.get("CHATKIT_DOMAIN_KEY");
const FRONTEND_ORIGIN = Deno.env.get("FRONTEND_ORIGIN") || "*";

function cors(h: Record<string, string> = {}) {
  return {
    "Access-Control-Allow-Origin": FRONTEND_ORIGIN,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
    ...h,
  };
}

function byteLen(obj: unknown) {
  const str = typeof obj === "string" ? obj : JSON.stringify(obj || "");
  return new TextEncoder().encode(str).length;
}

serve(async (req) => {
  const url = new URL(req.url);

  if (url.pathname.endsWith("/health")) {
    const health = {
      ok: true,
      has_OPENAI_KEY: !!OPENAI_API_KEY,
      has_WORKFLOW_ID: !!CHATKIT_WORKFLOW_ID,
      has_DOMAIN_KEY: !!CHATKIT_DOMAIN_KEY,
      timestamp: new Date().toISOString(),
    };
    return new Response(JSON.stringify(health), {
      status: 200,
      headers: cors({ "Content-Type": "application/json" }),
    });
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: cors() });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: cors({ "Content-Type": "application/json" }),
    });
  }

  try {
    if (!OPENAI_API_KEY || !CHATKIT_WORKFLOW_ID || !CHATKIT_DOMAIN_KEY) {
      const missing = [];
      if (!OPENAI_API_KEY) missing.push("OPENAI_API_KEY");
      if (!CHATKIT_WORKFLOW_ID) missing.push("CHATKIT_WORKFLOW_ID");
      if (!CHATKIT_DOMAIN_KEY) missing.push("CHATKIT_DOMAIN_KEY");
      return new Response(
        JSON.stringify({ error: "Server configuration error", missing_secrets: missing }),
        { status: 500, headers: cors({ "Content-Type": "application/json" }) },
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: cors({ "Content-Type": "application/json" }),
      });
    }

    const { deviceId, existingClientSecret, pageContext } = body;
    if (!deviceId || typeof deviceId !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid deviceId" }), {
        status: 400,
        headers: cors({ "Content-Type": "application/json" }),
      });
    }

    let contextToSend = undefined;
    if (pageContext) {
      // Garde-fou taille (ex: 16 KB)
      const MAX_BYTES = 16_000;
      if (byteLen(pageContext) > MAX_BYTES) {
        const slim = {
          page: {
            url: pageContext.page?.url,
            title: pageContext.page?.title,
          },
          calendar: {
            currentDate: pageContext.calendar?.currentDate,
            displayedDay: pageContext.calendar?.displayedDay,
            sunrise: pageContext.calendar?.sunrise,
            sunset: pageContext.calendar?.sunset,
            timezoneOffset: pageContext.calendar?.timezoneOffset,
          },
          events: {
            total: pageContext.events?.total,
            upcoming: (pageContext.events?.upcoming || []).slice(0, 8),
            currentEvent: pageContext.events?.currentEvent || null,
          },
          sleep: {
            connected: pageContext.sleep?.connected,
            wakeHour: pageContext.sleep?.wakeHour,
            bedHour: pageContext.sleep?.bedHour,
            totalSleepHours: pageContext.sleep?.totalSleepHours,
            debtOrCapital: pageContext.sleep?.debtOrCapital,
            idealBedHour: pageContext.sleep?.idealBedHour,
          },
          connections: pageContext.connections || {},
          ui: {
            calendarSize: pageContext.ui?.calendarSize,
            isHoveringRing: !!pageContext.ui?.isHoveringRing,
            selectedEvent: pageContext.ui?.selectedEvent || null,
            chatkitExpanded: !!pageContext.ui?.chatkitExpanded,
          },
          user: {
            deviceId: pageContext.user?.deviceId,
            language: pageContext.user?.language,
            timezone: pageContext.user?.timezone,
          },
          timestamp: pageContext.timestamp,
          theme: pageContext.theme,
        };
        contextToSend = { page_context: slim };
        console.log(`[ChatKit] Context trimmed from ${byteLen(pageContext)} to ${byteLen(slim)} bytes`);
      } else {
        // Envoi de l'objet JSON brut (pas de stringify pretty)
        contextToSend = { page_context: pageContext };
        console.log(`[ChatKit] Context size: ${byteLen(pageContext)} bytes`);
      }
    }

    const sessionPayload: any = {
      workflow: { id: CHATKIT_WORKFLOW_ID },
      user: deviceId,
      ...(contextToSend ? { context: contextToSend } : {}),
    };

    const headers: Record<string, string> = {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
      "OpenAI-Beta": "chatkit_beta=v1",
      "X-ChatKit-Domain-Key": CHATKIT_DOMAIN_KEY,
    };

    const sessionResponse = await fetch("https://api.openai.com/v1/chatkit/sessions", {
      method: "POST",
      headers,
      body: JSON.stringify(sessionPayload),
    });

    const respText = await sessionResponse.text();
    if (!sessionResponse.ok) {
      console.error(`[ChatKit] API error ${sessionResponse.status}:`, respText);
      return new Response(
        JSON.stringify({
          error: "Failed to create ChatKit session",
          status: sessionResponse.status,
          openai_error: respText,
        }),
        { status: 400, headers: cors({ "Content-Type": "application/json" }) },
      );
    }

    const sessionData = JSON.parse(respText);
    if (contextToSend) console.log("[ChatKit] Session created with page_context");

    return new Response(
      JSON.stringify({ client_secret: sessionData.client_secret, context_sent: !!contextToSend }),
      { status: 200, headers: cors({ "Content-Type": "application/json" }) },
    );
  } catch (err) {
    console.error("[ChatKit] Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: cors({ "Content-Type": "application/json" }),
    });
  }
});