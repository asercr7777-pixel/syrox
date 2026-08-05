import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ONESIGNAL_APP_ID = "da4d587d-2e86-4056-b7fb-f65d37c2d819";
const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY") ?? "";

interface ReminderRow {
  id: string;
  user_id: string;
  reminder_title: string;
  reminder_description: string | null;
  reminder_time: string;
  reminder_date: string | null;
  repeat_type: "once" | "daily" | "weekly" | "custom";
  repeat_days: number[] | null;
  is_enabled: boolean;
  last_fired_at: string | null;
  timezone: string;
}

interface NotificationSettingsRow {
  user_id: string;
  notification_enabled: boolean;
  workout_enabled: boolean;
  workout_time: string;
  prayer_enabled: boolean;
  prayer_time: string;
  water_enabled: boolean;
  water_time: string;
  reading_enabled: boolean;
  reading_time: string;
  sleep_enabled: boolean;
  sleep_time: string;
  quest_enabled: boolean;
  quest_time: string;
  timezone: string;
}

const DISCIPLINE_MESSAGES: Record<string, { title: string; message: string }> = {
  workout: { title: "🔥 Workout Quest Started", message: "Complete your training and earn XP, Hunter." },
  prayer: { title: "🕌 Prayer Reminder", message: "Time to pray. Strengthen your spirit." },
  water: { title: "💧 Water Reminder", message: "Stay hydrated, Hunter. Drink a glass of water." },
  reading: { title: "📚 Reading Reminder", message: "Time to read and grow your knowledge." },
  sleep: { title: "😴 Sleep Reminder", message: "Protect your streak. Time to rest, Hunter." },
  quest: { title: "⚔️ Daily Quests Ready", message: "Your daily quests await. Complete them to earn XP and coins." },
};

