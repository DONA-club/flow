/* @ts-nocheck */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CHATKIT_API_URL = "https://chatkit.openai.com/api/v1/workflows/run";
const WORKFLOW_ID = "wf_68e76f7e35b08190a65e0350e1b43ff20dc8cbc65c270e59";
const DOMAIN_PUBLIC_KEY = "domain_pk_690cd9bd2a34819082a4eae88e1e171b035be3ede42b08e4";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("🚀 [ChatKit Proxy] Received request");
  console.log("📋 [ChatKit Proxy] Request method:", req.method);
  console.log("📋 [ChatKit Proxy] Content-Type:", req.headers.get("content-type"));

  try {
    // Clone the request to read body multiple times if needed
    const clonedReq = req.clone();
    
    // Try to get the raw text first
    let rawBody;
    try {
      rawBody = await clonedReq.text();
      console.log("📦 [ChatKit Proxy] Raw body (text):", rawBody);
      console.log("📦 [ChatKit Proxy] Raw body type:", typeof rawBody);
    } catch (textError) {
      console.error("❌ [ChatKit Proxy] Failed to read text:", textError);
    }

    // Now try to parse as JSON
    let body;
    try {
      if (rawBody) {
        body = JSON.parse(rawBody);
      } else {
        body = await req.json();
      }
      console.log("✅ [ChatKit Proxy] Parsed body:", JSON.stringify(body));
    } catch (jsonError) {
      console.error("❌ [ChatKit Proxy] JSON parse error:", jsonError);
      console.error("❌ [ChatKit Proxy] Raw body was:", rawBody);
      
      return new Response(
        JSON.stringify({ 
          error: "Invalid JSON in request body",
          details: jsonError.message,
          receivedBody: rawBody
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { message } = body;
    
    if (!message) {
      console.error("❌ [ChatKit Proxy] Missing message in body");
      return new Response(
        JSON.stringify({ error: "Missing message parameter", receivedBody: body }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("📝 [ChatKit Proxy] User message:", message);

    const requestBody = {
      workflow_id: WORKFLOW_ID,
      input: {
        input_as_text: message,
      },
    };

    console.log("📦 [ChatKit Proxy] Forwarding to ChatKit API");

    const response = await fetch(CHATKIT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DOMAIN_PUBLIC_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log("📡 [ChatKit Proxy] Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [ChatKit Proxy] Error response:", errorText);
      
      return new Response(
        JSON.stringify({ 
          error: `ChatKit API error (${response.status})`,
          details: errorText 
        }),
        { 
          status: response.status, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    const data = await response.json();
    console.log("✅ [ChatKit Proxy] Success response");

    return new Response(
      JSON.stringify(data),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  } catch (error) {
    console.error("💥 [ChatKit Proxy] Exception:", error);
    console.error("💥 [ChatKit Proxy] Error stack:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
});