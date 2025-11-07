/* @ts-nocheck */
// Supabase Edge (Deno) — OpenAI ChatKit Sessions API (official)
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const OPENAI_API_KEY   = Deno.env.get("OPENAI_API_KEY");
const CHATKIT_WORKFLOW_ID = Deno.env.get("CHATKIT_WORKFLOW_ID") || "";
const FRONTEND_ORIGIN  = Deno.env.get("FRONTEND_ORIGIN") || "*";
const OPENAI_BETA      = Deno.env.get("OPENAI_BETA") || "chatkit_beta=v1";

const te = new TextEncoder();
const CHATKIT_SESSIONS = "https://api.openai.com/v1/chatkit/sessions";

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
    if (!OPENAI_API_KEY || !CHATKIT_WORKFLOW_ID) {
      console.error("❌ [Chat] Missing configuration");
      return new Response(
        JSON.stringify({ error: "Missing OPENAI_API_KEY or CHATKIT_WORKFLOW_ID" }),
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

    if (!Array.isArray(messages) || messages.length === 0) {
      console.error("❌ [Chat] Missing or invalid messages field");
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'messages' array" }),
        { status: 400, headers: cors({ "Content-Type": "application/json" }) }
      );
    }

    console.log("💬 [Chat] Processing", messages.length, "messages for user:", user_id);
    console.log("🔄 [Chat] Using workflow:", CHATKIT_WORKFLOW_ID);

    // 1) CREATE SESSION
    console.log("🔄 [Chat] Creating ChatKit session...");
    
    const createRes = await fetch(CHATKIT_SESSIONS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "OpenAI-Beta": OPENAI_BETA,
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        workflow: { id: CHATKIT_WORKFLOW_ID },
        user: user_id,
      }),
    });

    const createText = await createRes.text();
    if (!createRes.ok) {
      console.error("❌ [Chat] Session creation failed:", createRes.status, createText);
      return new Response(
        JSON.stringify({ error: "CHATKIT_SESS_CREATE", details: createText }),
        { status: 502, headers: cors({ "Content-Type": "application/json" }) }
      );
    }

    const session = JSON.parse(createText);
    const sessionId = session.id;
    console.log("✅ [Chat] Session created:", sessionId);

    // 2) Fallback non-stream
    if (!stream) {
      console.log("🤖 [Chat] Non-streaming mode");
      
      // Send all messages
      for (const msg of messages) {
        const msgRes = await fetch(`${CHATKIT_SESSIONS}/${sessionId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "OpenAI-Beta": OPENAI_BETA,
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({ 
            role: msg.role === "assistant" ? "assistant" : "user",
            content: msg.content 
          }),
        });

        if (!msgRes.ok) {
          const msgText = await msgRes.text().catch(() => "");
          console.error("❌ [Chat] Message creation failed:", msgRes.status, msgText);
          return new Response(
            JSON.stringify({ error: "CHATKIT_MSG_CREATE", details: msgText }),
            { status: 502, headers: cors({ "Content-Type": "application/json" }) }
          );
        }
      }

      // Get final session state
      const lastRes = await fetch(`${CHATKIT_SESSIONS}/${sessionId}`, {
        headers: {
          "OpenAI-Beta": OPENAI_BETA,
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
        },
      });

      const lastText = await lastRes.text();
      if (!lastRes.ok) {
        console.error("❌ [Chat] Session retrieval failed:", lastRes.status, lastText);
        return new Response(
          JSON.stringify({ error: "CHATKIT_SESS_RETRIEVE", details: lastText }),
          { status: 502, headers: cors({ "Content-Type": "application/json" }) }
        );
      }

      console.log("✅ [Chat] Non-streaming response received");
      return new Response(lastText, { 
        status: 200, 
        headers: cors({ "Content-Type": "application/json" }) 
      });
    }

    // 3) STREAMING
    console.log("🌊 [Chat] Streaming mode enabled");

    const streamBody = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          sendEvent(controller, "open");
          console.log("📡 [Chat] Stream opened");

          // Send all messages except the last one (non-streaming)
          for (let i = 0; i < messages.length - 1; i++) {
            const msgRes = await fetch(`${CHATKIT_SESSIONS}/${sessionId}/messages`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "OpenAI-Beta": OPENAI_BETA,
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
              },
              body: JSON.stringify({ 
                role: messages[i].role === "assistant" ? "assistant" : "user",
                content: messages[i].content 
              }),
            });

            if (!msgRes.ok) {
              const msgText = await msgRes.text().catch(() => "");
              console.error("❌ [Chat] Message creation failed:", msgRes.status, msgText);
              sendData(controller, { error: "CHATKIT_MSG_CREATE", details: msgText });
              controller.enqueue(te.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }
          }

          // Stream the last message
          const lastMessage = messages[messages.length - 1];
          console.log("📤 [Chat] Streaming last message...");

          const streamRes = await fetch(`${CHATKIT_SESSIONS}/${sessionId}/messages`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "OpenAI-Beta": OPENAI_BETA,
              "Authorization": `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({ 
              role: lastMessage.role === "assistant" ? "assistant" : "user",
              content: lastMessage.content,
              stream: true 
            }),
          });

          if (!streamRes.ok || !streamRes.body) {
            const streamText = await streamRes.text().catch(() => "");
            console.error("❌ [Chat] Stream start failed:", streamRes.status, streamText);
            sendData(controller, { 
              error: "CHATKIT_STREAM_START", 
              details: streamText || "no body" 
            });
            controller.enqueue(te.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }

          console.log("📡 [Chat] Stream connection established");

          const reader = streamRes.body.getReader();
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
                  // 1) Text token
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

                  // 2) Tool events
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

                  // 3) Other payload
                  sendEvent(controller, "event", json);
                } else {
                  controller.enqueue(te.encode(raw + "\n"));
                }
                continue;
              }

              // NDJSON
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