/** Convert a "HH:MM" or "HH:MM:SS" time from a given IANA timezone to UTC "HH:MM" for today. */
function localTimeToUtcHHMM(localTime: string, timezone: string, baseDate: Date): string | null {
  try {
    // Parse the local time string
    const parts = localTime.split(":");
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes)) return null;

    // Build a date string for today in the user's timezone
    // Use Intl to get the current date components in the target timezone
    const tzFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone || "UTC",
      year: "numeric", month: "2-digit", day: "2-digit",
    });
    const parts2 = tzFormatter.formatToParts(baseDate);
    let year = "", month = "", day = "";
    for (const p of parts2) {
      if (p.type === "year") year = p.value;
      if (p.type === "month") month = p.value;
      if (p.type === "day") day = p.value;
    }

    // Create a UTC Date that represents the local wall-clock time
    // We need to find the UTC offset for this timezone at this date
    // Approach: create an ISO string in the target timezone, then convert
    const localISO = `${year}-${month}-${day}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;

    // Use the timezone offset to convert
    // Create a date as if it were UTC, then apply the timezone offset
    const asUtc = new Date(localISO + "Z"); // This treats it as UTC, which is wrong, but we'll adjust

    // Get the offset for this timezone at this time
    const offsetMs = getTzOffsetMs(baseDate, timezone);
    const correctUtc = new Date(asUtc.getTime() - offsetMs);

    const utcHH = String(correctUtc.getUTCHours()).padStart(2, "0");
    const utcMM = String(correctUtc.getUTCMinutes()).padStart(2, "0");
    return `${utcHH}:${utcMM}`;
  } catch {
    return null;
  }
}

/** Get the timezone offset in milliseconds for a given date and timezone. */
function getTzOffsetMs(date: Date, timezone: string): number {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone || "UTC",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    });
    const parts = dtf.formatToParts(date);
    const map: Record<string, string> = {};
    for (const p of parts) map[p.type] = p.value;

    const asUtc = Date.UTC(
      parseInt(map.year), parseInt(map.month) - 1, parseInt(map.day),
      parseInt(map.hour) === 24 ? 0 : parseInt(map.hour),
      parseInt(map.minute), parseInt(map.second),
    );
    return asUtc - date.getTime();
  } catch {
    return 0;
  }
}

/** Get today's date string in the user's timezone (YYYY-MM-DD). */
function getTodayInTz(timezone: string, baseDate: Date): string {
  try {
    const dtf = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone || "UTC",
      year: "numeric", month: "2-digit", day: "2-digit",
    });
    return dtf.format(baseDate); // en-CA gives YYYY-MM-DD
  } catch {
    return baseDate.toISOString().slice(0, 10);
  }
}

/** Get current day-of-week (0=Sun..6=Sat) in the user's timezone. */
function getDowInTz(timezone: string, baseDate: Date): number {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone || "UTC",
      weekday: "short",
    });
    const weekday = dtf.format(baseDate);
    const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return map[weekday] ?? baseDate.getUTCDay();
  } catch {
    return baseDate.getUTCDay();
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const log: string[] = [];
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = new Date();
    const utcHHMM = `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`;
    log.push(`[run] UTC time: ${utcHHMM}`);

    const notificationsSent: string[] = [];

    // 1. Process custom reminders — fetch ALL enabled reminders and check each in its own timezone
    const { data: reminders, error: remindersError } = await supabase
      .from("reminders")
      .select("*")
      .eq("is_enabled", true);

    if (remindersError) throw new Error(`Reminders query: ${remindersError.message}`);
    log.push(`[reminders] fetched ${reminders?.length ?? 0} enabled reminders`);

    for (const reminder of (reminders ?? []) as ReminderRow[]) {
      const tz = reminder.timezone || "UTC";

      // Convert reminder_time (stored as HH:MM or HH:MM:SS) to HH:MM
      const storedTime = reminder.reminder_time.slice(0, 5);

      // Convert the user's local reminder time to UTC HH:MM
      const utcTime = localTimeToUtcHHMM(storedTime, tz, now);
      if (!utcTime) {
        log.push(`[reminder:${reminder.id}] failed tz conversion for ${storedTime} ${tz}`);
        continue;
      }

      // Check if this reminder's UTC time matches the current UTC time
      if (utcTime !== utcHHMM) continue;

      // Check if already fired in the last 5 minutes
      if (reminder.last_fired_at) {
        const lastFired = new Date(reminder.last_fired_at);
        const minutesSince = (now.getTime() - lastFired.getTime()) / 60000;
        if (minutesSince < 5) {
          log.push(`[reminder:${reminder.id}] skipped — fired ${minutesSince.toFixed(1)}min ago`);
          continue;
        }
      }

      // Check schedule based on user's local date/dow
      const localToday = getTodayInTz(tz, now);
      const localDow = getDowInTz(tz, now);

      if (reminder.repeat_type === "once") {
        if (reminder.reminder_date !== localToday) continue;
      } else if (reminder.repeat_type === "weekly" || reminder.repeat_type === "custom") {
        if (!reminder.repeat_days || !reminder.repeat_days.includes(localDow)) continue;
      }
      // daily: always fires

      log.push(`[reminder:${reminder.id}] sending notification to ${reminder.user_id}`);
      const sent = await sendOneSignalNotification(reminder.user_id, {
        title: `⚔️ Reminder: ${reminder.reminder_title}`,
        message: reminder.reminder_description || `Your reminder is ready: ${reminder.reminder_title}`,
      });

      if (sent) {
        await supabase.from("reminders").update({ last_fired_at: now.toISOString() }).eq("id", reminder.id);
        notificationsSent.push(`reminder:${reminder.id}`);
        log.push(`[reminder:${reminder.id}] sent OK`);
      } else {
        log.push(`[reminder:${reminder.id}] send FAILED`);
      }
    }

    // 2. Process discipline reminders from notification_settings
    const { data: settingsRows, error: settingsError } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("notification_enabled", true);

    if (settingsError) throw new Error(`Settings query: ${settingsError.message}`);
    log.push(`[settings] fetched ${settingsRows?.length ?? 0} enabled settings rows`);

    const disciplineKeys: { enabled: keyof NotificationSettingsRow; time: keyof NotificationSettingsRow; key: string }[] = [
      { enabled: "workout_enabled", time: "workout_time", key: "workout" },
      { enabled: "prayer_enabled", time: "prayer_time", key: "prayer" },
      { enabled: "water_enabled", time: "water_time", key: "water" },
      { enabled: "reading_enabled", time: "reading_time", key: "reading" },
      { enabled: "sleep_enabled", time: "sleep_time", key: "sleep" },
      { enabled: "quest_enabled", time: "quest_time", key: "quest" },
    ];

    for (const settings of (settingsRows ?? []) as NotificationSettingsRow[]) {
      const tz = settings.timezone || "UTC";

      for (const { enabled, time, key } of disciplineKeys) {
        if (!settings[enabled]) continue;

        const storedTime = (settings[time] as string).slice(0, 5);
        const utcTime = localTimeToUtcHHMM(storedTime, tz, now);
        if (!utcTime) continue;

        if (utcTime !== utcHHMM) continue;

        log.push(`[discipline:${settings.user_id}:${key}] sending notification`);
        const msg = DISCIPLINE_MESSAGES[key];
        const sent = await sendOneSignalNotification(settings.user_id, msg);
        if (sent) {
          notificationsSent.push(`discipline:${settings.user_id}:${key}`);
          log.push(`[discipline:${settings.user_id}:${key}] sent OK`);
        } else {
          log.push(`[discipline:${settings.user_id}:${key}] send FAILED`);
        }
      }
    }

    log.push(`[done] sent ${notificationsSent.length} notifications`);

    return new Response(
      JSON.stringify({ ok: true, sent: notificationsSent, count: notificationsSent.length, utcTime, logs: log }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    log.push(`[ERROR] ${err instanceof Error ? err.message : "Unknown error"}`);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error", logs: log }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

async function sendOneSignalNotification(
  userId: string,
  content: { title: string; message: string },
): Promise<boolean> {
  if (!ONESIGNAL_REST_API_KEY) {
    console.warn("[OneSignal] ONESIGNAL_REST_API_KEY not configured");
    return false;
  }

  try {
    const res = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        headings: { en: content.title },
        contents: { en: content.message },
        include_external_user_ids: [userId],
        channel_for_external_user_ids: "push",
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[OneSignal] API error ${res.status}: ${body}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[OneSignal] fetch error:", err);
    return false;
  }
}
