-- Security fixes: RLS gaps, constraints, and storage hardening
--
-- 1. workout_sessions: add missing UPDATE policy (owner-scoped)
-- 2. profiles: enforce username uniqueness constraint
-- 3. storage.objects: restrict backgrounds bucket to image/video MIME types only

-- 1. workout_sessions: add missing UPDATE policy
DROP POLICY IF EXISTS "update_own_workouts" ON workout_sessions;
CREATE POLICY "update_own_workouts"
ON workout_sessions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. profiles: enforce username uniqueness
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_username_unique_key'
      AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_username_unique_key UNIQUE (username);
  END IF;
END $$;

-- 3. storage.objects: restrict backgrounds bucket to images and videos only
DROP POLICY IF EXISTS "backgrounds_insert_own" ON storage.objects;
CREATE POLICY "backgrounds_insert_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'backgrounds'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND (
    metadata->>'mimetype' LIKE 'image/%'
    OR metadata->>'mimetype' LIKE 'video/%'
  )
);

DROP POLICY IF EXISTS "backgrounds_update_own" ON storage.objects;
CREATE POLICY "backgrounds_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'backgrounds'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'backgrounds'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND (
    metadata->>'mimetype' LIKE 'image/%'
    OR metadata->>'mimetype' LIKE 'video/%'
  )
);
