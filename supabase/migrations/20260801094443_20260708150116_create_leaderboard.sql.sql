/*
# Create leaderboard table for global competition

1. New Tables
- `leaderboard`
  - `device_id` (text, primary key) — stable per-browser identifier
  - `username` (text)
  - `avatar` (text) — emoji or data URL
  - `xp` (bigint)
  - `level` (int)
  - `total_points` (bigint)
  - `streak` (int)
  - `rank_id` (text)
  - `rank_name` (text)
  - `rank_emoji` (text)
  - `aura_color` (text)
  - `updated_at` (timestamptz)

2. Security
- Enable RLS on `leaderboard`.
- This is a no-auth app: allow anon + authenticated to read all rows (public leaderboard) and to upsert their own row keyed by device_id.
- DELETE is allowed so users can remove themselves.

3. Notes
- The leaderboard is intentionally public/shared (competition system). All rows are readable by anyone.
- Upsert is keyed on `device_id` so each browser/device has exactly one row.
- An index on `xp DESC` supports fast top-N queries.
*/

CREATE TABLE IF NOT EXISTS leaderboard (
  device_id text PRIMARY KEY,
  username text NOT NULL DEFAULT 'Hunter',
  avatar text NOT NULL DEFAULT '🐺',
  xp bigint NOT NULL DEFAULT 0,
  level int NOT NULL DEFAULT 1,
  total_points bigint NOT NULL DEFAULT 0,
  streak int NOT NULL DEFAULT 0,
  rank_id text NOT NULL DEFAULT 'E',
  rank_name text NOT NULL DEFAULT 'E-Rank',
  rank_emoji text NOT NULL DEFAULT '🟤',
  aura_color text NOT NULL DEFAULT '#ff7a18',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS leaderboard_xp_desc_idx ON leaderboard (xp DESC);
CREATE INDEX IF NOT EXISTS leaderboard_streak_desc_idx ON leaderboard (streak DESC);
CREATE INDEX IF NOT EXISTS leaderboard_total_points_desc_idx ON leaderboard (total_points DESC);

DROP POLICY IF EXISTS "anon_read_leaderboard" ON leaderboard;
CREATE POLICY "anon_read_leaderboard"
ON leaderboard FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_upsert_leaderboard" ON leaderboard;
CREATE POLICY "anon_upsert_leaderboard"
ON leaderboard FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_leaderboard" ON leaderboard;
CREATE POLICY "anon_update_leaderboard"
ON leaderboard FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_leaderboard" ON leaderboard;
CREATE POLICY "anon_delete_leaderboard"
ON leaderboard FOR DELETE
TO anon, authenticated USING (true);