import { supabase, isSupabaseConfigured } from './supabase';

export interface NotificationSettings {
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

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  notification_enabled: false,
  workout_enabled: false,
  workout_time: '07:00',
  prayer_enabled: false,
  prayer_time: '05:30',
  water_enabled: false,
  water_time: '10:00',
  reading_enabled: false,
  reading_time: '20:00',
  sleep_enabled: false,
  sleep_time: '22:30',
  quest_enabled: false,
  quest_time: '08:00',
};

export async function fetchNotificationSettings(userId: string): Promise<NotificationSettings> {
  if (!isSupabaseConfigured()) return { ...DEFAULT_NOTIFICATION_SETTINGS };
  const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return { ...DEFAULT_NOTIFICATION_SETTINGS };
  const { user_id, created_at, updated_at, ...settings } = data as any;
  return { ...DEFAULT_NOTIFICATION_SETTINGS, ...settings };
}

export async function upsertNotificationSettings(
  userId: string,
  settings: Partial<NotificationSettings>,
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: null };
  const { error } = await supabase
    .from('notification_settings')
    .upsert({ user_id: userId, ...settings, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  return { error: error ? error.message : null };
}
