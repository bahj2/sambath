CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: dubbing_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dubbing_usage (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    dubbing_id text NOT NULL,
    duration_seconds integer DEFAULT 0 NOT NULL,
    target_language text NOT NULL,
    file_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    username text,
    full_name text,
    avatar_url text,
    bio text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: video_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_queue (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    file_name text NOT NULL,
    video_data text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    khmer_translation text,
    error_message text,
    retry_count integer DEFAULT 0 NOT NULL,
    max_retries integer DEFAULT 3 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    processed_at timestamp with time zone,
    CONSTRAINT video_queue_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])))
);


--
-- Name: dubbing_usage dubbing_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dubbing_usage
    ADD CONSTRAINT dubbing_usage_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: video_queue video_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_queue
    ADD CONSTRAINT video_queue_pkey PRIMARY KEY (id);


--
-- Name: idx_dubbing_usage_user_month; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dubbing_usage_user_month ON public.dubbing_usage USING btree (user_id, created_at);


--
-- Name: idx_video_queue_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_queue_status ON public.video_queue USING btree (status);


--
-- Name: idx_video_queue_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_queue_user_status ON public.video_queue USING btree (user_id, status);


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: video_queue update_video_queue_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_video_queue_updated_at BEFORE UPDATE ON public.video_queue FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles Public profiles are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);


--
-- Name: video_queue Users can delete their own queue items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own queue items" ON public.video_queue FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: dubbing_usage Users can insert their own dubbing usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own dubbing usage" ON public.dubbing_usage FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: video_queue Users can insert their own queue items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own queue items" ON public.video_queue FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: video_queue Users can update their own queue items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own queue items" ON public.video_queue FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: dubbing_usage Users can view their own dubbing usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own dubbing usage" ON public.dubbing_usage FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: video_queue Users can view their own queue items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own queue items" ON public.video_queue FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: dubbing_usage; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dubbing_usage ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: video_queue; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.video_queue ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;