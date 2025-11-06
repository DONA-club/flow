/* @ts-nocheck */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CHATKIT_API_BASE = "https://api.openai.com";
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

    const { message, session_id } = body;
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: "Missing message parameter" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("📝 [ChatKit Proxy] User message:", message);

    let sessionId = session_id;

    // Step 1: Create a session if we don't have one
    if (!sessionId) {
      console.log("🔑 [ChatKit Proxy] Creating new session...");
      
      // Generate a user ID (in production, use actual user ID)
      const userId = crypto.randomUUID();
      
      const sessionResponse = await fetch(`${CHATKIT_API_BASE}/v1/chatkit/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "chatkit_beta=v1",
        },
        body: JSON.stringify({
          workflow: { id: WORKFLOW_ID },
          user: userId,
          chatkit_configuration: {
            file_upload: {
              enabled: false,
            },
          },
        }),
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
      sessionId = sessionData.id;
      console.log("✅ [ChatKit Proxy] Session created:", sessionId);
    }

    // Step 2: Send message to the session
    console.log("💬 [ChatKit Proxy] Sending message to session:", sessionId);
    const messageResponse = await fetch(`${CHATKIT_API_BASE}/v1/chatkit/sessions/${sessionId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "chatkit_beta=v1",
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
    console.log("✅ [ChatKit Proxy] Message response:", JSON.stringify(messageData));

    // Extract the assistant's response
    let assistantMessage = "Pas de réponse";
    
    if (messageData.content) {
      assistantMessage = messageData.content;
    } else if (messageData.output_text) {
      assistantMessage = messageData.output_text;
    } else if (messageData.text) {
      assistantMessage = messageData.text;
    }

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