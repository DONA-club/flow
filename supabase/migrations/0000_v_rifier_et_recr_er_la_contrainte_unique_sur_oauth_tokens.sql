-- Supprimer l'ancienne contrainte si elle existe
ALTER TABLE oauth_tokens DROP CONSTRAINT IF EXISTS oauth_tokens_user_id_provider_key;

-- Créer la contrainte unique sur (user_id, provider)
ALTER TABLE oauth_tokens ADD CONSTRAINT oauth_tokens_user_id_provider_key UNIQUE (user_id, provider);