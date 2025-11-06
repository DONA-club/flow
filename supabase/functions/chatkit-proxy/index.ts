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

  console.log("🚀 [ChatKit Proxy] Request received");

  try {
    if (!OPENAI_API_KEY || !WORKFLOW_ID) {
      console.error("❌ Missing env vars");
      return new Response(
        JSON.stringify({ error: "Missing OPENAI_API_KEY or CHATKIT_WORKFLOW_ID" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body = await req.json();
    const { message, session_id } = body;

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Missing message parameter" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("📝 Message:", message);
    console.log("🔑 Session ID:", session_id || "none");

    let sessionId = session_id;

    // Step 1: Create session if needed
    if (!sessionId) {
      console.log("🔑 Creating new session...");
      
      const userId = crypto.randomUUID();
      
      const sessionResponse = await fetch("https://api.openai.com/v1/chatkit/sessions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "chatkit_beta=v1",
        },
        body: JSON.stringify({
          workflow: { id: WORKFLOW_ID },
          user: userId,
          chatkit_configuration: {
            file_upload: { enabled: false },
          },
        }),
      });

      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text();
        console.error("❌ Session creation failed:", errorText);
        return new Response(
          JSON.stringify({ 
            error: `Session creation failed (${sessionResponse.status})`,
            details: errorText 
          }),
          { status: sessionResponse.status, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const sessionData = await sessionResponse.json();
      sessionId = sessionData.id;
      console.log("✅ Session created:", sessionId);
    }

    // Step 2: Send message to session
    console.log("💬 Sending message to session...");
    
    const messageResponse = await fetch(`https://api.openai.com/v1/chatkit/sessions/${sessionId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "chatkit_beta=v1",
      },
      body: JSON.stringify({
        role: "user",
        content: message,
      }),
    });

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      console.error("❌ Message send failed:", errorText);
      return new Response(
        JSON.stringify({ 
          error: `Message send failed (${messageResponse.status})`,
          details: errorText 
        }),
        { status: messageResponse.status, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const messageData = await messageResponse.json();
    console.log("✅ Message response:", JSON.stringify(messageData));

    // Extract assistant's response
    const assistantMessage = messageData.content || messageData.output_text || messageData.text || "Pas de réponse";

    return new Response(
      JSON.stringify({ 
        output_text: assistantMessage,
        session_id: sessionId,
        full_response: messageData
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