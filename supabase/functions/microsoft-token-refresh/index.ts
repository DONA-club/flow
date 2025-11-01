/* @ts-nocheck */
// Fonction Edge (Deno) pour rafraîchir le jeton Microsoft Graph.
// Nécessite les secrets: MICROSOFT_CLIENT_ID et MICROSOFT_CLIENT_SECRET.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type RefreshBody = {
  refresh_token?: string;
  scope?: string;
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

  const clientId = Deno.env.get("MICROSOFT_CLIENT_ID");
  const clientSecret = Deno.env.get("MICROSOFT_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    return new Response(JSON.stringify({ error: "Server is missing MICROSOFT_CLIENT_ID/MICROSOFT_CLIENT_SECRET secrets" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Pour MS identity v2, l'endpoint de token:
  const tokenUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/token";

  const defaultScopes = "Calendars.Read offline_access openid profile email";
  const scopes = (body.scope && String(body.scope).trim().length > 0) ? body.scope! : defaultScopes;

  const params = new URLSearchParams();
  params.set("client_id", clientId);
  params.set("client_secret", clientSecret);
  params.set("grant_type", "refresh_token");
  params.set("refresh_token", refreshToken);
  params.set("scope", scopes);

  const msResp = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const json = await msResp.json();

  if (!msResp.ok) {
    const msg = typeof json?.error_description === "string"
      ? json.error_description
      : (typeof json?.error === "string" ? json.error : "Token refresh failed");
    return new Response(JSON.stringify({ error: msg, details: json }), {
      status: msResp.status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  return new Response(JSON.stringify({
    access_token: json.access_token,
    expires_in: json.expires_in,
    scope: json.scope,
    token_type: json.token_type,
    refresh_token: json.refresh_token, // MS peut renvoyer un nouveau refresh_token
  }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});