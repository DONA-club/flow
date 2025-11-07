import { supabase } from "@/integrations/supabase/client";

/**
 * OpenAI Assistants API Integration
 * 
 * Architecture:
 * 1. Create thread (conversation container)
 * 2. Add messages to thread
 * 3. Run assistant on thread
 * 4. Stream responses with tool events
 * 
 * Benefits:
 * - ✅ Publicly available (no beta access needed)
 * - ✅ Full tools support (code_interpreter, file_search, functions)
 * - ✅ Streaming with detailed events
 * - ✅ Persistent conversation threads
 */

export type ChatkitMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatkitResponse = {
  output_text: string;
  thread_id?: string;
  error?: string;
};

// Store conversation thread
let currentThreadId: string | null = null;

/**
 * Streaming mode with Assistants API
 * 
 * Handles:
 * - Text tokens (delta streaming)
 * - Tool calls (function execution, code interpreter, file search)
 * - Tool results (function outputs)
 * - Run status (queued, in_progress, completed, failed)
 */
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
  console.log("🌊 [Assistants] Starting streaming request");
  
  try {
    const supabaseUrl = "https://scnaqjixwuqakppnahfg.supabase.co";
    
    const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        messages, 
        stream: true,
        thread_id: currentThreadId, // Reuse thread for conversation continuity
      }),
      signal,
    });

    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => "");
      throw new Error(`HTTP ${response.status} – ${text || "no body"}`);
    }

    console.log("📡 [Assistants] Stream connection established");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let pendingEvent: string | null = null;

    const handleDataJson = (json: any) => {
      // Thread ID (save for next message)
      if (json?.thread_id && !currentThreadId) {
        currentThreadId = json.thread_id;
        console.log("💾 [Assistants] Thread ID saved:", currentThreadId);
        return;
      }

      // Text token
      if (json?.token) {
        onToken(json.token);
        return;
      }

      // Other events
      onEvent?.(json);
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        console.log("✅ [Assistants] Stream ended");
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;

        // SSE event type
        if (line.startsWith("event:")) {
          pendingEvent = line.slice(6).trim();
          continue;
        }

        // SSE data
        if (line.startsWith("data:")) {
          const payload = line.slice(5).trim();

          // Stream end marker
          if (payload === "[DONE]") {
            console.log("🏁 [Assistants] Received [DONE] marker");
            onDone?.();
            return;
          }

          // Parse JSON payload
          let json: any = null;
          try {
            json = JSON.parse(payload);
          } catch {
            continue;
          }

          // Handle event-specific payloads
          if (pendingEvent) {
            const ev = pendingEvent;
            pendingEvent = null;

            if (ev === "tool_delta") {
              console.log("🔧 [Assistants] Tool delta event");
              onToolDelta?.(json);
              continue;
            }
            if (ev === "tool_result") {
              console.log("✅ [Assistants] Tool result event");
              onToolResult?.(json);
              continue;
            }
            if (ev === "tool_status") {
              console.log("📊 [Assistants] Tool status event");
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

          // Handle generic data
          if (json) {
            handleDataJson(json);
          }
          continue;
        }

        // NDJSON fallback
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
    console.error("💥 [Assistants] Stream error:", err);
    onError?.(err);
    throw err;
  }
}

/**
 * Reset conversation (start fresh thread)
 */
export function resetChatkitSession() {
  console.log("🔄 [Assistants] Resetting thread");
  currentThreadId = null;
}

/**
 * Get current thread ID
 */
export function getCurrentThreadId(): string | null {
  return currentThreadId;
}