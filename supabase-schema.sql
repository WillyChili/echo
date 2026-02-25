-- ─────────────────────────────────────────────
-- Echo App — Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- ─────────────────────────────────────────────

-- 1. PROFILES (extended user info)
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID  REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,                          -- chosen display name (set during onboarding)
  avatar_url   TEXT,                          -- public URL of uploaded avatar
  language     TEXT DEFAULT 'en',             -- UI language: 'en' | 'es'
  bio          TEXT,                          -- short user bio for Echo context
  api_key      TEXT,                          -- user's own Anthropic API key (optional)
  llm_provider TEXT DEFAULT 'anthropic',      -- future: openai, gemini, etc.
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: add columns if the table already exists without them
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url   TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language     TEXT DEFAULT 'en';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio          TEXT;

-- 2. NOTES
CREATE TABLE IF NOT EXISTS notes (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date        DATE NOT NULL,
  content     TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INDEX for fast note lookups by user + date
CREATE INDEX IF NOT EXISTS notes_user_date_idx ON notes (user_id, date);

-- 4. ROW LEVEL SECURITY — users only see their own data
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes    ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles: select own"  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles: insert own"  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles: update own"  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Notes policies
CREATE POLICY "notes: select own"     ON notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notes: insert own"     ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notes: update own"     ON notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notes: delete own"     ON notes FOR DELETE USING (auth.uid() = user_id);

-- 5. AUTO-CREATE profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
