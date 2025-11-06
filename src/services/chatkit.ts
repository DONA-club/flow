export type ChatkitMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatkitResponse = {
  output_text: string;
  error?: string;
};

const CHATKIT_API_URL = "https://chatkit.openai.com/api/v1/workflows/run";
const WORKFLOW_ID = "wf_68e76f7e35b08190a65e0350e1b43ff20dc8cbc65c270e59";
const DOMAIN_PUBLIC_KEY = "domain_pk_690cd9bd2a34819082a4eae88e1e171b035be3ede42b08e4";

export async function runChatkitWorkflow(userMessage: string): Promise<ChatkitResponse> {
  console.log("🚀 [ChatKit] Starting workflow request");
  console.log("📝 [ChatKit] User message:", userMessage);
  console.log("🔑 [ChatKit] Using domain key:", DOMAIN_PUBLIC_KEY);
  console.log("🎯 [ChatKit] Workflow ID:", WORKFLOW_ID);

  const requestBody = {
    workflow_id: WORKFLOW_ID,
    input: {
      input_as_text: userMessage,
    },
  };

  console.log("📦 [ChatKit] Request body:", JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(CHATKIT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DOMAIN_PUBLIC_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log("📡 [ChatKit] Response status:", response.status);
    console.log("📡 [ChatKit] Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [ChatKit] Error response:", errorText);
      
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
        console.error("❌ [ChatKit] Parsed error:", errorJson);
      } catch {
        console.error("❌ [ChatKit] Could not parse error as JSON");
      }

      throw new Error(`ChatKit API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ [ChatKit] Success response:", JSON.stringify(data, null, 2));

    if (!data.output_text) {
      console.warn("⚠️ [ChatKit] No output_text in response, using fallback");
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