/* @ts-nocheck */
// Supabase Edge Function — Create ChatKit Session
// Equivalent to the Python FastAPI server in ChatKit docs
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const CHATKIT_WORKFLOW_ID = Deno.env.get("CHATKIT_WORKFLOW_ID");
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

  console.log("🔐 [ChatKit] Creating session...");

  try {
    if (!OPENAI_API_KEY || !CHATKIT_WORKFLOW_ID) {
      console.error("❌ [ChatKit] Missing configuration");
      return new Response(
        JSON.stringify({ error: "Missing OPENAI_API_KEY or CHATKIT_WORKFLOW_ID" }),
        { status: 500, headers: cors({ "Content-Type": "application/json" }) }
      );
    }

    // Parse body to get user_id (device_id)
    let body;
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const user_id = body.user_id || body.device_id || "anonymous";

    console.log("👤 [ChatKit] Creating session for user:", user_id);

    // Create ChatKit session (equivalent to openai.chatkit.sessions.create())
    const response = await fetch("https://api.openai.com/v1/chatkit/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "OpenAI-Beta": "chatkit_beta=v1",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        workflow: { id: CHATKIT_WORKFLOW_ID },
        user: user_id,
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("❌ [ChatKit] Session creation failed:", response.status, responseText);
      return new Response(
        JSON.stringify({ 
          error: "CHATKIT_SESSION_CREATE_FAILED", 
          details: responseText,
          status: response.status 
        }),
        { status: response.status, headers: cors({ "Content-Type": "application/json" }) }
      );
    }

    const session = JSON.parse(responseText);
    console.log("✅ [ChatKit] Session created:", session.id);

    // Return client_secret (as per ChatKit docs)
    return new Response(
      JSON.stringify({ 
        client_secret: session.client_secret,
        session_id: session.id 
      }),
      { status: 200, headers: cors({ "Content-Type": "application/json" }) }
    );

  } catch (e) {
    console.error("💥 [ChatKit] Exception:", e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: cors({ "Content-Type": "application/json" }) }
    );
  }
});