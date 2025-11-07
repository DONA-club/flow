import { supabase } from "@/integrations/supabase/client";

export type ChatkitMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatkitResponse = {
  output_text: string;
  error?: string;
};

// Store conversation history and session info
let conversationHistory: ChatkitMessage[] = [];
let currentSessionId: string | null = null;
let currentClientSecret: string | null = null;

// Create or refresh ChatKit session
async function ensureSession(): Promise<{ session_id: string; client_secret: string } | null> {
  if (currentSessionId && currentClientSecret) {
    return { session_id: currentSessionId, client_secret: currentClientSecret };
  }

  console.log("🔐 [ChatKit] Creating new session...");

  try {
    const { data, error } = await supabase.functions.invoke("chatkit-session", {
      body: { 
        user_id: "anonymous" // You can use actual user ID here
      },
    });

    if (error || !data?.client_secret || !data?.session_id) {
      console.error("❌ [ChatKit] Session creation failed:", error);
      return null;
    }

    currentSessionId = data.session_id;
    currentClientSecret = data.client_secret;

    console.log("✅ [ChatKit] Session created:", currentSessionId);
    return { session_id: currentSessionId, client_secret: currentClientSecret };
  } catch (err) {
    console.error("💥 [ChatKit] Session creation error:", err);
    return null;
  }
}

// Streaming mode with tool events support
export async function chatStream({
  messages,
  onToken,
  onToolDelta,
  onToolResult,
  onToolStatus,
  onEvent,
  onDone,
  onError,
  signal,
}: {
  messages: ChatkitMessage[];
  onToken: (token: string) => void;
  onToolDelta?: (payload: any) => void;
  onToolResult?: (payload: any) => void;
  onToolStatus?: (payload: any) => void;
  onEvent?: (payload: any) => void;
  onDone?: () => void;
  onError?: (err: Error) => void;
  signal?: AbortSignal;
}) {
  console.log("🌊 [ChatKit] Starting streaming request");
  
  try {
    // Ensure we have a session
    const session = await ensureSession();
    if (!session) {
      throw new Error("Failed to create ChatKit session");
    }

    // Use the Supabase URL from the client
    const supabaseUrl = "https://scnaqjixwuqakppnahfg.supabase.co";
    
    const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-chatkit-client-secret": session.client_secret,
      },
      body: JSON.stringify({ 
        messages, 
        stream: true,
        session_id: session.session_id,
      }),
      signal,
    });

    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => "");
      throw new Error(`HTTP ${response.status} – ${text || "no body"}`);
    }

    console.log("📡 [ChatKit] Stream connection established");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let pendingEvent: string | null = null;

    const handleDataJson = (json: any) => {
      if (json?.token) {
        onToken(json.token);
        return;
      }
      onEvent?.(json);
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        console.log("✅ [ChatKit] Stream ended");
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;

        if (line.startsWith("event:")) {
          pendingEvent = line.slice(6).trim();
          continue;
        }

        if (line.startsWith("data:")) {
          const payload = line.slice(5).trim();

          if (payload === "[DONE]") {
            console.log("🏁 [ChatKit] Received [DONE] marker");
            onDone?.();
            return;
          }

          let json: any = null;
          try {
            json = JSON.parse(payload);
          } catch {
            continue;
          }

          if (pendingEvent) {
            const ev = pendingEvent;
            pendingEvent = null;

            if (ev === "tool_delta") {
              console.log("🔧 [ChatKit] Tool delta event");
              onToolDelta?.(json);
              continue;
            }
            if (ev === "tool_result") {
              console.log("✅ [ChatKit] Tool result event");
              onToolResult?.(json);
              continue;
            }
            if (ev === "tool_status") {
              console.log("📊 [ChatKit] Tool status event");
              onToolStatus?.(json);
              continue;
            }
            if (ev === "token") {
              if (json?.token) onToken(json.token);
              continue;
            }
            onEvent?.(json);
            continue;
          }

          if (json) {
            handleDataJson(json);
          }
          continue;
        }

        if (line.startsWith("{")) {
          try {
            const json = JSON.parse(line);
            handleDataJson(json);
          } catch {
            // Ignore
          }
        }
      }
    }

    onDone?.();
  } catch (err: any) {
    console.error("💥 [ChatKit] Stream error:", err);
    onError?.(err);
    throw err;
  }
}

// Reset session (useful for starting fresh)
export function resetChatkitSession() {
  console.log("🔄 [ChatKit] Resetting session");
  conversationHistory = [];
  currentSessionId = null;
  currentClientSecret = null;
}

// Get conversation history
export function getConversationHistory(): ChatkitMessage[] {
  return [...conversationHistory];
}