/* @ts-nocheck */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const CHATKIT_WORKFLOW_ID = Deno.env.get("CHATKIT_WORKFLOW_ID");
const CHATKIT_DOMAIN_KEY = Deno.env.get("CHATKIT_DOMAIN_KEY");
const FRONTEND_ORIGIN = Deno.env.get("FRONTEND_ORIGIN") || "*";

function cors(h: Record<string, string> = {}) {
  return {
    "Access-Control-Allow-Origin": FRONTEND_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
    ...h,
  };
}

serve(async (req) => {
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
    if (!OPENAI_API_KEY) {
      console.error("❌ Missing OPENAI_API_KEY");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: cors({ "Content-Type": "application/json" }) }
      );
    }

    if (!CHATKIT_WORKFLOW_ID) {
      console.error("❌ Missing CHATKIT_WORKFLOW_ID");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: cors({ "Content-Type": "application/json" }) }
      );
    }

    if (!CHATKIT_DOMAIN_KEY) {
      console.error("❌ Missing CHATKIT_DOMAIN_KEY");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: cors({ "Content-Type": "application/json" }) }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: cors({ "Content-Type": "application/json" }) }
      );
    }

    const { deviceId, existingClientSecret } = body;

    if (!deviceId || typeof deviceId !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid deviceId" }),
        { status: 400, headers: cors({ "Content-Type": "application/json" }) }
      );
    }

    // Create ChatKit session
    const sessionResponse = await fetch("https://api.openai.com/v1/chatkit/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "chatkit_beta=v1",
      },
      body: JSON.stringify({
        workflow: {
          id: CHATKIT_WORKFLOW_ID,
        },
        user: deviceId,
        // Don't include messages here - let the widget handle conversation
      }),
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error("❌ ChatKit session creation failed:", errorText);
      return new Response(
        JSON.stringify({ 
          error: "Failed to create ChatKit session",
          details: errorText 
        }),
        { status: sessionResponse.status, headers: cors({ "Content-Type": "application/json" }) }
      );
    }

    const sessionData = await sessionResponse.json();

    return new Response(
      JSON.stringify({ 
        client_secret: sessionData.client_secret 
      }),
      { status: 200, headers: cors({ "Content-Type": "application/json" }) }
    );

  } catch (err) {
    console.error("💥 Error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: cors({ "Content-Type": "application/json" }) }
    );
  }
});