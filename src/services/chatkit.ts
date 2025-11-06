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

// Streaming mode
export async function chatStream({
  messages,
  onToken,
  onDone,
  onError,
  signal,
}: {
  messages: ChatkitMessage[];
  onToken: (token: string) => void;
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

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();

        if (payload === "[DONE]") {
          console.log("🏁 [Chat] Received [DONE] marker");
          onDone?.();
          return;
        }

        try {
          const json = JSON.parse(payload);
          if (json?.token) {
            onToken(json.token);
          }
          if (json?.error) {
            throw new Error(json.error);
          }
        } catch (e) {
          // Ignore non-JSON lines (events, keep-alive)
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