/*
  Fix member photo access for the public family app.
  - Make the member-photos bucket public so stored URLs render in browsers
  - Allow public uploads only inside the profile-photos/ prefix used by the app
*/

UPDATE storage.buckets
SET public = true
WHERE id = 'member-photos';

DROP POLICY IF EXISTS "Authenticated can read own member photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload own member photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update own member photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete own member photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view member photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload member photos" ON storage.objects;

CREATE POLICY "Public can view member photos"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'member-photos');

CREATE POLICY "Public can upload member photos"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'member-photos'
  AND name LIKE 'profile-photos/%'
);
