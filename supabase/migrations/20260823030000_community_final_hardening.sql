-- Final Community hardening: make delete/report permissions explicit and keep Realtime reliable.

ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages REPLICA IDENTITY FULL;

DROP POLICY IF EXISTS "community_messages_delete_own" ON public.community_messages;
CREATE POLICY "community_messages_delete_own"
ON public.community_messages
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "community_reports_insert" ON public.community_reports;
CREATE POLICY "community_reports_insert"
ON public.community_reports
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = reporter_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'community_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS community_messages_user_created_idx
  ON public.community_messages(user_id, created_at DESC);
