-- =============================================================================
-- TalentIQ – Row Level Security (RLS) Migration
-- =============================================================================
-- Run this script in the Supabase SQL Editor (as the postgres / service role).
-- This script is idempotent – safe to re-run if it times out midway.
--
-- Strategy
-- --------
-- • The FastAPI backend connects with the SERVICE ROLE key (bypasses RLS by
--   default in Supabase), so all existing backend queries continue to work.
-- • We also add explicit "service_role bypass" policies for clarity /
--   future-proofing.
-- • Direct Supabase client calls from the frontend (if any) must present a
--   valid Supabase JWT; those calls are gated by the user-scoped policies.
-- • Public / shared tables (jobs) are readable by all authenticated users.
-- =============================================================================

-- Helper: create a policy only if it doesn't already exist
CREATE OR REPLACE FUNCTION public.create_policy_if_not_exists(
  p_table text,
  p_name text,
  p_cmd text,
  p_role text,
  p_using text,
  p_check text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = p_table
      AND policyname = p_name
  ) THEN
    IF upper(p_cmd) = 'INSERT' THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR %s TO %s WITH CHECK (%s)',
        p_name, p_table, p_cmd, p_role, coalesce(p_check, p_using)
      );
    ELSE
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR %s TO %s USING (%s)' ||
        CASE WHEN p_check IS NOT NULL THEN ' WITH CHECK (' || p_check || ')' ELSE '' END,
        p_name, p_table, p_cmd, p_role, p_using
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ─── 1. users ────────────────────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

SELECT public.create_policy_if_not_exists('users', 'service_role_all_users', 'ALL', 'service_role', 'true', 'true');
SELECT public.create_policy_if_not_exists('users', 'users_select_own', 'SELECT', 'authenticated', 'id = auth.uid()::text');
SELECT public.create_policy_if_not_exists('users', 'users_update_own', 'UPDATE', 'authenticated', 'id = auth.uid()::text', 'id = auth.uid()::text');


-- ─── 2. user_profiles ────────────────────────────────────────────────────────
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

SELECT public.create_policy_if_not_exists('user_profiles', 'service_role_all_user_profiles', 'ALL', 'service_role', 'true', 'true');
SELECT public.create_policy_if_not_exists('user_profiles', 'user_profiles_select_own', 'SELECT', 'authenticated', 'user_id = auth.uid()::text');
SELECT public.create_policy_if_not_exists('user_profiles', 'user_profiles_insert_own', 'INSERT', 'authenticated', 'user_id = auth.uid()::text', 'user_id = auth.uid()::text');
SELECT public.create_policy_if_not_exists('user_profiles', 'user_profiles_update_own', 'UPDATE', 'authenticated', 'user_id = auth.uid()::text', 'user_id = auth.uid()::text');
SELECT public.create_policy_if_not_exists('user_profiles', 'user_profiles_delete_own', 'DELETE', 'authenticated', 'user_id = auth.uid()::text');


-- ─── 3. resumes ──────────────────────────────────────────────────────────────
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

SELECT public.create_policy_if_not_exists('resumes', 'service_role_all_resumes', 'ALL', 'service_role', 'true', 'true');
SELECT public.create_policy_if_not_exists('resumes', 'resumes_all_own', 'ALL', 'authenticated', 'user_id = auth.uid()::text', 'user_id = auth.uid()::text');


-- ─── 4. resume_versions ──────────────────────────────────────────────────────
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;

SELECT public.create_policy_if_not_exists('resume_versions', 'service_role_all_resume_versions', 'ALL', 'service_role', 'true', 'true');
SELECT public.create_policy_if_not_exists('resume_versions', 'resume_versions_all_own', 'ALL', 'authenticated',
  'resume_id IN (SELECT id FROM public.resumes WHERE user_id = auth.uid()::text)',
  'resume_id IN (SELECT id FROM public.resumes WHERE user_id = auth.uid()::text)');


-- ─── 5. live_rooms ───────────────────────────────────────────────────────────
ALTER TABLE public.live_rooms ENABLE ROW LEVEL SECURITY;

SELECT public.create_policy_if_not_exists('live_rooms', 'service_role_all_live_rooms', 'ALL', 'service_role', 'true', 'true');
SELECT public.create_policy_if_not_exists('live_rooms', 'live_rooms_select_participant', 'SELECT', 'authenticated',
  'created_by = auth.uid()::text OR candidate_id = auth.uid()::text');
