/* @ts-nocheck */
import OpenAI from "npm:openai@4";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

const ORIGIN = "*"; // In production: "https://visualiser.dona.club"

function corsHeaders(additionalHeaders: Record<string, string> = {}) {
  return {
    "Access-Control-Allow-Origin": ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    ...additionalHeaders,
  };
}

const sseHeaders = {
  ...corsHeaders(),
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  "Connection": "keep-alive",
};

const te = new TextEncoder();

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    console.log("✅ [Chat] Handling OPTIONS preflight");
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders() 
    });
  }

  console.log("🚀 [Chat] Request received");

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
      console.log("📦 [Chat] Body parsed");
    } catch (e) {
      console.error("❌ [Chat] Invalid JSON body:", e);
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { 
          status: 400, 
          headers: corsHeaders({ "Content-Type": "application/json" })
        }
      );
    }

    const { message, messages, stream } = body;

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
        JSON.stringify({ error: "Missing 'message' or 'messages' field" }),
        { 
          status: 400, 
          headers: corsHeaders({ "Content-Type": "application/json" })
        }
      );
    }

    // --- NON-STREAMING MODE (backward compatible) ---
    if (!stream) {
      console.log("🤖 [Chat] Non-streaming mode");
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: chatMessages,
        temperature: 0.7,
      });

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
    }

    // --- STREAMING SSE MODE ---
    console.log("🌊 [Chat] Streaming mode enabled");

    const streamBody = new ReadableStream({
      async start(controller) {
        const send = (data: unknown) => {
          controller.enqueue(te.encode(`data: ${JSON.stringify(data)}\n\n`));
        };
        
        const sendEvent = (event: string) => {
          controller.enqueue(te.encode(`event: ${event}\n\n`));
        };

        try {
          // Send open event
          sendEvent("open");
          console.log("📡 [Chat] Stream opened");

          // Create streaming completion
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: chatMessages,
            temperature: 0.7,
            stream: true,
          });

          console.log("🔄 [Chat] Streaming from OpenAI...");

          // Stream tokens
          for await (const part of completion) {
            const delta = part.choices?.[0]?.delta?.content;
            if (delta) {
              send({ token: delta });
            }
          }

          // Send done marker
          send("[DONE]");
          console.log("✅ [Chat] Stream completed");

        } catch (e) {
          console.error("💥 [Chat] Stream error:", e);
          send({ error: String(e) });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(streamBody, { 
      status: 200, 
      headers: sseHeaders 
    });

  } catch (error) {
    console.error("💥 [Chat] Exception:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500, 
        headers: corsHeaders({ "Content-Type": "application/json" })
      }
    );
  }
});