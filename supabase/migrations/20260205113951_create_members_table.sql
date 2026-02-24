/*
  Create members table aligned with current app fields.
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS citext;

-- TABLE: members
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  name text NOT NULL
    CHECK (length(name) BETWEEN 2 AND 100),

  email citext
    CHECK (
      email IS NULL OR email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    ),

  dob date NOT NULL
    CHECK (dob < CURRENT_DATE),

  phone text NOT NULL
    CHECK (phone ~ '^[0-9]{10}$'),

  qualification text NOT NULL DEFAULT '',
  current_status text NOT NULL DEFAULT '',
  gender text
    CHECK (gender IS NULL OR gender IN ('male', 'female')),

  anniversary date
    CHECK (anniversary IS NULL OR anniversary >= dob),

  linkedin text,
  whatsapp text
    CHECK (whatsapp IS NULL OR whatsapp ~ '^[0-9]{10}$'),
  instagram text,
  facebook text,
  profile_photo text,
  fathers_name text,
  mothers_name text,
  spouse_name text,
  timezone text,

  message text
    CHECK (length(message) <= 500),

  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- CONSTRAINTS / INDEXES

-- Keep email and phone unique for search/update flows.
CREATE UNIQUE INDEX IF NOT EXISTS uq_members_email_not_null
  ON members(email)
  WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_members_phone
  ON members(phone);

CREATE INDEX IF NOT EXISTS idx_members_name
  ON members(name);

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

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active members"
  ON members
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Public can insert members"
  ON members
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- App uses open update flow (search + update from client).
CREATE POLICY "Public can update members"
  ON members
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- AUTO UPDATE updated_at
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