SELECT public.create_policy_if_not_exists('live_rooms', 'live_rooms_insert_own', 'INSERT', 'authenticated',
  'created_by = auth.uid()::text', 'created_by = auth.uid()::text');
SELECT public.create_policy_if_not_exists('live_rooms', 'live_rooms_update_own', 'UPDATE', 'authenticated',
  'created_by = auth.uid()::text', 'created_by = auth.uid()::text');
SELECT public.create_policy_if_not_exists('live_rooms', 'live_rooms_delete_own', 'DELETE', 'authenticated',
  'created_by = auth.uid()::text');


-- ─── 6. chats ────────────────────────────────────────────────────────────────
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

SELECT public.create_policy_if_not_exists('chats', 'service_role_all_chats', 'ALL', 'service_role', 'true', 'true');
SELECT public.create_policy_if_not_exists('chats', 'chats_all_own', 'ALL', 'authenticated', 'user_id = auth.uid()::text', 'user_id = auth.uid()::text');


-- ─── 7. chat_messages ────────────────────────────────────────────────────────
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

SELECT public.create_policy_if_not_exists('chat_messages', 'service_role_all_chat_messages', 'ALL', 'service_role', 'true', 'true');
SELECT public.create_policy_if_not_exists('chat_messages', 'chat_messages_all_own', 'ALL', 'authenticated',
  'chat_id IN (SELECT id FROM public.chats WHERE user_id = auth.uid()::text)',
  'chat_id IN (SELECT id FROM public.chats WHERE user_id = auth.uid()::text)');


-- ─── 8. applications ─────────────────────────────────────────────────────────
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

SELECT public.create_policy_if_not_exists('applications', 'service_role_all_applications', 'ALL', 'service_role', 'true', 'true');
SELECT public.create_policy_if_not_exists('applications', 'applications_all_own', 'ALL', 'authenticated', 'user_id = auth.uid()::text', 'user_id = auth.uid()::text');


-- ─── 9. jobs ─────────────────────────────────────────────────────────────────
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

SELECT public.create_policy_if_not_exists('jobs', 'service_role_all_jobs', 'ALL', 'service_role', 'true', 'true');
SELECT public.create_policy_if_not_exists('jobs', 'jobs_select_authenticated', 'SELECT', 'authenticated', 'true');


-- ─── 10. job_matches ─────────────────────────────────────────────────────────
ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;

SELECT public.create_policy_if_not_exists('job_matches', 'service_role_all_job_matches', 'ALL', 'service_role', 'true', 'true');
SELECT public.create_policy_if_not_exists('job_matches', 'job_matches_all_own', 'ALL', 'authenticated', 'user_id = auth.uid()::text', 'user_id = auth.uid()::text');


-- ─── 11. groups ──────────────────────────────────────────────────────────────
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

SELECT public.create_policy_if_not_exists('groups', 'service_role_all_groups', 'ALL', 'service_role', 'true', 'true');
SELECT public.create_policy_if_not_exists('groups', 'groups_select_member', 'SELECT', 'authenticated',
  'creator_id = auth.uid()::text OR id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()::text)');
SELECT public.create_policy_if_not_exists('groups', 'groups_insert_own', 'INSERT', 'authenticated',
  'creator_id = auth.uid()::text', 'creator_id = auth.uid()::text');
SELECT public.create_policy_if_not_exists('groups', 'groups_update_own', 'UPDATE', 'authenticated',
  'creator_id = auth.uid()::text', 'creator_id = auth.uid()::text');
SELECT public.create_policy_if_not_exists('groups', 'groups_delete_own', 'DELETE', 'authenticated',
  'creator_id = auth.uid()::text');


-- ─── 12. group_members ───────────────────────────────────────────────────────
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

SELECT public.create_policy_if_not_exists('group_members', 'service_role_all_group_members', 'ALL', 'service_role', 'true', 'true');
SELECT public.create_policy_if_not_exists('group_members', 'group_members_select_own_groups', 'SELECT', 'authenticated',
  'group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()::text)');
SELECT public.create_policy_if_not_exists('group_members', 'group_members_insert_own', 'INSERT', 'authenticated',
  'user_id = auth.uid()::text', 'user_id = auth.uid()::text');
