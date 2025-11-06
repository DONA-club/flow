/* @ts-nocheck */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const WORKFLOW_ID = Deno.env.get("CHATKIT_WORKFLOW_ID");
const DOMAIN_KEY = Deno.env.get("CHATKIT_DOMAIN_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("🚀 [ChatKit Session] Creating session...");

  try {
    if (!OPENAI_API_KEY || !WORKFLOW_ID) {
      console.error("❌ Missing OPENAI_API_KEY or CHATKIT_WORKFLOW_ID");
      return new Response(
        JSON.stringify({ error: "Missing required environment variables" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Parse optional metadata from request
    let metadata = {};
    try {
      const body = await req.json();
      metadata = body?.metadata || {};
    } catch (_) {
      // No body or invalid JSON, use empty metadata
    }

    // Create ChatKit session payload
    const sessionPayload: any = {
      workflow: { id: WORKFLOW_ID },
      user: crypto.randomUUID(),
      chatkit_configuration: {
        file_upload: { enabled: false },
      },
      metadata: {
        source: "dona-club",
        ...metadata,
      },
    };

    // Add domain_key if available
    if (DOMAIN_KEY) {
      sessionPayload.domain_key = DOMAIN_KEY;
    }

    console.log("📤 Creating session with workflow:", WORKFLOW_ID);

    const response = await fetch("https://api.openai.com/v1/chatkit/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "chatkit_beta=v1",
      },
      body: JSON.stringify(sessionPayload),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("❌ Session creation failed:", responseText);
      return new Response(
        JSON.stringify({ 
          error: "Failed to create ChatKit session",
          status: response.status,
          details: responseText 
        }),
        { status: response.status, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const sessionData = JSON.parse(responseText);
    console.log("✅ Session created:", sessionData.id);

    // Return the session data (includes client_secret)
    return new Response(
      JSON.stringify({
        client_secret: sessionData.client_secret,
        session_id: sessionData.id,
        expires_after: sessionData.expires_after,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("💥 Exception:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});