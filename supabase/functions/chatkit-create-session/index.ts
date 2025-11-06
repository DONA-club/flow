/* @ts-nocheck */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const WORKFLOW_ID = Deno.env.get("CHATKIT_WORKFLOW_ID");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("🚀 [ChatKit Session] Creating new session");

  try {
    if (!OPENAI_API_KEY || !WORKFLOW_ID) {
      console.error("❌ Missing env vars");
      return new Response(
        JSON.stringify({ error: "Missing OPENAI_API_KEY or CHATKIT_WORKFLOW_ID" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Optional: get metadata from request
    let payload = {};
    try {
      payload = await req.json();
    } catch {
      // No body is fine
    }

    console.log("📤 Creating ChatKit session with workflow:", WORKFLOW_ID);

    const response = await fetch("https://api.openai.com/v1/chatkit/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "chatkit_beta=v1",
      },
      body: JSON.stringify({
        workflow_id: WORKFLOW_ID,
        metadata: {
          source: "supabase-edge",
          ...payload?.metadata,
        },
        expires_in_seconds: 600, // 10 minutes
      }),
    });

    const text = await response.text();
    
    if (!response.ok) {
      console.error("❌ ChatKit session creation failed:", text);
      return new Response(
        JSON.stringify({ 
          error: "ChatKit session creation failed", 
          details: text 
        }),
        { 
          status: response.status, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    console.log("✅ Session created successfully");
    
    // Return the full response (includes client_secret, id, etc.)
    return new Response(text, {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

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