import { supabase } from "@/integrations/supabase/client";

export type ChatkitMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatkitResponse = {
  output_text: string;
  error?: string;
};

export async function runChatkitWorkflow(userMessage: string): Promise<ChatkitResponse> {
  console.log("🚀 [ChatKit] Starting workflow request via proxy");
  console.log("📝 [ChatKit] User message:", userMessage);

  try {
    const { data: sess } = await supabase.auth.getSession();
    const supaAccess = sess?.session?.access_token;
    
    if (!supaAccess) {
      console.warn("⚠️ [ChatKit] No auth token, proceeding without authentication");
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (supaAccess) {
      headers["Authorization"] = `Bearer ${supaAccess}`;
    }

    console.log("📡 [ChatKit] Calling edge function proxy");

    const { data, error } = await supabase.functions.invoke("chatkit-proxy", {
      body: { message: userMessage },
      headers,
    });

    if (error) {
      console.error("❌ [ChatKit] Edge function error:", error);
      console.error("❌ [ChatKit] Error details:", JSON.stringify(error, null, 2));
      
      // Essayer de récupérer plus de détails depuis data
      if (data) {
        console.error("❌ [ChatKit] Error data:", JSON.stringify(data, null, 2));
      }
      
      throw new Error(error.message || "Edge function invocation failed");
    }

    console.log("✅ [ChatKit] Success response:", data);

    if (!data || !data.output_text) {
      console.warn("⚠️ [ChatKit] No output_text in response");
      console.warn("⚠️ [ChatKit] Full response:", JSON.stringify(data, null, 2));
      
      // Si data contient une erreur, l'afficher
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

    console.log("✨ [ChatKit] Final output:", data.output_text);
    return {
      output_text: data.output_text,
    };
  } catch (error) {
    console.error("💥 [ChatKit] Exception caught:", error);
    
    if (error instanceof Error) {
      console.error("💥 [ChatKit] Error message:", error.message);
      console.error("💥 [ChatKit] Error stack:", error.stack);
    }

    return {
      output_text: "Une erreur est survenue lors de la communication avec l'agent.",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}