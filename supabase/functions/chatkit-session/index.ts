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

serve(async (req) => {
  const url = new URL(req.url);

  // Health check endpoint
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
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: cors({ "Content-Type": "application/json" }) }
    );
  }

  try {
    if (!OPENAI_API_KEY || !CHATKIT_WORKFLOW_ID || !CHATKIT_DOMAIN_KEY) {
      const missing = [];
      if (!OPENAI_API_KEY) missing.push("OPENAI_API_KEY");
      if (!CHATKIT_WORKFLOW_ID) missing.push("CHATKIT_WORKFLOW_ID");
      if (!CHATKIT_DOMAIN_KEY) missing.push("CHATKIT_DOMAIN_KEY");
      
      console.error("[ChatKit] Missing secrets:", missing);
      
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error",
          missing_secrets: missing,
        }),
        { status: 500, headers: cors({ "Content-Type": "application/json" }) }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("[ChatKit] Invalid JSON body:", e);
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: cors({ "Content-Type": "application/json" }) }
      );
    }

    const { deviceId, existingClientSecret, pageContext } = body;

    if (!deviceId || typeof deviceId !== "string") {
      console.error("[ChatKit] Missing or invalid deviceId");
      return new Response(
        JSON.stringify({ error: "Missing or invalid deviceId" }),
        { status: 400, headers: cors({ "Content-Type": "application/json" }) }
      );
    }

    // Create ChatKit session WITHOUT context (not supported in session creation)
    const sessionPayload: any = {
      workflow: {
        id: CHATKIT_WORKFLOW_ID,
      },
      user: deviceId,
    };

    const headers: Record<string, string> = {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
      "OpenAI-Beta": "chatkit_beta=v1",
    };

    if (CHATKIT_DOMAIN_KEY) {
      headers["X-ChatKit-Domain-Key"] = CHATKIT_DOMAIN_KEY;
    }

    console.log("[ChatKit] Creating session for user:", deviceId);

    const sessionResponse = await fetch("https://api.openai.com/v1/chatkit/sessions", {
      method: "POST",
      headers,
      body: JSON.stringify(sessionPayload),
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error(`[ChatKit] API error ${sessionResponse.status}:`, errorText);
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to create ChatKit session",
          status: sessionResponse.status,
          details: errorText,
        }),
        { status: sessionResponse.status, headers: cors({ "Content-Type": "application/json" }) }
      );
    }

    const sessionData = await sessionResponse.json();
    console.log("[ChatKit] Session created successfully");

    // If context provided, send it as first system message
    if (pageContext && sessionData.id) {
      console.log(`[ChatKit] Sending context as system message (${JSON.stringify(pageContext).length} chars)`);
      
      try {
        const contextMessage = {
          role: "system",
          content: `Page Context:\n${JSON.stringify(pageContext, null, 2)}`
        };

        const messageResponse = await fetch(
          `https://api.openai.com/v1/chatkit/sessions/${sessionData.id}/messages`,
          {
            method: "POST",
            headers,
            body: JSON.stringify(contextMessage),
          }
        );

        if (messageResponse.ok) {
          console.log("[ChatKit] Context sent successfully as system message");
        } else {
          const errorText = await messageResponse.text();
          console.error("[ChatKit] Failed to send context message:", errorText);
        }
      } catch (err) {
        console.error("[ChatKit] Error sending context:", err);
      }
    }

    return new Response(
      JSON.stringify({ 
        client_secret: sessionData.client_secret,
        context_sent: !!pageContext
      }),
      { status: 200, headers: cors({ "Content-Type": "application/json" }) }
    );

  } catch (err) {
    console.error("[ChatKit] Error:", err);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: err.message || String(err),
      }),
      { status: 500, headers: cors({ "Content-Type": "application/json" }) }
    );
  }
});