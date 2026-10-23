/*
# Authentication, profiles, user state, and leaderboard overhaul

1. New Tables
- `profiles`
  - `id` (uuid, primary key, references auth.users) — one row per user
  - `username` (text, unique) — display name chosen at sign-up
  - `avatar` (text) — emoji or data URL
  - `avatar_color` (text)
  - `banner_color` (text)
  - `name_color` (text)
  - `theme` (text)
  - `created_at` (timestamptz)
- `user_state`
  - `user_id` (uuid, primary key, references auth.users) — one row per user
  - `state` (jsonb) — the full app state blob (tasks, inventory, workouts, history, etc.)
  - `updated_at` (timestamptz)
- `workout_sessions`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `workout_type` (text) — push | pull | legs | cardio | boxing | custom
  - `duration_seconds` (int)
  - `completed_at` (timestamptz)

2. Modified Tables
- `leaderboard`
  - Replaces `device_id` primary key with `user_id` (uuid, references auth.users).
  - Adds `discipline_score` (int), `tasks_completed` (int), `background_type` (text), `background_value` (text).
  - Keeps xp, level, total_points, streak, rank columns.
  - RLS now scoped to `authenticated` with ownership via `auth.uid() = user_id`.
  - SELECT is public to authenticated (so all signed-in users see the leaderboard).

3. Security
- `profiles`: owner-scoped CRUD (authenticated, auth.uid() = id).
- `user_state`: owner-scoped CRUD (authenticated, auth.uid() = user_id).
- `workout_sessions`: owner-scoped CRUD (authenticated, auth.uid() = user_id).
- `leaderboard`: SELECT to authenticated (all signed-in users can view the board);
  INSERT/UPDATE/DELETE owner-scoped (auth.uid() = user_id).

4. Notes
- This migration supports the new authentication system. All user data is now
  scoped to the authenticated user via `auth.uid()`.
- The `user_state` table stores the entire app state as JSON so the complex
  existing store logic works without schema-izing every field.
- The leaderboard is rebuilt to key on `user_id` instead of `device_id` so each
  registered user has exactly one row.
- Email confirmation stays OFF (per Supabase auth defaults for this project).
*/

-- Profiles table: extends auth.users with app-specific display data
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL DEFAULT 'Hunter',
  avatar text NOT NULL DEFAULT '🐺',
  avatar_color text NOT NULL DEFAULT '#7c3aed',
  banner_color text NOT NULL DEFAULT '#1e1b4b',
  name_color text NOT NULL DEFAULT '#fbbf24',
  theme text NOT NULL DEFAULT 'shadow',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile"
ON profiles FOR SELECT
TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile"
ON profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
ON profiles FOR UPDATE
TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile"
ON profiles FOR DELETE
TO authenticated USING (auth.uid() = id);

-- User state table: stores the full app state as JSON per user
CREATE TABLE IF NOT EXISTS user_state (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_state" ON user_state;
CREATE POLICY "select_own_state"
ON user_state FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_state" ON user_state;
CREATE POLICY "insert_own_state"
ON user_state FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_state" ON user_state;
CREATE POLICY "update_own_state"
ON user_state FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_state" ON user_state;
CREATE POLICY "delete_own_state"
ON user_state FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- Workout sessions table: history of completed workouts
CREATE TABLE IF NOT EXISTS workout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_type text NOT NULL,
  duration_seconds int NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS workout_sessions_user_idx ON workout_sessions (user_id, completed_at DESC);

DROP POLICY IF EXISTS "select_own_workouts" ON workout_sessions;
CREATE POLICY "select_own_workouts"
ON workout_sessions FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_workouts" ON workout_sessions;
CREATE POLICY "insert_own_workouts"
ON workout_sessions FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_workouts" ON workout_sessions;
CREATE POLICY "delete_own_workouts"
ON workout_sessions FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- Leaderboard: rebuild to key on user_id instead of device_id
-- Drop the old table and recreate (no user data to preserve — old rows were
-- anonymous device-keyed entries that are no longer meaningful with auth).
DROP TABLE IF EXISTS leaderboard;

CREATE TABLE leaderboard (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL DEFAULT 'Hunter',
  avatar text NOT NULL DEFAULT '🐺',
  xp bigint NOT NULL DEFAULT 0,
  level int NOT NULL DEFAULT 1,
  total_points bigint NOT NULL DEFAULT 0,
  streak int NOT NULL DEFAULT 0,
  discipline_score int NOT NULL DEFAULT 0,
  tasks_completed int NOT NULL DEFAULT 0,
  rank_id text NOT NULL DEFAULT 'E',
  rank_name text NOT NULL DEFAULT 'E-Rank',
  rank_emoji text NOT NULL DEFAULT '🟤',
  aura_color text NOT NULL DEFAULT '#ff7a18',
  background_type text NOT NULL DEFAULT 'default',
  background_value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS leaderboard_xp_desc_idx ON leaderboard (xp DESC);
CREATE INDEX IF NOT EXISTS leaderboard_streak_desc_idx ON leaderboard (streak DESC);
CREATE INDEX IF NOT EXISTS leaderboard_total_points_desc_idx ON leaderboard (total_points DESC);
CREATE INDEX IF NOT EXISTS leaderboard_discipline_desc_idx ON leaderboard (discipline_score DESC);

-- All authenticated users can read the leaderboard (public competition board)
DROP POLICY IF EXISTS "auth_read_leaderboard" ON leaderboard;
CREATE POLICY "auth_read_leaderboard"
ON leaderboard FOR SELECT
TO authenticated USING (true);

-- Only the owner can insert/update/delete their own row
DROP POLICY IF EXISTS "auth_insert_leaderboard" ON leaderboard;
CREATE POLICY "auth_insert_leaderboard"
ON leaderboard FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "auth_update_leaderboard" ON leaderboard;
CREATE POLICY "auth_update_leaderboard"
ON leaderboard FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "auth_delete_leaderboard" ON leaderboard;
CREATE POLICY "auth_delete_leaderboard"
ON leaderboard FOR DELETE
TO authenticated USING (auth.uid() = user_id);
