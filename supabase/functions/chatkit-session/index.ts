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
      beta_header_needed: true,
      region: Deno.env.get("SUPABASE_REGION") ?? null,
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
      
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error",
          missing_secrets: missing,
          hint: "Set these secrets in Supabase Dashboard > Edge Functions > Manage Secrets"
        }),
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

    console.log(`[ChatKit] Creating session for device: ${deviceId.substring(0, 8)}...`);

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
      }),
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error(`[ChatKit] OpenAI API error ${sessionResponse.status}:`, errorText);
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to create ChatKit session",
          status: sessionResponse.status,
          details: errorText,
          hint: sessionResponse.status === 401 
            ? "Check OPENAI_API_KEY is valid"
            : sessionResponse.status === 404
            ? "Check CHATKIT_WORKFLOW_ID exists in your OpenAI account"
            : "Check OpenAI API status"
        }),
        { status: sessionResponse.status, headers: cors({ "Content-Type": "application/json" }) }
      );
    }

    const sessionData = await sessionResponse.json();
    
    console.log(`[ChatKit] Session created successfully`);

    return new Response(
      JSON.stringify({ 
        client_secret: sessionData.client_secret 
      }),
      { status: 200, headers: cors({ "Content-Type": "application/json" }) }
    );

  } catch (err) {
    console.error("[ChatKit] Unexpected error:", err);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: String(err),
        stack: err instanceof Error ? err.stack : undefined
      }),
      { status: 500, headers: cors({ "Content-Type": "application/json" }) }
    );
  }
});