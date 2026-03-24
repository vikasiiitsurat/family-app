/*
  Security hardening for profile photo storage.
  - Ensure member-photos bucket is private
  - Restrict object access to authenticated users and only their own folder
*/

-- Ensure bucket exists and is private with strict file constraints
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'member-photos',
  'member-photos',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Remove permissive/legacy policies if they exist
DROP POLICY IF EXISTS "Public can view member photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload member photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can update member photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete member photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can read own member photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload own member photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update own member photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete own member photos" ON storage.objects;

-- Authenticated users can only read their own photos folder
CREATE POLICY "Authenticated can read own member photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'member-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can only upload to their own photos folder
CREATE POLICY "Authenticated can upload own member photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'member-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can only update their own photos folder
CREATE POLICY "Authenticated can update own member photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'member-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'member-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can only delete their own photos folder
CREATE POLICY "Authenticated can delete own member photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'member-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
