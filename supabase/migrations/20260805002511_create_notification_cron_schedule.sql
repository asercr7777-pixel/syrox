/*
# Create cron schedule for push notifications

1. Changes
- Creates a cron job that calls the `send-scheduled-notifications` edge function every minute.
- Uses pg_cron extension (already available on Supabase).
- The cron job uses the service role key from vault (pg_cron.grafana_token) or a net.http call.

2. How it works
- Every minute, pg_cron sends an HTTP POST to the edge function endpoint.
- The edge function checks the database for reminders and notification settings that match the current time.
- It sends push notifications via the OneSignal REST API for any matches found.

3. Notes
- Requires pg_cron and pg_net extensions (both pre-installed on Supabase).
- The edge function uses the service role key internally (from Deno.env), so no auth headers needed in the cron call.
*/

-- Ensure extensions exist
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT USAGE ON SCHEMA net TO postgres;

-- Drop existing job if re-running
SELECT cron.unschedule('send-scheduled-notifications-job') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-scheduled-notifications-job'
);

-- Schedule the job to run every minute
SELECT cron.schedule(
  'send-scheduled-notifications-job',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://qpjnxqrkyrfhxvadvhmv.supabase.co/functions/v1/send-scheduled-notifications',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
