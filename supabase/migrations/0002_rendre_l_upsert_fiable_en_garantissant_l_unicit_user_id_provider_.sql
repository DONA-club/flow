CREATE UNIQUE INDEX IF NOT EXISTS oauth_tokens_user_provider_uidx 
ON public.oauth_tokens (user_id, provider);