SELECT public.create_policy_if_not_exists('group_members', 'group_members_delete_own', 'DELETE', 'authenticated',
  'user_id = auth.uid()::text');


-- ─── 13. group_messages ──────────────────────────────────────────────────────
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

SELECT public.create_policy_if_not_exists('group_messages', 'service_role_all_group_messages', 'ALL', 'service_role', 'true', 'true');
SELECT public.create_policy_if_not_exists('group_messages', 'group_messages_select_member', 'SELECT', 'authenticated',
  'group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()::text)');
SELECT public.create_policy_if_not_exists('group_messages', 'group_messages_insert_member', 'INSERT', 'authenticated',
  'sender_id = auth.uid()::text AND group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()::text)',
  'sender_id = auth.uid()::text AND group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()::text)');
SELECT public.create_policy_if_not_exists('group_messages', 'group_messages_delete_own', 'DELETE', 'authenticated',
  'sender_id = auth.uid()::text');


-- ─── 14. group_files ─────────────────────────────────────────────────────────
ALTER TABLE public.group_files ENABLE ROW LEVEL SECURITY;

SELECT public.create_policy_if_not_exists('group_files', 'service_role_all_group_files', 'ALL', 'service_role', 'true', 'true');
SELECT public.create_policy_if_not_exists('group_files', 'group_files_select_member', 'SELECT', 'authenticated',
  'group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()::text)');
SELECT public.create_policy_if_not_exists('group_files', 'group_files_insert_member', 'INSERT', 'authenticated',
  'sender_id = auth.uid()::text AND group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()::text)',
  'sender_id = auth.uid()::text AND group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()::text)');
SELECT public.create_policy_if_not_exists('group_files', 'group_files_delete_own', 'DELETE', 'authenticated',
  'sender_id = auth.uid()::text');


-- ─── 15. document_embeddings ─────────────────────────────────────────────────
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;

SELECT public.create_policy_if_not_exists('document_embeddings', 'service_role_all_document_embeddings', 'ALL', 'service_role', 'true', 'true');
SELECT public.create_policy_if_not_exists('document_embeddings', 'document_embeddings_all_own', 'ALL', 'authenticated', 'user_id = auth.uid()::text', 'user_id = auth.uid()::text');


-- ─── 16. interviews ──────────────────────────────────────────────────────────
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

SELECT public.create_policy_if_not_exists('interviews', 'service_role_all_interviews', 'ALL', 'service_role', 'true', 'true');
SELECT public.create_policy_if_not_exists('interviews', 'interviews_all_own', 'ALL', 'authenticated', 'user_id = auth.uid()::text', 'user_id = auth.uid()::text');


-- ─── 17. interview_questions ─────────────────────────────────────────────────
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

SELECT public.create_policy_if_not_exists('interview_questions', 'service_role_all_interview_questions', 'ALL', 'service_role', 'true', 'true');
SELECT public.create_policy_if_not_exists('interview_questions', 'interview_questions_all_own', 'ALL', 'authenticated',
  'interview_id IN (SELECT id FROM public.interviews WHERE user_id = auth.uid()::text)',
  'interview_id IN (SELECT id FROM public.interviews WHERE user_id = auth.uid()::text)');


-- ─── 18. user_platform_credentials ──────────────────────────────────────────
-- Sensitive table – service role only; no direct client access allowed
ALTER TABLE public.user_platform_credentials ENABLE ROW LEVEL SECURITY;

SELECT public.create_policy_if_not_exists('user_platform_credentials', 'service_role_all_user_platform_credentials', 'ALL', 'service_role', 'true', 'true');

-- No authenticated policy: credentials are never exposed to direct client queries


-- ─── 19. alembic_version ─────────────────────────────────────────────────────
-- Alembic migration metadata – service role only
ALTER TABLE public.alembic_version ENABLE ROW LEVEL SECURITY;

SELECT public.create_policy_if_not_exists('alembic_version', 'service_role_all_alembic_version', 'ALL', 'service_role', 'true', 'true');

-- No authenticated policy: credentials are never exposed to direct client queries




-- =============================================================================
-- Cleanup helper function (optional – run after migration succeeds)
-- DROP FUNCTION IF EXISTS public.create_policy_if_not_exists;
--
-- Verify with:
--   SELECT schemaname, tablename, rowsecurity
--   FROM pg_tables
--   WHERE schemaname = 'public'
--   ORDER BY tablename;
-- =============================================================================
