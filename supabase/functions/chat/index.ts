/* @ts-nocheck */
import OpenAI from "npm:openai@4";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("🚀 [Chat] Request received");

  try {
    // Verify Content-Type
    const contentType = req.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      console.error("❌ Missing or invalid Content-Type:", contentType);
      return new Response(
        JSON.stringify({ error: "Content-Type must be application/json" }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Parse body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("❌ Invalid JSON body:", e);
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    const { message, messages } = body;

    // Support both single message and messages array
    let chatMessages;
    if (messages && Array.isArray(messages)) {
      chatMessages = messages;
    } else if (message) {
      chatMessages = [{ role: "user", content: message }];
    } else {
      console.error("❌ Missing message or messages field");
      return new Response(
        JSON.stringify({ error: "Missing 'message' or 'messages' field" }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    console.log("💬 Calling OpenAI with messages:", chatMessages);

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: chatMessages,
      temperature: 0.7,
    });

    console.log("✅ OpenAI response received");

    const assistantMessage = response.choices[0]?.message?.content || "Pas de réponse";

    return new Response(
      JSON.stringify({ 
        output_text: assistantMessage,
        full_response: response 
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error("💥 Exception:", error);
    
    // Check if it's an OpenAI API error
    if (error instanceof Error) {
      console.error("💥 Error message:", error.message);
      console.error("💥 Error stack:", error.stack);
    }

    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
});