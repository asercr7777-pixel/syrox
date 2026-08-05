import { supabase, isSupabaseConfigured } from './supabase';

export type RepeatType = 'once' | 'daily' | 'weekly' | 'custom';

export interface Reminder {
  id: string;
  user_id: string;
  reminder_title: string;
  reminder_description: string | null;
  reminder_time: string;
  reminder_date: string | null;
  repeat_type: RepeatType;
  repeat_days: number[] | null;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReminderInput {
  reminder_title: string;
  reminder_description?: string | null;
  reminder_time: string;
  reminder_date?: string | null;
  repeat_type: RepeatType;
  repeat_days?: number[] | null;
  is_enabled?: boolean;
}

export async function fetchReminders(userId: string): Promise<Reminder[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data as Reminder[];
}

export async function createReminder(userId: string, input: ReminderInput): Promise<{ error: string | null; data: Reminder | null }> {
  if (!isSupabaseConfigured()) return { error: null, data: null };
  const { data, error } = await supabase
    .from('reminders')
    .insert({
      user_id: userId,
      reminder_title: input.reminder_title,
      reminder_description: input.reminder_description ?? null,
      reminder_time: input.reminder_time,
      reminder_date: input.reminder_date ?? null,
      repeat_type: input.repeat_type,
      repeat_days: input.repeat_days ?? null,
      is_enabled: input.is_enabled ?? true,
    })
    .select('*')
    .single();
  if (error) return { error: error.message, data: null };
  return { error: null, data: data as Reminder };
}

export async function updateReminder(id: string, patch: Partial<ReminderInput>): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: null };
  const { error } = await supabase.from('reminders').update(patch).eq('id', id);
  return { error: error ? error.message : null };
}

export async function deleteReminder(id: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: null };
  const { error } = await supabase.from('reminders').delete().eq('id', id);
  return { error: error ? error.message : null };
}

export async function toggleReminder(id: string, enabled: boolean): Promise<{ error: string | null }> {
  return updateReminder(id, { is_enabled: enabled });
}
