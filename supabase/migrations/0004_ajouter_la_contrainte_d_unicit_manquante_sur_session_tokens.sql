-- Ajouter la contrainte d'unicité sur (session_group_id, provider)
ALTER TABLE public.session_tokens 
ADD CONSTRAINT unique_session_group_provider 
UNIQUE (session_group_id, provider);