/*
  Security hardening: restrict public reads to a sanitized projection.
  - Revoke direct table access for anon/authenticated roles
  - Remove permissive public read policy on members
  - Expose only non-sensitive columns through members_public view
*/

-- Remove direct public read path
DROP POLICY IF EXISTS "Public can read active members" ON members;
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE members FROM anon, authenticated;

-- Recreate a safe public projection
DROP VIEW IF EXISTS members_public;
CREATE VIEW members_public AS
SELECT
  id,
  name,
  dob,
  qualification,
  current_status,
  gender,
  anniversary,
  linkedin,
  whatsapp,
  profile_photo,
  fathers_name,
  mothers_name,
  spouse_name,
  timezone,
  created_at
FROM members
WHERE is_active = true;

GRANT SELECT ON TABLE members_public TO anon, authenticated;
