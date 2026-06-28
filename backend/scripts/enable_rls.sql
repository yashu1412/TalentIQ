-- =============================================================================
-- TalentIQ – Row Level Security (RLS) Migration
-- =============================================================================
-- Run this script in the Supabase SQL Editor (as the postgres / service role).
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

-- ─── 1. users ────────────────────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Service role: full access (backend)
CREATE POLICY "service_role_all_users"
  ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users: read their own row
CREATE POLICY "users_select_own"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid()::text);

-- Authenticated users: update their own row
CREATE POLICY "users_update_own"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);


-- ─── 2. user_profiles ────────────────────────────────────────────────────────
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_user_profiles"
  ON public.user_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "user_profiles_select_own"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "user_profiles_insert_own"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "user_profiles_update_own"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "user_profiles_delete_own"
  ON public.user_profiles
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid()::text);


-- ─── 3. resumes ──────────────────────────────────────────────────────────────
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_resumes"
  ON public.resumes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "resumes_all_own"
  ON public.resumes
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);


-- ─── 4. resume_versions ──────────────────────────────────────────────────────
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_resume_versions"
  ON public.resume_versions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Access via parent resume ownership
CREATE POLICY "resume_versions_all_own"
  ON public.resume_versions
  FOR ALL
  TO authenticated
  USING (
    resume_id IN (
      SELECT id FROM public.resumes WHERE user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    resume_id IN (
      SELECT id FROM public.resumes WHERE user_id = auth.uid()::text
    )
  );


-- ─── 5. live_rooms ───────────────────────────────────────────────────────────
ALTER TABLE public.live_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_live_rooms"
  ON public.live_rooms
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Creator or invited candidate can see the room
CREATE POLICY "live_rooms_select_participant"
  ON public.live_rooms
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()::text
    OR candidate_id = auth.uid()::text
  );

CREATE POLICY "live_rooms_insert_own"
  ON public.live_rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid()::text);

CREATE POLICY "live_rooms_update_own"
  ON public.live_rooms
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid()::text)
  WITH CHECK (created_by = auth.uid()::text);

CREATE POLICY "live_rooms_delete_own"
  ON public.live_rooms
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid()::text);


-- ─── 6. chats ────────────────────────────────────────────────────────────────
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_chats"
  ON public.chats
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "chats_all_own"
  ON public.chats
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);


-- ─── 7. chat_messages ────────────────────────────────────────────────────────
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_chat_messages"
  ON public.chat_messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "chat_messages_all_own"
  ON public.chat_messages
  FOR ALL
  TO authenticated
  USING (
    chat_id IN (
      SELECT id FROM public.chats WHERE user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    chat_id IN (
      SELECT id FROM public.chats WHERE user_id = auth.uid()::text
    )
  );


-- ─── 8. applications ─────────────────────────────────────────────────────────
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_applications"
  ON public.applications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "applications_all_own"
  ON public.applications
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);


-- ─── 9. jobs ─────────────────────────────────────────────────────────────────
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_jobs"
  ON public.jobs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Jobs are public read (job listings viewable by all authenticated users)
CREATE POLICY "jobs_select_authenticated"
  ON public.jobs
  FOR SELECT
  TO authenticated
  USING (true);


-- ─── 10. job_matches ─────────────────────────────────────────────────────────
ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_job_matches"
  ON public.job_matches
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "job_matches_all_own"
  ON public.job_matches
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);


-- ─── 11. groups ──────────────────────────────────────────────────────────────
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_groups"
  ON public.groups
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Members and creator can see the group
CREATE POLICY "groups_select_member"
  ON public.groups
  FOR SELECT
  TO authenticated
  USING (
    creator_id = auth.uid()::text
    OR id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "groups_insert_own"
  ON public.groups
  FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid()::text);

CREATE POLICY "groups_update_own"
  ON public.groups
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid()::text)
  WITH CHECK (creator_id = auth.uid()::text);

CREATE POLICY "groups_delete_own"
  ON public.groups
  FOR DELETE
  TO authenticated
  USING (creator_id = auth.uid()::text);


-- ─── 12. group_members ───────────────────────────────────────────────────────
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_group_members"
  ON public.group_members
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Members can see membership of groups they belong to
CREATE POLICY "group_members_select_own_groups"
  ON public.group_members
  FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "group_members_insert_own"
  ON public.group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "group_members_delete_own"
  ON public.group_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid()::text);


-- ─── 13. group_messages ──────────────────────────────────────────────────────
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_group_messages"
  ON public.group_messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "group_messages_select_member"
  ON public.group_messages
  FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "group_messages_insert_member"
  ON public.group_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()::text
    AND group_id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "group_messages_delete_own"
  ON public.group_messages
  FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid()::text);


-- ─── 14. group_files ─────────────────────────────────────────────────────────
ALTER TABLE public.group_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_group_files"
  ON public.group_files
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "group_files_select_member"
  ON public.group_files
  FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "group_files_insert_member"
  ON public.group_files
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()::text
    AND group_id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "group_files_delete_own"
  ON public.group_files
  FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid()::text);


-- ─── 15. document_embeddings ─────────────────────────────────────────────────
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_document_embeddings"
  ON public.document_embeddings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "document_embeddings_all_own"
  ON public.document_embeddings
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);


-- ─── 16. interviews ──────────────────────────────────────────────────────────
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_interviews"
  ON public.interviews
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "interviews_all_own"
  ON public.interviews
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);


-- ─── 17. interview_questions ─────────────────────────────────────────────────
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_interview_questions"
  ON public.interview_questions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "interview_questions_all_own"
  ON public.interview_questions
  FOR ALL
  TO authenticated
  USING (
    interview_id IN (
      SELECT id FROM public.interviews WHERE user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    interview_id IN (
      SELECT id FROM public.interviews WHERE user_id = auth.uid()::text
    )
  );


-- ─── 18. user_platform_credentials ──────────────────────────────────────────
-- Sensitive table – service role only; no direct client access allowed
ALTER TABLE public.user_platform_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_user_platform_credentials"
  ON public.user_platform_credentials
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- No authenticated policy: credentials are never exposed to direct client queries


-- =============================================================================
-- Done. Verify with:
--   SELECT schemaname, tablename, rowsecurity
--   FROM pg_tables
--   WHERE schemaname = 'public'
--   ORDER BY tablename;
-- =============================================================================
