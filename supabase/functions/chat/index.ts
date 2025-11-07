/* @ts-nocheck */
// Supabase Edge (Deno) — OpenAI ChatKit Workflows API direct
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const OPENAI_API_KEY   = Deno.env.get("OPENAI_API_KEY");
const DEFAULT_WORKFLOW = Deno.env.get("CHATKIT_WORKFLOW_ID") || "";
const FRONTEND_ORIGIN  = Deno.env.get("FRONTEND_ORIGIN") || "*";
const OPENAI_BETA      = Deno.env.get("OPENAI_BETA") || "workflows=v1";

const te = new TextEncoder();
const RUN_URL = "https://api.openai.com/v1/workflows/run";

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
    // Check required env vars
    if (!OPENAI_API_KEY) {
      console.error("❌ [Chat] Missing OPENAI_API_KEY");
      return new Response(
        JSON.stringify({ error: "Missing OPENAI_API_KEY" }),
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

    // Body expected: { messages, stream=true, workflow_id?, workflow_input?, user_id? }
    const {
      messages,
      stream = true,
      workflow_id = DEFAULT_WORKFLOW,
      workflow_input = {},
      user_id = "anonymous",
    } = body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      console.error("❌ [Chat] Missing or invalid messages field");
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'messages' array" }),
        { status: 400, headers: cors({ "Content-Type": "application/json" }) }
      );
    }

    if (!workflow_id) {
      console.error("❌ [Chat] Missing workflow_id");
      return new Response(
        JSON.stringify({ error: "Missing 'workflow_id' (or CHATKIT_WORKFLOW_ID secret)" }),
        { status: 400, headers: cors({ "Content-Type": "application/json" }) }
      );
    }

    console.log("💬 [Chat] Processing", messages.length, "messages for user:", user_id);
    console.log("🔄 [Chat] Using workflow:", workflow_id);

    // ---------- Fallback non-stream ----------
    if (!stream) {
      console.log("🤖 [Chat] Non-streaming mode");

      const rsp = await fetch(RUN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": OPENAI_BETA,
        },
        body: JSON.stringify({
          workflow_id,
          input: { messages, user_id, ...workflow_input },
          stream: false,
        }),
      });

      const text = await rsp.text();
      if (!rsp.ok) {
        console.error("❌ [Chat] Workflow run failed:", rsp.status, text);
        return new Response(
          JSON.stringify({ error: "WORKFLOW_RUN_FAILED", details: text }),
          { status: 502, headers: cors({ "Content-Type": "application/json" }) }
        );
      }

      console.log("✅ [Chat] Non-streaming response received");
      return new Response(text, { 
        status: 200, 
        headers: cors({ "Content-Type": "application/json" }) 
      });
    }

    // ---------- Streaming ----------
    console.log("🌊 [Chat] Streaming mode enabled");

    const streamBody = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          sendEvent(controller, "open");
          console.log("📡 [Chat] Stream opened");

          const rsp = await fetch(RUN_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${OPENAI_API_KEY}`,
              "OpenAI-Beta": OPENAI_BETA,
            },
            body: JSON.stringify({
              workflow_id,
              input: { messages, user_id, ...workflow_input },
              stream: true,
            }),
          });

          if (!rsp.ok || !rsp.body) {
            const t = await rsp.text().catch(() => "");
            console.error("❌ [Chat] Stream start failed:", rsp.status, t);
            sendData(controller, { 
              error: "WORKFLOW_STREAM_START_FAILED", 
              details: t || `HTTP ${rsp.status}` 
            });
            controller.enqueue(te.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }

          console.log("📡 [Chat] Stream connection established");

          const reader = rsp.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { value, done } = await reader.read();
            if (done) {
              console.log("✅ [Chat] Stream ended");
              break;
            }

            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const raw of lines) {
              const line = raw.trim();
              if (!line) continue;

              // Native SSE from OpenAI
              if (line.startsWith("event:")) {
                // Relay event line as-is (will be followed by data:)
                controller.enqueue(te.encode(line + "\n"));
                continue;
              }

              if (line.startsWith("data:")) {
                const payload = line.slice(5).trim();

                if (payload === "[DONE]") {
                  console.log("🏁 [Chat] Received [DONE]");
                  controller.enqueue(te.encode("data: [DONE]\n\n"));
                  controller.close();
                  return;
                }

                let json: any = null;
                try {
                  json = JSON.parse(payload);
                } catch {
                  // Non-JSON: relay as-is
                  controller.enqueue(te.encode(raw + "\n"));
                  continue;
                }

                if (json) {
                  // 1) Text token (multiple schemas possible)
                  const token =
                    json?.delta?.content ??
                    json?.output_text ??
                    json?.choices?.[0]?.delta?.content ??
                    json?.content ??
                    null;

                  if (typeof token === "string" && token) {
                    sendData(controller, { token });
                    continue;
                  }

                  // 2) Tool events — propagate as dedicated SSE events
                  if (json?.tool_call || json?.tool?.name || json?.function_call || json?.required_action) {
                    console.log("🔧 [Chat] Tool delta detected:", 
                      json?.tool_call?.name || json?.tool?.name || json?.function_call?.name);
                    sendEvent(controller, "tool_delta", json);
                    continue;
                  }

                  if (json?.tool_result || json?.tool_output) {
                    console.log("✅ [Chat] Tool result received");
                    sendEvent(controller, "tool_result", json);
                    continue;
                  }

                  if (json?.status && typeof json.status === "string" && json.status.startsWith("tool_")) {
                    console.log("📊 [Chat] Tool status:", json.status);
                    sendEvent(controller, "tool_status", json);
                    continue;
                  }

                  // 3) Other payload → generic event
                  sendEvent(controller, "event", json);
                } else {
                  // Non-JSON data line → relay as-is
                  controller.enqueue(te.encode(raw + "\n"));
                }
                continue;
              }

              // NDJSON (pure JSON line)
              if (line.startsWith("{")) {
                try {
                  const json = JSON.parse(line);
                  
                  const token =
                    json?.delta?.content ??
                    json?.output_text ??
                    json?.choices?.[0]?.delta?.content ??
                    json?.content ??
                    null;

                  if (typeof token === "string" && token) {
                    sendData(controller, { token });
                  } else if (json?.tool_call || json?.tool?.name || json?.function_call || json?.required_action) {
                    console.log("🔧 [Chat] Tool delta detected (NDJSON):", 
                      json?.tool_call?.name || json?.tool?.name);
                    sendEvent(controller, "tool_delta", json);
                  } else if (json?.tool_result || json?.tool_output) {
                    console.log("✅ [Chat] Tool result received (NDJSON)");
                    sendEvent(controller, "tool_result", json);
                  } else if (json?.status && typeof json.status === "string" && json.status.startsWith("tool_")) {
                    console.log("📊 [Chat] Tool status (NDJSON):", json.status);
                    sendEvent(controller, "tool_status", json);
                  } else {
                    sendEvent(controller, "event", json);
                  }
                } catch {
                  // Ignore non-JSON lines
                }
              }
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