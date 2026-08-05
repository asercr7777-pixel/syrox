-- Add timezone column to notification_settings for proper local-to-UTC conversion
ALTER TABLE notification_settings
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'UTC';

-- Also add timezone to reminders for the same reason
ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'UTC';
