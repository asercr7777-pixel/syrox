/*
# Create background-uploads storage bucket

1. Storage
- Create a public storage bucket named `backgrounds` for user-uploaded background images and videos.
- Files are stored per-user under `user_id/` path prefixes.
2. Security
- Public read access (bucket is public) so the browser can load background URLs without an auth token.
- Authenticated users can INSERT and UPDATE objects only under their own `user_id/` prefix.
- Authenticated users can DELETE only their own objects.
3. Notes
- The bucket is public so that `<img>` / `<video>` / CSS `background-image` can reference the URL directly without needing a signed-token fetch.
- RLS on storage.objects enforces that each user can only write/delete their own folder.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('backgrounds', 'backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read (public bucket)
DROP POLICY IF EXISTS "backgrounds_public_read" ON storage.objects;
CREATE POLICY "backgrounds_public_read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'backgrounds');

-- Allow authenticated users to upload to their own folder
DROP POLICY IF EXISTS "backgrounds_insert_own" ON storage.objects;
CREATE POLICY "backgrounds_insert_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'backgrounds' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update their own files
DROP POLICY IF EXISTS "backgrounds_update_own" ON storage.objects;
CREATE POLICY "backgrounds_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'backgrounds' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'backgrounds' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own files
DROP POLICY IF EXISTS "backgrounds_delete_own" ON storage.objects;
CREATE POLICY "backgrounds_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'backgrounds' AND (storage.foldername(name))[1] = auth.uid()::text);
