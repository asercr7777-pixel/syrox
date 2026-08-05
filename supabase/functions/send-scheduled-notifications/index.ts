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
}

const DISCIPLINE_MESSAGES: Record<string, { title: string; message: string }> = {
  workout: { title: "🔥 Workout Quest Started", message: "Complete your training and earn XP, Hunter." },
  prayer: { title: "🕌 Prayer Reminder", message: "Time to pray. Strengthen your spirit." },
  water: { title: "💧 Water Reminder", message: "Stay hydrated, Hunter. Drink a glass of water." },
  reading: { title: "📚 Reading Reminder", message: "Time to read and grow your knowledge." },
  sleep: { title: "😴 Sleep Reminder", message: "Protect your streak. Time to rest, Hunter." },
  quest: { title: "⚔️ Daily Quests Ready", message: "Your daily quests await. Complete them to earn XP and coins." },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get current time in UTC
    const now = new Date();
    const currentTime = `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`;
    const todayDate = now.toISOString().slice(0, 10);
    const todayDow = now.getUTCDay();

    const notificationsSent: string[] = [];

    // 1. Process custom reminders
    const { data: reminders, error: remindersError } = await supabase
      .from("reminders")
      .select("*")
      .eq("is_enabled", true)
      .eq("reminder_time", currentTime);

    if (remindersError) throw new Error(`Reminders query: ${remindersError.message}`);

    for (const reminder of (reminders ?? []) as ReminderRow[]) {
      // Check if already fired in the last 5 minutes
      if (reminder.last_fired_at) {
        const lastFired = new Date(reminder.last_fired_at);
        const minutesSince = (now.getTime() - lastFired.getTime()) / 60000;
        if (minutesSince < 5) continue;
      }

      // Check schedule
      if (reminder.repeat_type === "once") {
        if (reminder.reminder_date !== todayDate) continue;
      } else if (reminder.repeat_type === "weekly" || reminder.repeat_type === "custom") {
        if (!reminder.repeat_days || !reminder.repeat_days.includes(todayDow)) continue;
      }
      // daily: always fires

      const sent = await sendOneSignalNotification(reminder.user_id, {
        title: `⚔️ Reminder: ${reminder.reminder_title}`,
        message: reminder.reminder_description || `Your reminder is ready: ${reminder.reminder_title}`,
      });

      if (sent) {
        await supabase.from("reminders").update({ last_fired_at: now.toISOString() }).eq("id", reminder.id);
        notificationsSent.push(`reminder:${reminder.id}`);
      }
    }

    // 2. Process discipline reminders from notification_settings
    const { data: settingsRows, error: settingsError } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("notification_enabled", true);

    if (settingsError) throw new Error(`Settings query: ${settingsError.message}`);

    const disciplineKeys: { enabled: keyof NotificationSettingsRow; time: keyof NotificationSettingsRow; key: string }[] = [
      { enabled: "workout_enabled", time: "workout_time", key: "workout" },
      { enabled: "prayer_enabled", time: "prayer_time", key: "prayer" },
      { enabled: "water_enabled", time: "water_time", key: "water" },
      { enabled: "reading_enabled", time: "reading_time", key: "reading" },
      { enabled: "sleep_enabled", time: "sleep_time", key: "sleep" },
      { enabled: "quest_enabled", time: "quest_time", key: "quest" },
    ];

    for (const settings of (settingsRows ?? []) as NotificationSettingsRow[]) {
      for (const { enabled, time, key } of disciplineKeys) {
        if (!settings[enabled]) continue;
        if (settings[time] !== currentTime) continue;

        const msg = DISCIPLINE_MESSAGES[key];
        const sent = await sendOneSignalNotification(settings.user_id, msg);
        if (sent) notificationsSent.push(`discipline:${settings.user_id}:${key}`);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, sent: notificationsSent, count: notificationsSent.length, time: currentTime }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
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
