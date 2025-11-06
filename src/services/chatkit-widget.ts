import { supabase } from "@/integrations/supabase/client";

export type ChatkitSessionData = {
  client_secret: string;
  session_id: string;
  expires_after?: number;
};

let currentSession: ChatkitSessionData | null = null;

export async function createChatkitSession(): Promise<ChatkitSessionData> {
  console.log("🔑 [ChatKit Widget] Creating new session...");

  try {
    const { data, error } = await supabase.functions.invoke("chatkit-create-session", {
      body: {
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
    });

    if (error) {
      console.error("❌ [ChatKit Widget] Session creation failed:", error);
      throw new Error(error.message || "Failed to create ChatKit session");
    }

    if (!data?.client_secret) {
      console.error("❌ [ChatKit Widget] No client_secret in response:", data);
      throw new Error("Invalid session response");
    }

    console.log("✅ [ChatKit Widget] Session created:", data.session_id);
    currentSession = data;
    return data;

  } catch (error) {
    console.error("💥 [ChatKit Widget] Exception:", error);
    throw error;
  }
}

export function getCurrentSession(): ChatkitSessionData | null {
  return currentSession;
}

export function clearSession(): void {
  console.log("🔄 [ChatKit Widget] Clearing session");
  currentSession = null;
}