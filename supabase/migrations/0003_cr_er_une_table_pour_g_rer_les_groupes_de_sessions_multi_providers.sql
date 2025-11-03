-- Créer la table session_groups
CREATE TABLE public.session_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table session_tokens pour stocker les tokens de chaque provider par groupe
CREATE TABLE public.session_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_group_id UUID REFERENCES public.session_groups(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter un index pour les recherches rapides
CREATE INDEX idx_session_tokens_group_provider ON public.session_tokens(session_group_id, provider);

-- Activer RLS
ALTER TABLE public.session_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_tokens ENABLE ROW LEVEL SECURITY;

-- Créer les politiques de sécurité
CREATE POLICY "Users can only access their own session groups" 
ON public.session_groups 
FOR ALL TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only access tokens from their session groups" 
ON public.session_tokens 
FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.session_groups 
    WHERE id = session_tokens.session_group_id 
    AND user_id = auth.uid()
  )
);