-- Create storage bucket for watermark videos (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('watermark-videos', 'watermark-videos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for watermark-videos bucket
CREATE POLICY "Users can upload their own videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'watermark-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'watermark-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'watermark-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create watermark_jobs table
CREATE TABLE public.watermark_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  task_id TEXT,
  result_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.watermark_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own jobs"
ON public.watermark_jobs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own jobs"
ON public.watermark_jobs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs"
ON public.watermark_jobs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jobs"
ON public.watermark_jobs FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_watermark_jobs_updated_at
BEFORE UPDATE ON public.watermark_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();