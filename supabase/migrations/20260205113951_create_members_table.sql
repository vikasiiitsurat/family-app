/*
  # Create Members Table for Anniversary & Birthday Celebration

  1. New Tables
    - `members`
      - `id` (uuid, primary key)
      - `name` (text, required) - Full name of the member
      - `email` (text, unique, required) - Email address
      - `dob` (date, required) - Date of birth
      - `anniversary` (date, optional) - Anniversary date if applicable
      - `message` (text, optional) - Short profile message
      - `created_at` (timestamptz) - Registration timestamp
  
  2. Security
    - Enable RLS on `members` table
    - Add policy for anyone to read member data (public register)
    - Add policy for anyone to insert new members (public registration)
  
  3. Indexes
    - Add index on email for quick lookups
    - Add index on dob for birthday queries
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS citext;

--------------------------------------------------
-- TABLE: members
--------------------------------------------------
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  name text NOT NULL
    CHECK (length(name) BETWEEN 2 AND 100),

  email citext UNIQUE NOT NULL
    CHECK (
      email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    ),

  dob date NOT NULL
    CHECK (dob < CURRENT_DATE),

  anniversary date
    CHECK (anniversary IS NULL OR anniversary >= dob),

  message text
    CHECK (length(message) <= 500),

  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

--------------------------------------------------
-- INDEXES
--------------------------------------------------

-- Fast email lookup
CREATE INDEX IF NOT EXISTS idx_members_email
  ON members(email);

-- Birthday queries (month + day)
CREATE INDEX IF NOT EXISTS idx_members_dob_mmdd
  ON members (
    EXTRACT(MONTH FROM dob),
    EXTRACT(DAY FROM dob)
  );

-- Anniversary queries (month + day)
CREATE INDEX IF NOT EXISTS idx_members_anniversary_mmdd
  ON members (
    EXTRACT(MONTH FROM anniversary),
    EXTRACT(DAY FROM anniversary)
  )
  WHERE anniversary IS NOT NULL;

--------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
--------------------------------------------------
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Public can read active members (no restriction here;
-- use views if you want to hide email later)
CREATE POLICY "Public can read active members"
  ON members
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Public registration allowed
CREATE POLICY "Public can insert members"
  ON members
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can update members (optional)
CREATE POLICY "Admins can update members"
  ON members
  FOR UPDATE
  TO authenticated
  USING (auth.role() = 'admin');

--------------------------------------------------
-- AUTO UPDATE updated_at
--------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_members_updated_at
BEFORE UPDATE ON members
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
