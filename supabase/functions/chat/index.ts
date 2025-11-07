/* @ts-nocheck */
// Supabase Edge (Deno) — OpenAI ChatKit Sessions API avec workflow personnalisé
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import OpenAI from "npm:openai@4";

const ORIGIN = "*"; // In production: "https://visualiser.dona.club"
const te = new TextEncoder();

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const CHATKIT_WORKFLOW_ID = Deno.env.get("CHATKIT_WORKFLOW_ID");

function cors(h: Record<string, string> = {}) {
  return {
    "Access-Control-Allow-Origin": ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
    ...h,
  };
}

const sseHeaders = {
  ...cors(),
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  "Connection": "keep-alive",
};

// Utilitaire: envoie une ligne SSE
const sendLine = (controller: ReadableStreamDefaultController<Uint8Array>, data: unknown) =>
  controller.enqueue(te.encode(`data: ${JSON.stringify(data)}\n\n`));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    console.log("✅ [Chat] Handling OPTIONS preflight");
    return new Response(null, { status: 200, headers: cors() });
  }

  console.log("🚀 [Chat] Request received");

  try {
    // Check required env vars
    if (!OPENAI_API_KEY || !CHATKIT_WORKFLOW_ID) {
      console.error("❌ [Chat] Missing configuration");
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error: Missing OPENAI_API_KEY or CHATKIT_WORKFLOW_ID" 
        }),
        { status: 500, headers: cors({ "Content-Type": "application/json" }) }
      );
    }

    // Verify Content-Type
    const contentType = req.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      console.error("❌ [Chat] Invalid Content-Type:", contentType);
      return new Response(
        JSON.stringify({ error: "Content-Type must be application/json" }),
        { status: 400, headers: cors({ "Content-Type": "application/json" }) }
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
        { status: 400, headers: cors({ "Content-Type": "application/json" }) }
      );
    }

    const { messages, stream = true, user_id = "anonymous" } = body;

    if (!messages || !Array.isArray(messages)) {
      console.error("❌ [Chat] Missing or invalid messages field");
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'messages' field" }),
        { status: 400, headers: cors({ "Content-Type": "application/json" }) }
      );
    }

    console.log("💬 [Chat] Processing", messages.length, "messages for user:", user_id);

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    // Create ChatKit session with workflow
    console.log("🔄 [Chat] Creating ChatKit session with workflow:", CHATKIT_WORKFLOW_ID);
    
    const session = await openai.chatkit.sessions.create({
      workflow: { id: CHATKIT_WORKFLOW_ID },
      user: user_id,
    });

    console.log("✅ [Chat] Session created:", session.id);

    // --- Mode non-stream (fallback)
    if (!stream) {
      console.log("🤖 [Chat] Non-streaming mode");
      
      // Send messages to session
      for (const msg of messages) {
        await openai.chatkit.sessions.messages.create(session.id, {
          role: msg.role,
          content: msg.content,
        });
      }

      // Get response
      const response = await openai.chatkit.sessions.retrieve(session.id);
      
      console.log("✅ [Chat] Non-streaming response received");
      return new Response(
        JSON.stringify({ 
          output_text: response.messages?.[response.messages.length - 1]?.content || "" 
        }), 
        { status: 200, headers: cors({ "Content-Type": "application/json" }) }
      );
    }

    // --- STREAMING
    console.log("🌊 [Chat] Streaming mode enabled");

    const streamBody = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          // Send open event
          controller.enqueue(te.encode("event: open\n\n"));
          console.log("📡 [Chat] Stream opened");

          // Send all messages except the last one
          for (let i = 0; i < messages.length - 1; i++) {
            await openai.chatkit.sessions.messages.create(session.id, {
              role: messages[i].role,
              content: messages[i].content,
            });
          }

          // Stream the last message
          const lastMessage = messages[messages.length - 1];
          console.log("📤 [Chat] Streaming last message...");

          const stream = await openai.chatkit.sessions.messages.create(session.id, {
            role: lastMessage.role,
            content: lastMessage.content,
            stream: true,
          });

          console.log("📡 [Chat] Stream connection established");

          for await (const chunk of stream) {
            const delta = chunk.delta?.content;
            if (delta) {
              sendLine(controller, { token: delta });
            }
          }

          console.log("✅ [Chat] Stream completed");
          controller.enqueue(te.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (e) {
          console.error("💥 [Chat] Stream error:", e);
          sendLine(controller, { error: String(e) });
          controller.enqueue(te.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(streamBody, { status: 200, headers: sseHeaders });

  } catch (e) {
    console.error("💥 [Chat] Exception:", e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: cors({ "Content-Type": "application/json" }) }
    );
  }
});