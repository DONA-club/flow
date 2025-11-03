/* @ts-nocheck */
// Ce fichier s'exécute dans l'environnement Deno (Edge Functions).
// La directive ci-dessus évite les erreurs de typage dans le build web local (Vite/TypeScript).

import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type RefreshBody = {
  refresh_token?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth manuelle (verify_jwt=false par défaut)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  let body: RefreshBody = {};
  try {
    body = await req.json();
  } catch {
    // no-op
  }

  const refreshToken = body.refresh_token;
  if (!refreshToken) {
    return new Response(JSON.stringify({ error: "Missing refresh_token" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    return new Response(JSON.stringify({ error: "Server is missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET secrets" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const params = new URLSearchParams();
  params.set("client_id", clientId);
  params.set("client_secret", clientSecret);
  params.set("grant_type", "refresh_token");
  params.set("refresh_token", refreshToken);

  const googleResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const json = await googleResp.json();

  if (!googleResp.ok) {
    const msg =
      (typeof json?.error_description === "string" && json.error_description) ||
      (typeof json?.error === "string" && json.error) ||
      "Token refresh failed";
    return new Response(JSON.stringify({ error: msg, details: json }), {
      status: googleResp.status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  return new Response(JSON.stringify({
    access_token: json.access_token,
    expires_in: json.expires_in,
    scope: json.scope,
    token_type: json.token_type,
  }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});