-- Create research_history table to store past sessions
CREATE TABLE public.research_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  query TEXT NOT NULL,
  mode TEXT NOT NULL,
  tab_type TEXT NOT NULL DEFAULT 'research',
  result TEXT NOT NULL,
  citations TEXT[] DEFAULT '{}',
  files_analyzed TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.research_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own history
CREATE POLICY "Users can view their own history"
  ON public.research_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own history
CREATE POLICY "Users can insert their own history"
  ON public.research_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own history
CREATE POLICY "Users can delete their own history"
  ON public.research_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_research_history_user_id ON public.research_history(user_id);
CREATE INDEX idx_research_history_created_at ON public.research_history(created_at DESC);