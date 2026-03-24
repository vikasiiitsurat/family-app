/*
  Remove Instagram and Facebook fields from schema and public projection.
*/

DROP VIEW IF EXISTS members_public;

ALTER TABLE members
  DROP COLUMN IF EXISTS instagram,
  DROP COLUMN IF EXISTS facebook;

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
