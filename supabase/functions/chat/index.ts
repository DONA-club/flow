/* @ts-nocheck */
// Supabase Edge (Deno) — Proxy vers Chatkit Workflow avec SSE côté client
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const ORIGIN = "*"; // In production: "https://visualiser.dona.club"
const te = new TextEncoder();

const CHATKIT_ENDPOINT = Deno.env.get("CHATKIT_ENDPOINT");
const CHATKIT_WORKFLOW_ID = Deno.env.get("CHATKIT_WORKFLOW_ID");
const CHATKIT_DOMAIN_KEY = Deno.env.get("CHATKIT_DOMAIN_KEY");

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
    if (!CHATKIT_ENDPOINT || !CHATKIT_WORKFLOW_ID || !CHATKIT_DOMAIN_KEY) {
      console.error("❌ [Chat] Missing Chatkit configuration");
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error: Missing CHATKIT_ENDPOINT, CHATKIT_WORKFLOW_ID, or CHATKIT_DOMAIN_KEY" 
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

    const { messages, stream = true, workflow_input = {} } = body;

    if (!messages || !Array.isArray(messages)) {
      console.error("❌ [Chat] Missing or invalid messages field");
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'messages' field" }),
        { status: 400, headers: cors({ "Content-Type": "application/json" }) }
      );
    }

    console.log("💬 [Chat] Processing", messages.length, "messages");

    // --- Mode non-stream (fallback)
    if (!stream) {
      console.log("🤖 [Chat] Non-streaming mode");
      
      const payload = {
        workflow_id: CHATKIT_WORKFLOW_ID,
        input: { messages, ...workflow_input },
        stream: false,
      };

      const rsp = await fetch(CHATKIT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${CHATKIT_DOMAIN_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await rsp.text();
      if (!rsp.ok) {
        console.error("❌ [Chat] Chatkit error:", rsp.status, text);
        return new Response(
          JSON.stringify({ error: `CHATKIT_${rsp.status}`, details: text }),
          { status: 502, headers: cors({ "Content-Type": "application/json" }) }
        );
      }

      console.log("✅ [Chat] Non-streaming response received");
      return new Response(text, { 
        status: 200, 
        headers: cors({ "Content-Type": "application/json" }) 
      });
    }

    // --- STREAMING : on proxifie le flux Chatkit et on le normalise en {token: "..."}
    console.log("🌊 [Chat] Streaming mode enabled");

    const streamBody = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          // Send open event
          controller.enqueue(te.encode("event: open\n\n"));
          console.log("📡 [Chat] Stream opened");

          // Démarre le workflow en mode stream
          const payload = {
            workflow_id: CHATKIT_WORKFLOW_ID,
            input: { messages, ...workflow_input },
            stream: true,
          };

          console.log("🔄 [Chat] Calling Chatkit workflow...");

          const rsp = await fetch(CHATKIT_ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${CHATKIT_DOMAIN_KEY}`,
            },
            body: JSON.stringify(payload),
          });

          if (!rsp.ok || !rsp.body) {
            const errText = await rsp.text().catch(() => "");
            console.error("❌ [Chat] Chatkit stream error:", rsp.status, errText);
            sendLine(controller, { error: `CHATKIT_${rsp.status}`, details: errText || "no body" });
            controller.enqueue(te.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }

          console.log("📡 [Chat] Chatkit stream connection established");

          const reader = rsp.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { value, done } = await reader.read();
            if (done) {
              console.log("✅ [Chat] Chatkit stream ended");
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // Process lines
            if (buffer.includes("\n")) {
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                const trimmed = line.trim();

                // a) Ligne SSE "data: {...}"
                if (trimmed.startsWith("data:")) {
                  const payload = trimmed.slice(5).trim();

                  if (payload === "[DONE]") {
                    console.log("🏁 [Chat] Received [DONE] from Chatkit");
                    controller.enqueue(te.encode("data: [DONE]\n\n"));
                    controller.close();
                    return;
                  }

                  // Parse and normalize
                  try {
                    const json = JSON.parse(payload);

                    // Normalize token from various formats
                    const token =
                      json?.delta?.content ??
                      json?.output_text ??
                      json?.choices?.[0]?.delta?.content ??
                      json?.content ??
                      null;

                    if (typeof token === "string" && token.length) {
                      sendLine(controller, { token });
                    } else {
                      // Relay raw event (useful for tool_calls)
                      sendLine(controller, json);
                    }
                  } catch {
                    // Non-JSON payload: relay as-is
                    controller.enqueue(te.encode(line + "\n"));
                  }

                  continue;
                }

                // b) NDJSON (one line = one JSON)
                if (trimmed.startsWith("{")) {
                  try {
                    const json = JSON.parse(trimmed);
                    const token =
                      json?.delta?.content ??
                      json?.output_text ??
                      json?.choices?.[0]?.delta?.content ??
                      json?.content ??
                      null;
                    if (typeof token === "string" && token.length) {
                      sendLine(controller, { token });
                    } else {
                      sendLine(controller, json);
                    }
                  } catch {
                    // Non-JSON line: ignore
                  }
                }
              }
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