/*
# Fix Background Storage: Add SELECT Policy

## Problem
The `backgrounds` storage bucket had INSERT, UPDATE, and DELETE policies
for authenticated users, but NO SELECT policy. This meant users could
upload files but could never read them back — causing "Permission denied"
errors when trying to display uploaded backgrounds.

## Changes
1. Adds a SELECT policy so authenticated users can read their own background
   files (images, GIFs, videos) from their user-id-scoped folder.
2. The bucket was already created; only the missing read policy is added.

## Security
- SELECT scoped to `TO authenticated` with ownership check:
  `(storage.foldername(name))[1] = auth.uid()::text`
- Only files in the user's own folder are readable.
- Bucket: `backgrounds`
*/

-- Add missing SELECT policy for backgrounds bucket
DROP POLICY IF EXISTS "backgrounds_select_own" ON storage.objects;
CREATE POLICY "backgrounds_select_own"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'backgrounds'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
