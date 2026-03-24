/*
  Security hardening: disable public writes to members table.
  This migration removes permissive write policies that allowed anonymous
  and authenticated users to insert/update arbitrary records.
*/

-- Remove insecure write policies
DROP POLICY IF EXISTS "Public can insert members" ON members;
DROP POLICY IF EXISTS "Public can update members" ON members;

-- Keep existing read policy intact for now.
-- Next step should introduce authenticated ownership-based write policies.