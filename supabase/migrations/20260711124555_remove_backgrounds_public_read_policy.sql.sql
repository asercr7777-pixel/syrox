-- Security fix: Remove broad SELECT policy on backgrounds bucket
--
-- The backgrounds_public_read policy allowed any client to list all files
-- in the backgrounds storage bucket. Public bucket URL access does not
-- require a SELECT policy — files are served via their public URL
-- regardless. This policy exposed more data than intended by enabling
-- enumeration of all uploaded files.

DROP POLICY IF EXISTS "backgrounds_public_read" ON storage.objects;
