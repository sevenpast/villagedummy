-- Fix database permissions for Service Role
-- Run this in your Supabase SQL Editor

-- Grant permissions to service_role for the public schema
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Specifically grant permissions on the documents table (uses UUID, not SERIAL)
GRANT ALL ON public.documents TO service_role;

-- Grant permissions on other important tables
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.tasks TO service_role;
GRANT ALL ON public.children TO service_role;
GRANT ALL ON public.user_task_status TO service_role;

-- Grant permissions on sequences that actually exist (like tasks_id_seq, modules_id_seq)
GRANT USAGE ON SEQUENCE tasks_id_seq TO service_role;
GRANT USAGE ON SEQUENCE modules_id_seq TO service_role;

-- Make sure the service_role can create tables and sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;
