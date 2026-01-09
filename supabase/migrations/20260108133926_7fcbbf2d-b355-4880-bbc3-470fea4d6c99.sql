-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create enum for subscription plans
CREATE TYPE public.subscription_plan AS ENUM ('free', 'plus', 'max');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    plan subscription_plan NOT NULL DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
    amount DECIMAL(10,2) DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tool_access table to define which tools are available for each plan
CREATE TABLE public.tool_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_id TEXT NOT NULL UNIQUE,
    tool_name TEXT NOT NULL,
    description TEXT,
    min_plan subscription_plan NOT NULL DEFAULT 'free',
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_access ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's subscription plan
CREATE OR REPLACE FUNCTION public.get_user_plan(_user_id UUID)
RETURNS subscription_plan
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT plan FROM public.subscriptions WHERE user_id = _user_id AND status = 'active'),
    'free'::subscription_plan
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscription"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage subscriptions"
ON public.subscriptions FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for tool_access (everyone can view, only admins can modify)
CREATE POLICY "Anyone can view tool access"
ON public.tool_access FOR SELECT
USING (true);

CREATE POLICY "Admins can manage tool access"
ON public.tool_access FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default tools with their access levels
INSERT INTO public.tool_access (tool_id, tool_name, description, min_plan) VALUES
('speech-synth', 'Speech Synth', 'Text to speech synthesis', 'free'),
('speech-to-text', 'Speech to Text', 'Convert speech to text', 'free'),
('translator', 'Translator', 'Language translation', 'free'),
('video-gen', 'Video Gen', 'AI video generation', 'plus'),
('image-gen', 'Image Gen', 'AI image generation', 'plus'),
('document-ai', 'Document AI', 'AI document analysis', 'plus'),
('voice-clone', 'Voice Clone', 'Clone voices with AI', 'max'),
('video-dubber', 'Video Dubber', 'Neural dubbing studio', 'max'),
('watermark-remover', 'Watermark Remover', 'Remove watermarks from videos', 'max'),
('image-watermark', 'Image Watermark Remover', 'Remove watermarks from images', 'plus'),
('veo-video', 'Veo Video Gen', 'Advanced video generation', 'max'),
('cinematic-lab', 'Cinematic Lab', 'Cinematic video creation', 'max');

-- Trigger for updated_at on subscriptions
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();