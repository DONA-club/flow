/* @ts-nocheck */
// Supabase Edge Function — OpenAI Assistants API
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import OpenAI from "npm:openai@4";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const ASSISTANT_ID = Deno.env.get("OPENAI_ASSISTANT_ID");
const FRONTEND_ORIGIN = Deno.env.get("FRONTEND_ORIGIN") || "*";

const te = new TextEncoder();

function cors(h: Record<string, string> = {}) {
  return {
    "Access-Control-Allow-Origin": FRONTEND_ORIGIN,
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

const sendData = (c: ReadableStreamDefaultController<Uint8Array>, d: unknown) =>
  c.enqueue(te.encode(`data: ${JSON.stringify(d)}\n\n`));

const sendEvent = (c: ReadableStreamDefaultController<Uint8Array>, ev: string, d?: unknown) =>
  c.enqueue(te.encode(`event: ${ev}\n${d !== undefined ? `data: ${JSON.stringify(d)}\n` : ""}\n`));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    console.log("✅ [Chat] Handling OPTIONS preflight");
    return new Response(null, { status: 200, headers: cors() });
  }

  console.log("🚀 [Chat] Request received");

  try {
    if (!OPENAI_API_KEY) {
      console.error("❌ [Chat] Missing OPENAI_API_KEY");
      return new Response(
        JSON.stringify({ error: "Missing OPENAI_API_KEY" }),
        { status: 500, headers: cors({ "Content-Type": "application/json" }) }
      );
    }

    if (!ASSISTANT_ID) {
      console.error("❌ [Chat] Missing OPENAI_ASSISTANT_ID");
      return new Response(
        JSON.stringify({ error: "Missing OPENAI_ASSISTANT_ID - create one at platform.openai.com/assistants" }),
        { status: 500, headers: cors({ "Content-Type": "application/json" }) }
      );
    }

    const contentType = req.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      console.error("❌ [Chat] Invalid Content-Type:", contentType);
      return new Response(
        JSON.stringify({ error: "Content-Type must be application/json" }),
        { status: 400, headers: cors({ "Content-Type": "application/json" }) }
      );
    }

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

    const { messages, stream = true, thread_id } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      console.error("❌ [Chat] Missing or invalid messages field");
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'messages' array" }),
        { status: 400, headers: cors({ "Content-Type": "application/json" }) }
      );
    }

    console.log("💬 [Chat] Processing", messages.length, "messages");

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    // Use existing thread or create new one
    let threadId = thread_id;
    if (!threadId) {
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
      console.log("✅ [Chat] Thread created:", threadId);
    } else {
      console.log("♻️ [Chat] Using existing thread:", threadId);
    }

    // Add only the last message to thread (to avoid duplicates)
    const lastMessage = messages[messages.length - 1];
    await openai.beta.threads.messages.create(threadId, {
      role: lastMessage.role === "assistant" ? "assistant" : "user",
      content: lastMessage.content,
    });

    if (!stream) {
      // Non-streaming run
      console.log("📝 [Chat] Starting non-streaming run");
      
      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: ASSISTANT_ID,
      });

      // Wait for completion
      let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      while (runStatus.status === "queued" || runStatus.status === "in_progress") {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      }

      if (runStatus.status === "failed") {
        console.error("❌ [Chat] Run failed:", runStatus);
        return new Response(
          JSON.stringify({ error: "Run failed", details: runStatus }),
          { status: 500, headers: cors({ "Content-Type": "application/json" }) }
        );
      }

      // Get messages
      const threadMessages = await openai.beta.threads.messages.list(threadId);
      const assistantMessage = threadMessages.data[0];
      const content = assistantMessage.content[0];
      const text = content.type === "text" ? content.text.value : "";

      return new Response(
        JSON.stringify({ 
          output_text: text,
          thread_id: threadId 
        }),
        { status: 200, headers: cors({ "Content-Type": "application/json" }) }
      );
    }

    // Streaming run
    console.log("🌊 [Chat] Starting streaming run");

    const streamBody = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          sendEvent(controller, "open");
          sendData(controller, { thread_id: threadId });

          const stream = await openai.beta.threads.runs.stream(threadId, {
            assistant_id: ASSISTANT_ID,
          });

          for await (const event of stream) {
            // Text deltas
            if (event.event === "thread.message.delta") {
              const delta = event.data.delta;
              if (delta.content && delta.content[0]?.type === "text") {
                const text = delta.content[0].text?.value;
                if (text) {
                  sendData(controller, { token: text });
                }
              }
            }

            // Tool calls - step created
            if (event.event === "thread.run.step.created") {
              const step = event.data;
              if (step.type === "tool_calls") {
                console.log("🔧 [Chat] Tool call started");
                sendEvent(controller, "tool_delta", { 
                  tool_call: { name: "tool_starting" } 
                });
              }
            }

            // Tool calls - step delta
            if (event.event === "thread.run.step.delta") {
              const delta = event.data.delta;
              if (delta.step_details?.type === "tool_calls") {
                const toolCalls = delta.step_details.tool_calls;
                if (toolCalls && toolCalls[0]) {
                  const toolCall = toolCalls[0];
                  console.log("🔧 [Chat] Tool delta:", toolCall.type);
                  sendEvent(controller, "tool_delta", { tool_call: toolCall });
                }
              }
            }

            // Tool calls - step completed
            if (event.event === "thread.run.step.completed") {
              const step = event.data;
              if (step.type === "tool_calls") {
                console.log("✅ [Chat] Tool completed");
                sendEvent(controller, "tool_result", { status: "completed" });
              }
            }

            // Run status updates
            if (event.event === "thread.run.queued") {
              console.log("⏳ [Chat] Run queued");
              sendEvent(controller, "tool_status", { status: "queued" });
            }

            if (event.event === "thread.run.in_progress") {
              console.log("⚙️ [Chat] Run in progress");
              sendEvent(controller, "tool_status", { status: "in_progress" });
            }

            // Run completed
            if (event.event === "thread.run.completed") {
              console.log("✅ [Chat] Run completed");
              break;
            }

            // Run failed
            if (event.event === "thread.run.failed") {
              console.error("❌ [Chat] Run failed:", event.data);
              sendData(controller, { error: "Run failed", details: event.data });
              break;
            }

            // Run requires action (function calling)
            if (event.event === "thread.run.requires_action") {
              console.log("🔧 [Chat] Run requires action");
              sendEvent(controller, "tool_status", { status: "requires_action" });
            }
          }

          console.log("✅ [Chat] Stream completed");
          controller.enqueue(te.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (e) {
          console.error("💥 [Chat] Stream error:", e);
          sendData(controller, { error: String(e) });
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