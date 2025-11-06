/* @ts-nocheck */
import OpenAI from "npm:openai@4";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

function corsHeaders(additionalHeaders: Record<string, string> = {}) {
  return {
    "Access-Control-Allow-Origin": "*", // In production, use specific domain
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    ...additionalHeaders,
  };
}

serve(async (req) => {
  // Handle CORS preflight - MUST return 200
  if (req.method === "OPTIONS") {
    console.log("✅ [Chat] Handling OPTIONS preflight");
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders() 
    });
  }

  console.log("🚀 [Chat] Request received");
  console.log("📋 [Chat] Method:", req.method);
  console.log("📋 [Chat] Content-Type:", req.headers.get("content-type"));

  try {
    // Check API key
    if (!Deno.env.get("OPENAI_API_KEY")) {
      console.error("❌ [Chat] OPENAI_API_KEY not set");
      return new Response(
        JSON.stringify({ error: "Server configuration error: OPENAI_API_KEY not set" }),
        { 
          status: 500, 
          headers: corsHeaders({ "Content-Type": "application/json" })
        }
      );
    }

    // Verify Content-Type
    const contentType = req.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      console.error("❌ [Chat] Invalid Content-Type:", contentType);
      return new Response(
        JSON.stringify({ error: "Content-Type must be application/json" }),
        { 
          status: 400, 
          headers: corsHeaders({ "Content-Type": "application/json" })
        }
      );
    }

    // Parse body
    let body;
    try {
      body = await req.json();
      console.log("📦 [Chat] Body parsed:", JSON.stringify(body, null, 2));
    } catch (e) {
      console.error("❌ [Chat] Invalid JSON body:", e);
      return new Response(
        JSON.stringify({ error: "Invalid JSON body", details: String(e) }),
        { 
          status: 400, 
          headers: corsHeaders({ "Content-Type": "application/json" })
        }
      );
    }

    const { message, messages } = body;

    // Support both single message and messages array
    let chatMessages;
    if (messages && Array.isArray(messages)) {
      chatMessages = messages;
      console.log("💬 [Chat] Using messages array with", messages.length, "messages");
    } else if (message) {
      chatMessages = [{ role: "user", content: message }];
      console.log("💬 [Chat] Using single message");
    } else {
      console.error("❌ [Chat] Missing message or messages field");
      return new Response(
        JSON.stringify({ error: "Missing 'message' or 'messages' field in request body" }),
        { 
          status: 400, 
          headers: corsHeaders({ "Content-Type": "application/json" })
        }
      );
    }

    console.log("🤖 [Chat] Calling OpenAI API...");
    console.log("📝 [Chat] Messages:", JSON.stringify(chatMessages, null, 2));

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: chatMessages,
      temperature: 0.7,
    });

    console.log("✅ [Chat] OpenAI response received");
    console.log("📨 [Chat] Response:", JSON.stringify(response, null, 2));

    const assistantMessage = response.choices[0]?.message?.content || "Pas de réponse";

    return new Response(
      JSON.stringify({ 
        output_text: assistantMessage,
        full_response: response 
      }),
      { 
        status: 200, 
        headers: corsHeaders({ "Content-Type": "application/json" })
      }
    );

  } catch (error) {
    console.error("💥 [Chat] Exception:", error);
    
    // Detailed error logging
    if (error instanceof Error) {
      console.error("💥 [Chat] Error name:", error.name);
      console.error("💥 [Chat] Error message:", error.message);
      console.error("💥 [Chat] Error stack:", error.stack);
    }

    // Check if it's an OpenAI API error
    let errorMessage = "Internal server error";
    let errorDetails = String(error);

    if (error && typeof error === 'object') {
      if ('message' in error) {
        errorMessage = String(error.message);
      }
      if ('response' in error) {
        console.error("💥 [Chat] OpenAI API error response:", error.response);
        errorDetails = JSON.stringify(error.response);
      }
    }

    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
        type: error?.constructor?.name || 'Unknown'
      }),
      { 
        status: 500, 
        headers: corsHeaders({ "Content-Type": "application/json" })
      }
    );
  }
});