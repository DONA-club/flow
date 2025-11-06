import { supabase } from "@/integrations/supabase/client";

type SessionData = {
  client_secret: string;
  id: string;
  expires_after?: number;
};

let currentSession: SessionData | null = null;
let chatkitClient: any = null;

/**
 * Create a new ChatKit session via our edge function
 */
async function createSession(): Promise<SessionData> {
  console.log("🔑 [ChatKit Client] Creating new session...");

  const { data: sess } = await supabase.auth.getSession();
  const supaAccess = sess?.session?.access_token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (supaAccess) {
    headers["Authorization"] = `Bearer ${supaAccess}`;
  }

  const { data, error } = await supabase.functions.invoke("chatkit-create-session", {
    body: {},
    headers,
  });

  if (error || !data) {
    console.error("❌ [ChatKit Client] Session creation failed:", error);
    throw new Error(error?.message || "Failed to create session");
  }

  console.log("✅ [ChatKit Client] Session created:", data.id);
  return data as SessionData;
}

/**
 * Get or create a ChatKit session
 */
async function getSession(): Promise<SessionData> {
  if (currentSession) {
    // Check if session is still valid (with 1 minute buffer)
    if (currentSession.expires_after) {
      const expiresAt = new Date(currentSession.expires_after).getTime();
      const now = Date.now();
      if (expiresAt - now > 60000) {
        console.log("♻️ [ChatKit Client] Reusing existing session");
        return currentSession;
      }
    }
  }

  // Create new session
  currentSession = await createSession();
  return currentSession;
}

/**
 * Initialize ChatKit client (lazy loading)
 */
async function initClient() {
  if (chatkitClient) {
    return chatkitClient;
  }

  // Dynamic import to avoid loading if not needed
  const { ChatKit } = await import("@openai/chatkit");
  
  const session = await getSession();
  
  chatkitClient = new ChatKit({
    clientSecret: session.client_secret,
  });

  console.log("✅ [ChatKit Client] Client initialized");
  return chatkitClient;
}

/**
 * Send a message to ChatKit and get response
 */
export async function sendMessage(message: string): Promise<string> {
  console.log("💬 [ChatKit Client] Sending message:", message);

  try {
    const client = await initClient();
    
    // Send message and wait for response
    const response = await client.sendMessage({
      content: message,
    });

    console.log("✅ [ChatKit Client] Response received:", response);

    // Extract text from response
    const text = response.content || response.text || "Pas de réponse";
    return text;

  } catch (error) {
    console.error("❌ [ChatKit Client] Error:", error);
    
    // If session expired, reset and retry once
    if (error instanceof Error && error.message.includes("session")) {
      console.log("🔄 [ChatKit Client] Session expired, retrying...");
      currentSession = null;
      chatkitClient = null;
      
      // Retry once
      const client = await initClient();
      const response = await client.sendMessage({
        content: message,
      });
      
      return response.content || response.text || "Pas de réponse";
    }

    throw error;
  }
}

/**
 * Reset session (useful for starting fresh)
 */
export function resetSession() {
  console.log("🔄 [ChatKit Client] Resetting session");
  currentSession = null;
  chatkitClient = null;
}