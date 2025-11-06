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

export async function runChatkitWorkflow(userMessage: string): Promise<ChatkitResponse> {
  console.log("🚀 [Chat] Starting chat request");
  console.log("📝 [Chat] User message:", userMessage);

  try {
    // Add user message to history
    conversationHistory.push({
      role: "user",
      content: userMessage,
    });

    console.log("📡 [Chat] Calling 'chat' edge function with", conversationHistory.length, "messages");

    // Call the chat function (NOT chatkit-proxy!)
    const { data, error } = await supabase.functions.invoke("chat", {
      body: { 
        messages: conversationHistory 
      },
    });

    if (error) {
      console.error("❌ [Chat] Edge function error:", error);
      console.error("❌ [Chat] Error details:", JSON.stringify(error, null, 2));
      throw new Error(error.message || "Edge function invocation failed");
    }

    console.log("✅ [Chat] Success response:", data);

    if (!data || !data.output_text) {
      console.warn("⚠️ [Chat] No output_text in response");
      console.warn("⚠️ [Chat] Full response:", JSON.stringify(data, null, 2));
      
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
    
    if (error instanceof Error) {
      console.error("💥 [Chat] Error message:", error.message);
      console.error("💥 [Chat] Error stack:", error.stack);
    }

    return {
      output_text: "Une erreur est survenue lors de la communication avec l'agent.",
      error: error instanceof Error ? error.message : String(error),
    };
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