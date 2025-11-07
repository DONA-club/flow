import { supabase } from "@/integrations/supabase/client";

export type ChatkitMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatkitResponse = {
  output_text: string;
  error?: string;
};

// Store conversation history in memory
let conversationHistory: ChatkitMessage[] = [];

// Non-streaming mode (backward compatible)
export async function runChatkitWorkflow(userMessage: string): Promise<ChatkitResponse> {
  console.log("🚀 [Chat] Starting chat request (non-streaming)");
  console.log("📝 [Chat] User message:", userMessage);

  try {
    // Add user message to history
    conversationHistory.push({
      role: "user",
      content: userMessage,
    });

    console.log("📡 [Chat] Calling 'chat' edge function");

    // Call the chat function without streaming
    const { data, error } = await supabase.functions.invoke("chat", {
      body: { 
        messages: conversationHistory,
        stream: false 
      },
    });

    if (error) {
      console.error("❌ [Chat] Edge function error:", error);
      throw new Error(error.message || "Edge function invocation failed");
    }

    console.log("✅ [Chat] Success response:", data);

    if (!data || !data.output_text) {
      console.warn("⚠️ [Chat] No output_text in response");
      
      if (data?.error) {
        return {
          output_text: `Erreur: ${data.error}`,
          error: data.error,
        };
      }
      
      return {
        output_text: "Désolé, je n'ai pas pu traiter votre demande.",
        error: "No output_text in response",
      };
    }

    // Add assistant response to history
    conversationHistory.push({
      role: "assistant",
      content: data.output_text,
    });

    console.log("✨ [Chat] Final output:", data.output_text);
    return {
      output_text: data.output_text,
    };
  } catch (error) {
    console.error("💥 [Chat] Exception caught:", error);
    
    return {
      output_text: "Une erreur est survenue lors de la communication avec l'agent.",
      error: error instanceof Error ? error.message : String(error),
    };
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
  console.log("🌊 [Chat] Starting streaming request");
  
  try {
    // Use the Supabase URL from the client (already configured)
    const supabaseUrl = "https://scnaqjixwuqakppnahfg.supabase.co";
    
    const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        messages, 
        stream: true 
      }),
      signal,
    });

    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => "");
      throw new Error(`HTTP ${response.status} – ${text || "no body"}`);
    }

    console.log("📡 [Chat] Stream connection established");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let pendingEvent: string | null = null;

    const handleDataJson = (json: any) => {
      if (json?.token) {
        onToken(json.token);
        return;
      }
      // Fallback generic event
      onEvent?.(json);
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        console.log("✅ [Chat] Stream ended");
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // SSE: split by lines
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;

        // SSE event line
        if (line.startsWith("event:")) {
          pendingEvent = line.slice(6).trim();
          continue;
        }

        // SSE data line
        if (line.startsWith("data:")) {
          const payload = line.slice(5).trim();

          if (payload === "[DONE]") {
            console.log("🏁 [Chat] Received [DONE] marker");
            onDone?.();
            return;
          }

          let json: any = null;
          try {
            json = JSON.parse(payload);
          } catch {
            // Non-JSON: ignore
            continue;
          }

          // Handle event-specific payloads
          if (pendingEvent) {
            const ev = pendingEvent;
            pendingEvent = null;

            if (ev === "tool_delta") {
              console.log("🔧 [Chat] Tool delta event");
              onToolDelta?.(json);
              continue;
            }
            if (ev === "tool_result") {
              console.log("✅ [Chat] Tool result event");
              onToolResult?.(json);
              continue;
            }
            if (ev === "tool_status") {
              console.log("📊 [Chat] Tool status event");
              onToolStatus?.(json);
              continue;
            }
            if (ev === "token") {
              if (json?.token) onToken(json.token);
              continue;
            }
            // Other generic event
            onEvent?.(json);
            continue;
          }

          // No explicit event → backward compat (data:{token})
          if (json) {
            handleDataJson(json);
          }
          continue;
        }

        // NDJSON (JSON line without event/data prefix)
        if (line.startsWith("{")) {
          try {
            const json = JSON.parse(line);
            handleDataJson(json);
          } catch {
            // Ignore non-JSON
          }
        }
      }
    }

    onDone?.();
  } catch (err: any) {
    console.error("💥 [Chat] Stream error:", err);
    onError?.(err);
    throw err;
  }
}

// Reset conversation (useful for starting fresh)
export function resetChatkitSession() {
  console.log("🔄 [Chat] Resetting conversation");
  conversationHistory = [];
}

// Get conversation history (useful for debugging)
export function getConversationHistory(): ChatkitMessage[] {
  return [...conversationHistory];
}