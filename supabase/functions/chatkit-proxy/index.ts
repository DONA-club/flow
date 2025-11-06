/* @ts-nocheck */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CHATKIT_API_BASE = "https://chatkit.openai.com/api/v1";
const WORKFLOW_ID = "wf_68e76f7e35b08190a65e0350e1b43ff20dc8cbc65c270e59";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

if (!OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY not set in environment");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("🚀 [ChatKit Proxy] Received request");

  try {
    const body = await req.json();
    console.log("📦 [ChatKit Proxy] Body:", JSON.stringify(body));

    const { message } = body;
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: "Missing message parameter" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("📝 [ChatKit Proxy] User message:", message);

    // Step 1: Create a session
    console.log("🔑 [ChatKit Proxy] Creating session...");
    const sessionResponse = await fetch(`${CHATKIT_API_BASE}/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ workflow_id: WORKFLOW_ID }),
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error("❌ [ChatKit Proxy] Session creation failed:", errorText);
      return new Response(
        JSON.stringify({ 
          error: `Failed to create session (${sessionResponse.status})`,
          details: errorText 
        }),
        { status: sessionResponse.status, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const sessionData = await sessionResponse.json();
    const sessionId = sessionData.id;
    console.log("✅ [ChatKit Proxy] Session created:", sessionId);

    // Step 2: Send message to the session
    console.log("💬 [ChatKit Proxy] Sending message to session...");
    const messageResponse = await fetch(`${CHATKIT_API_BASE}/sessions/${sessionId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        role: "user",
        content: message,
      }),
    });

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      console.error("❌ [ChatKit Proxy] Message send failed:", errorText);
      return new Response(
        JSON.stringify({ 
          error: `Failed to send message (${messageResponse.status})`,
          details: errorText 
        }),
        { status: messageResponse.status, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const messageData = await messageResponse.json();
    console.log("✅ [ChatKit Proxy] Message sent, response:", JSON.stringify(messageData));

    // Step 3: Get the assistant's response
    // The response should contain the assistant's message
    const assistantMessage = messageData.content || messageData.output_text || "Pas de réponse";

    return new Response(
      JSON.stringify({ 
        output_text: assistantMessage,
        session_id: sessionId,
        full_response: messageData
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("💥 [ChatKit Proxy] Exception:", error);
    console.error("💥 [ChatKit Proxy] Error stack:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});