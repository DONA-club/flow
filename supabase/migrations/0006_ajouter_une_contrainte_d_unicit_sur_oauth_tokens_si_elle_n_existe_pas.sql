-- Vérifier et ajouter la contrainte d'unicité sur (user_id, provider)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_user_provider'
  ) THEN
    ALTER TABLE public.oauth_tokens 
    ADD CONSTRAINT unique_user_provider 
    UNIQUE (user_id, provider);
  END IF;
END $$;