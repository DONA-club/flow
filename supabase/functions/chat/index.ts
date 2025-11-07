/* @ts-nocheck */
// Supabase Edge (Deno) — OpenAI ChatKit Sessions API via fetch direct
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

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

const sendLine = (controller: ReadableStreamDefaultController<Uint8Array>, data: unknown) =>
  controller.enqueue(te.encode(`data: ${JSON.stringify(data)}\n\n`));

const CHATKIT_SESSIONS = "https://api.openai.com/v1/chatkit/sessions";

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

    // 1) CREATE SESSION
    console.log("🔄 [Chat] Creating ChatKit session with workflow:", CHATKIT_WORKFLOW_ID);
    
    const createRes = await fetch(CHATKIT_SESSIONS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "OpenAI-Beta": "chatkit_beta=v1",
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

    // 2) MODE NON-STREAM (fallback)
    if (!stream) {
      console.log("🤖 [Chat] Non-streaming mode");
      
      // Send all messages
      for (const msg of messages) {
        const msgRes = await fetch(`${CHATKIT_SESSIONS}/${sessionId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "OpenAI-Beta": "chatkit_beta=v1",
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({ role: msg.role, content: msg.content }),
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

      // Retrieve final session state
      const lastRes = await fetch(`${CHATKIT_SESSIONS}/${sessionId}`, {
        headers: {
          "OpenAI-Beta": "chatkit_beta=v1",
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

    // 3) STREAMING SSE
    console.log("🌊 [Chat] Streaming mode enabled");

    const streamBody = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          // Send open event
          controller.enqueue(te.encode("event: open\n\n"));
          console.log("📡 [Chat] Stream opened");

          // Send all messages except the last one (non-streaming)
          for (let i = 0; i < messages.length - 1; i++) {
            const msgRes = await fetch(`${CHATKIT_SESSIONS}/${sessionId}/messages`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "OpenAI-Beta": "chatkit_beta=v1",
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
              },
              body: JSON.stringify({ 
                role: messages[i].role, 
                content: messages[i].content 
              }),
            });

            if (!msgRes.ok) {
              const msgText = await msgRes.text().catch(() => "");
              console.error("❌ [Chat] Message creation failed:", msgRes.status, msgText);
              sendLine(controller, { error: "CHATKIT_MSG_CREATE", details: msgText });
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
              "OpenAI-Beta": "chatkit_beta=v1",
              "Authorization": `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({ 
              role: lastMessage.role, 
              content: lastMessage.content, 
              stream: true 
            }),
          });

          if (!streamRes.ok || !streamRes.body) {
            const streamText = await streamRes.text().catch(() => "");
            console.error("❌ [Chat] Stream start failed:", streamRes.status, streamText);
            sendLine(controller, { error: "CHATKIT_STREAM_START", details: streamText || "no body" });
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

            // Process lines (supports both SSE and NDJSON)
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();

              // a) SSE format: "data: {...}"
              if (trimmed.startsWith("data:")) {
                const payload = trimmed.slice(5).trim();

                if (payload === "[DONE]") {
                  console.log("🏁 [Chat] Received [DONE]");
                  controller.enqueue(te.encode("data: [DONE]\n\n"));
                  controller.close();
                  return;
                }

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
                  // Non-JSON payload: ignore or relay as-is if needed
                }

                continue;
              }

              // b) NDJSON format: one line = one JSON
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