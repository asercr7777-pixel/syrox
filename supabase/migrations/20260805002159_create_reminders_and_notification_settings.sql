/*
# Create reminders and notification_settings tables

1. New Tables
- `reminders`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users ON DELETE CASCADE)
  - `reminder_title` (text, not null)
  - `reminder_description` (text, nullable)
  - `reminder_time` (time, not null) — HH:MM time-of-day the reminder fires
  - `reminder_date` (date, nullable) — for one-time reminders; null for repeating
  - `repeat_type` (text, not null, default 'once') — 'once' | 'daily' | 'weekly' | 'custom'
  - `repeat_days` (integer[], nullable) — for weekly/custom: day-of-week numbers 0-6 (0=Sunday)
  - `is_enabled` (boolean, not null, default true)
  - `last_fired_at` (timestamptz, nullable) — last time this reminder sent a push
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())
- `notification_settings`
  - `user_id` (uuid, primary key, references auth.users ON DELETE CASCADE)
  - `notification_enabled` (boolean, default false) — master push toggle
  - `workout_enabled` (boolean, default false)
  - `workout_time` (time, default '07:00')
  - `prayer_enabled` (boolean, default false)
  - `prayer_time` (time, default '05:30')
  - `water_enabled` (boolean, default false)
  - `water_time` (time, default '10:00')
  - `reading_enabled` (boolean, default false)
  - `reading_time` (time, default '20:00')
  - `sleep_enabled` (boolean, default false)
  - `sleep_time` (time, default '22:30')
  - `quest_enabled` (boolean, default false)
  - `quest_time` (time, default '08:00')
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Indexes
- `idx_reminders_user` on reminders(user_id)
- `idx_reminders_enabled_time` on reminders(is_enabled, reminder_time) for the cron query

3. Security
- Enable RLS on both tables.
- Owner-scoped CRUD: each authenticated user can only access rows they own.
- `reminders.user_id` defaults to auth.uid() so inserts that omit user_id succeed.
- 4 policies per table (SELECT, INSERT, UPDATE, DELETE), all TO authenticated with auth.uid() ownership checks.

4. Notes
- `repeat_days` is an integer array for weekly/custom schedules. NULL means every day for 'daily', and for 'custom' it specifies which days of week (0=Sun..6=Sat).
- `last_fired_at` prevents duplicate sends within the same minute window.
- `notification_settings` is one-row-per-user (user_id is the primary key).
*/

-- reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_title text NOT NULL,
  reminder_description text,
  reminder_time time NOT NULL,
  reminder_date date,
  repeat_type text NOT NULL DEFAULT 'once' CHECK (repeat_type IN ('once','daily','weekly','custom')),
  repeat_days integer[],
  is_enabled boolean NOT NULL DEFAULT true,
  last_fired_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_enabled_time ON reminders(is_enabled, reminder_time);

DROP POLICY IF EXISTS "select_own_reminders" ON reminders;
CREATE POLICY "select_own_reminders" ON reminders FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_reminders" ON reminders;
CREATE POLICY "insert_own_reminders" ON reminders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_reminders" ON reminders;
CREATE POLICY "update_own_reminders" ON reminders FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_reminders" ON reminders;
CREATE POLICY "delete_own_reminders" ON reminders FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_enabled boolean NOT NULL DEFAULT false,
  workout_enabled boolean NOT NULL DEFAULT false,
  workout_time time NOT NULL DEFAULT '07:00',
  prayer_enabled boolean NOT NULL DEFAULT false,
  prayer_time time NOT NULL DEFAULT '05:30',
  water_enabled boolean NOT NULL DEFAULT false,
  water_time time NOT NULL DEFAULT '10:00',
  reading_enabled boolean NOT NULL DEFAULT false,
  reading_time time NOT NULL DEFAULT '20:00',
  sleep_enabled boolean NOT NULL DEFAULT false,
  sleep_time time NOT NULL DEFAULT '22:30',
  quest_enabled boolean NOT NULL DEFAULT false,
  quest_time time NOT NULL DEFAULT '08:00',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notification_settings" ON notification_settings;
CREATE POLICY "select_own_notification_settings" ON notification_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notification_settings" ON notification_settings;
CREATE POLICY "insert_own_notification_settings" ON notification_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notification_settings" ON notification_settings;
CREATE POLICY "update_own_notification_settings" ON notification_settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notification_settings" ON notification_settings;
CREATE POLICY "delete_own_notification_settings" ON notification_settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION bump_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reminders_bump_updated_at ON reminders;
CREATE TRIGGER reminders_bump_updated_at BEFORE UPDATE ON reminders
  FOR EACH ROW EXECUTE FUNCTION bump_updated_at();

DROP TRIGGER IF EXISTS notification_settings_bump_updated_at ON notification_settings;
CREATE TRIGGER notification_settings_bump_updated_at BEFORE UPDATE ON notification_settings
  FOR EACH ROW EXECUTE FUNCTION bump_updated_at();
