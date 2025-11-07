-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_key TEXT NOT NULL,
  preference_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, preference_key)
);

-- Enable RLS (REQUIRED for security)
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create secure policies for each operation
CREATE POLICY "user_preferences_select_policy" ON public.user_preferences 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "user_preferences_insert_policy" ON public.user_preferences 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_preferences_update_policy" ON public.user_preferences 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "user_preferences_delete_policy" ON public.user_preferences 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_key ON public.user_preferences(user_id, preference_key);

-- Add trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();