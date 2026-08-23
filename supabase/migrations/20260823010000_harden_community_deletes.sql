-- Ensure deleted community messages stay deleted and clients receive complete DELETE payloads.
ALTER TABLE public.community_messages REPLICA IDENTITY FULL;

DROP POLICY IF EXISTS "community_messages_delete_own" ON public.community_messages;
CREATE POLICY "community_messages_delete_own"
ON public.community_messages FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
