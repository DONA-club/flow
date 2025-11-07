/* @ts-nocheck */
// Supabase Edge Function — ChatKit Messages with custom UI
// Uses client_secret from chatkit-session endpoint
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const FRONTEND_ORIGIN = Deno.env.get("FRONTEND_ORIGIN") || "*";

const te = new TextEncoder();

function cors(h: Record<string, string> = {}) {
  return {
    "Access-Control-Allow-Origin": FRONTEND_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey, x-chatkit-client-secret",
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
    // Get client_secret from header (sent by frontend)
    const clientSecret = req.headers.get("x-chatkit-client-secret");
    
    if (!clientSecret) {
      console.error("❌ [Chat] Missing client_secret");
      return new Response(
        JSON.stringify({ error: "Missing x-chatkit-client-secret header" }),
        { status: 401, headers: cors({ "Content-Type": "application/json" }) }
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

    const { messages, stream = true, session_id } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      console.error("❌ [Chat] Missing or invalid messages field");
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'messages' array" }),
        { status: 400, headers: cors({ "Content-Type": "application/json" }) }
      );
    }

    if (!session_id) {
      console.error("❌ [Chat] Missing session_id");
      return new Response(
        JSON.stringify({ error: "Missing session_id" }),
        { status: 400, headers: cors({ "Content-Type": "application/json" }) }
      );
    }

    console.log("💬 [Chat] Processing", messages.length, "messages for session:", session_id);

    // Get last message to send
    const lastMessage = messages[messages.length - 1];

    if (!stream) {
      // Non-streaming
      const response = await fetch(`https://api.openai.com/v1/chatkit/sessions/${session_id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "OpenAI-Beta": "chatkit_beta=v1",
          "Authorization": `Bearer ${clientSecret}`,
        },
        body: JSON.stringify({
          role: lastMessage.role === "assistant" ? "assistant" : "user",
          content: lastMessage.content,
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error("❌ [Chat] Message send failed:", response.status, responseText);
        return new Response(
          JSON.stringify({ error: "MESSAGE_SEND_FAILED", details: responseText }),
          { status: response.status, headers: cors({ "Content-Type": "application/json" }) }
        );
      }

      return new Response(responseText, {
        status: 200,
        headers: cors({ "Content-Type": "application/json" })
      });
    }

    // Streaming
    console.log("🌊 [Chat] Streaming mode enabled");

    const streamBody = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          sendEvent(controller, "open");
          console.log("📡 [Chat] Stream opened");

          const response = await fetch(`https://api.openai.com/v1/chatkit/sessions/${session_id}/messages`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "OpenAI-Beta": "chatkit_beta=v1",
              "Authorization": `Bearer ${clientSecret}`,
            },
            body: JSON.stringify({
              role: lastMessage.role === "assistant" ? "assistant" : "user",
              content: lastMessage.content,
              stream: true,
            }),
          });

          if (!response.ok || !response.body) {
            const responseText = await response.text().catch(() => "");
            console.error("❌ [Chat] Stream start failed:", response.status, responseText);
            sendData(controller, {
              error: "STREAM_START_FAILED",
              details: responseText || `HTTP ${response.status}`
            });
            controller.enqueue(te.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }

          console.log("📡 [Chat] Stream connection established");

          const reader = response.body.getReader();
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

              if (line.startsWith("event:")) {
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
                  controller.enqueue(te.encode(raw + "\n"));
                  continue;
                }

                if (json) {
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

                  if (json?.tool_call || json?.tool?.name || json?.function_call || json?.required_action) {
                    console.log("🔧 [Chat] Tool delta detected");
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

                  sendEvent(controller, "event", json);
                }
                continue;
              }

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
                  } else if (json?.tool_call || json?.tool?.name) {
                    sendEvent(controller, "tool_delta", json);
                  } else if (json?.tool_result || json?.tool_output) {
                    sendEvent(controller, "tool_result", json);
                  } else if (json?.status?.startsWith("tool_")) {
                    sendEvent(controller, "tool_status", json);
                  } else {
                    sendEvent(controller, "event", json);
                  }
                } catch {
                  // Ignore
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