/* @ts-nocheck */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CHATKIT_API_BASE = "https://api.openai.com";
const WORKFLOW_ID = "wf_68e76f7e35b08190a65e0350e1b43ff20dc8cbc65c270e59";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("🚀 [ChatKit Proxy] Received request");
  console.log("📋 [ChatKit Proxy] Method:", req.method);
  console.log("📋 [ChatKit Proxy] Content-Type:", req.headers.get("content-type"));

  try {
    // Get API key
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("❌ [ChatKit Proxy] OPENAI_API_KEY not set");
      return new Response(
        JSON.stringify({ error: "Server configuration error: Missing API key" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    console.log("✅ [ChatKit Proxy] API key found");

    // Parse request body
    let body;
    try {
      const rawBody = await req.text();
      console.log("📦 [ChatKit Proxy] Raw body:", rawBody);
      body = JSON.parse(rawBody);
      console.log("✅ [ChatKit Proxy] Parsed body:", JSON.stringify(body));
    } catch (parseError) {
      console.error("❌ [ChatKit Proxy] Failed to parse body:", parseError);
      return new Response(
        JSON.stringify({ 
          error: "Invalid request body",
          details: parseError.message 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { message, session_id } = body;
    
    if (!message) {
      console.error("❌ [ChatKit Proxy] Missing message in body");
      return new Response(
        JSON.stringify({ error: "Missing message parameter" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("📝 [ChatKit Proxy] User message:", message);
    console.log("🔑 [ChatKit Proxy] Session ID:", session_id || "none");

    let sessionId = session_id;

    // Step 1: Create a session if we don't have one
    if (!sessionId) {
      console.log("🔑 [ChatKit Proxy] Creating new session...");
      
      const userId = crypto.randomUUID();
      console.log("👤 [ChatKit Proxy] Generated user ID:", userId);
      
      const sessionPayload = {
        workflow: { id: WORKFLOW_ID },
        user: userId,
        chatkit_configuration: {
          file_upload: {
            enabled: false,
          },
        },
      };
      
      console.log("📤 [ChatKit Proxy] Session payload:", JSON.stringify(sessionPayload));
      
      try {
        const sessionResponse = await fetch(`${CHATKIT_API_BASE}/v1/chatkit/sessions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "OpenAI-Beta": "chatkit_beta=v1",
          },
          body: JSON.stringify(sessionPayload),
        });

        console.log("📡 [ChatKit Proxy] Session response status:", sessionResponse.status);

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
      } catch (sessionError) {
        console.error("💥 [ChatKit Proxy] Session creation exception:", sessionError);
        return new Response(
          JSON.stringify({ 
            error: "Failed to create session",
            details: sessionError.message 
          }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Step 2: Send message to the session
    console.log("💬 [ChatKit Proxy] Sending message to session:", sessionId);
    
    const messagePayload = {
      role: "user",
      content: message,
    };
    
    console.log("📤 [ChatKit Proxy] Message payload:", JSON.stringify(messagePayload));
    
    try {
      const messageResponse = await fetch(`${CHATKIT_API_BASE}/v1/chatkit/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "chatkit_beta=v1",
        },
        body: JSON.stringify(messagePayload),
      });

      console.log("📡 [ChatKit Proxy] Message response status:", messageResponse.status);

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
      console.log("✅ [ChatKit Proxy] Message response data:", JSON.stringify(messageData));

      // Extract the assistant's response
      let assistantMessage = "Pas de réponse";
      
      if (messageData.content) {
        assistantMessage = messageData.content;
      } else if (messageData.output_text) {
        assistantMessage = messageData.output_text;
      } else if (messageData.text) {
        assistantMessage = messageData.text;
      }

      console.log("✨ [ChatKit Proxy] Assistant message:", assistantMessage);

      return new Response(
        JSON.stringify({ 
          output_text: assistantMessage,
          session_id: sessionId,
          full_response: messageData
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } catch (messageError) {
      console.error("💥 [ChatKit Proxy] Message send exception:", messageError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to send message",
          details: messageError.message 
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

  } catch (error) {
    console.error("💥 [ChatKit Proxy] Top-level exception:", error);
    console.error("💥 [ChatKit Proxy] Error name:", error.name);
    console.error("💥 [ChatKit Proxy] Error message:", error.message);
    console.error("💥 [ChatKit Proxy] Error stack:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : "Unknown"
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});