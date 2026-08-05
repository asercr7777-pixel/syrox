import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../lib/auth';
import { toast } from '../components/ui/Toast';
import { playSound } from '../lib/sound';
import {
  Bell, BellRing, BellOff, Loader2, Dumbbell, Droplet, BookOpen, Moon,
  Swords, Hand, ChevronLeft, Save,
} from 'lucide-react';
import {
  fetchNotificationSettings, upsertNotificationSettings,
  type NotificationSettings,
} from '../lib/notificationSettings';
import {
  subscribeToPush, unsubscribeFromPush, isPushSubscribed,
  setExternalUserId, syncNotificationTags,
} from '../lib/onesignal';

interface DisciplineReminder {
  key: 'workout' | 'prayer' | 'water' | 'reading' | 'sleep' | 'quest';
  label: string;
  emoji: string;
  icon: typeof Dumbbell;
  enabledKey: keyof NotificationSettings;
  timeKey: keyof NotificationSettings;
  tagKey: string;
}

const DISCIPLINE_REMINDERS: DisciplineReminder[] = [
  { key: 'workout', label: 'Workout', emoji: '💪', icon: Dumbbell, enabledKey: 'workout_enabled', timeKey: 'workout_time', tagKey: 'workout' },
  { key: 'prayer', label: 'Prayer', emoji: '🕌', icon: Hand, enabledKey: 'prayer_enabled', timeKey: 'prayer_time', tagKey: 'prayer' },
  { key: 'water', label: 'Water', emoji: '💧', icon: Droplet, enabledKey: 'water_enabled', timeKey: 'water_time', tagKey: 'water' },
  { key: 'reading', label: 'Reading', emoji: '📚', icon: BookOpen, enabledKey: 'reading_enabled', timeKey: 'reading_time', tagKey: 'reading' },
  { key: 'sleep', label: 'Sleep', emoji: '😴', icon: Moon, enabledKey: 'sleep_enabled', timeKey: 'sleep_time', tagKey: 'sleep' },
  { key: 'quest', label: 'Daily Quests', emoji: '⚔️', icon: Swords, enabledKey: 'quest_enabled', timeKey: 'quest_time', tagKey: 'quest' },
];

interface NotificationsProps {
  onNavigate: (v: any) => void;
}

export function Notifications({ onNavigate }: NotificationsProps) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      const s = await fetchNotificationSettings(user.id);
      if (!mounted) return;
      setSettings(s);
      const subscribed = await isPushSubscribed();
      if (mounted) setPushEnabled(subscribed);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [user]);

  const syncTags = useCallback((s: NotificationSettings) => {
    const tags: Record<string, string> = {
      notifications_enabled: s.notification_enabled ? 'true' : 'false',
      workout: s.workout_enabled ? 'true' : 'false',
      prayer: s.prayer_enabled ? 'true' : 'false',
      water: s.water_enabled ? 'true' : 'false',
      reading: s.reading_enabled ? 'true' : 'false',
      sleep: s.sleep_enabled ? 'true' : 'false',
      quest: s.quest_enabled ? 'true' : 'false',
    };
    void syncNotificationTags(tags);
  }, []);

  const handleTogglePush = async () => {
    if (pushLoading || !user) return;
    setPushLoading(true);
    try {
      if (pushEnabled) {
        await unsubscribeFromPush();
        setPushEnabled(false);
        toast({ title: 'Notifications off', message: 'You will not receive push notifications.', type: 'info' });
      } else {
        const success = await subscribeToPush();
        if (success) {
          await setExternalUserId(user.id);
          setPushEnabled(true);
          if (settings) {
            const updated = { ...settings, notification_enabled: true };
            setSettings(updated);
            await upsertNotificationSettings(user.id, { notification_enabled: true });
            syncTags(updated);
          }
          toast({ title: 'Notifications on', message: 'You will receive push notifications even when the app is closed.', type: 'success' });
        } else {
          toast({ title: 'Permission denied', message: 'Notification permission was denied. You can change this in your browser settings.', type: 'error' });
        }
      }
    } catch {
      toast({ title: 'Notification error', message: 'Could not change notification settings.', type: 'error' });
    } finally {
      setPushLoading(false);
    }
  };

  const handleToggleReminder = async (r: DisciplineReminder) => {
    if (!user || !settings) return;
    const newValue = !settings[r.enabledKey];
    const updated = { ...settings, [r.enabledKey]: newValue };
    setSettings(updated);
    setSaving(true);
    playSound('click');
    try {
      await upsertNotificationSettings(user.id, { [r.enabledKey]: newValue } as any);
      syncTags(updated);
    } catch {
      toast({ title: 'Save failed', message: 'Could not update settings.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleTimeChange = async (r: DisciplineReminder, time: string) => {
    if (!user || !settings) return;
    const updated = { ...settings, [r.timeKey]: time };
    setSettings(updated);
  };

  const handleSaveTimes = async () => {
    if (!user || !settings) return;
    setSaving(true);
    playSound('click');
    try {
      await upsertNotificationSettings(user.id, settings);
      syncTags(settings);
      toast({ title: 'Settings saved', message: 'Your reminder times have been updated.', type: 'success' });
    } catch {
      toast({ title: 'Save failed', message: 'Could not save settings.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-ember-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <button onClick={() => onNavigate('settings')} className="flex items-center gap-1 text-sm text-ink-300 hover:text-ink-100 mb-2">
          <ChevronLeft size={16} /> Settings
        </button>
        <h1 className="section-title flex items-center gap-2">
          <Bell size={24} /> Notifications
        </h1>
        <p className="text-sm text-ink-300">Manage push notifications and discipline reminders</p>
      </div>

      {/* Push notification master toggle */}
      <div className="card p-5">
        <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <BellRing size={18} /> Push Notifications
        </h2>
        <div className="p-4 rounded-xl bg-ink-950/40 border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-1">
                {pushEnabled ? <BellRing size={16} className="text-ember-400" /> : <BellOff size={16} className="text-ink-400" />}
                <span className="font-medium text-sm">Push Notifications</span>
              </div>
              <p className="text-xs text-ink-400">
                {pushEnabled
                  ? 'Active. You will receive notifications even when the app is closed, your browser is closed, or your screen is locked.'
                  : 'Get notified about events even when the app is closed, your browser is closed, or your screen is locked.'}
              </p>
            </div>
            <button
              onClick={handleTogglePush}
              disabled={pushLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 ${
                pushEnabled
                  ? 'bg-ink-800 text-ink-200 hover:bg-ink-700'
                  : 'bg-ember-500/20 text-ember-400 hover:bg-ember-500/30'
              }`}
            >
              {pushLoading && <Loader2 size={14} className="animate-spin" />}
              {pushEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>
      </div>

      {/* Discipline reminders */}
      <div className="card p-5">
        <h2 className="font-display text-lg font-bold mb-1 flex items-center gap-2">
          <Swords size={18} /> Discipline Reminders
        </h2>
        <p className="text-xs text-ink-400 mb-4">
          Set times for built-in reminders. These fire automatically based on your settings.
        </p>
        <div className="space-y-3">
          {DISCIPLINE_REMINDERS.map((r) => {
            const Icon = r.icon;
            const enabled = settings[r.enabledKey] as boolean;
            return (
              <div key={r.key} className="flex items-center gap-3 p-3 rounded-xl bg-ink-950/40 border border-white/5">
                <div className="w-10 h-10 rounded-lg bg-ink-900/60 flex items-center justify-center text-lg">
                  {r.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon size={14} className="text-ink-400" />
                    <span className="font-medium text-sm">{r.label}</span>
                  </div>
                </div>
                <input
                  type="time"
                  value={settings[r.timeKey] as string}
                  onChange={(e) => handleTimeChange(r, e.target.value)}
                  disabled={!enabled}
                  className="px-2 py-1.5 rounded-lg bg-ink-900/80 border border-white/10 text-sm text-ink-100 disabled:opacity-40 [color-scheme:dark]"
                />
                <button
                  onClick={() => handleToggleReminder(r)}
                  className={`w-11 h-6 rounded-full relative transition flex-shrink-0 ${
                    enabled ? 'bg-ember-500' : 'bg-ink-700'
                  }`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition ${enabled ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            );
          })}
        </div>
        <button
          onClick={handleSaveTimes}
          disabled={saving}
          className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Reminder Times
        </button>
      </div>

      {/* Info card */}
      <div className="card p-5">
        <h3 className="font-display text-sm font-bold mb-2 text-ink-200">How it works</h3>
        <ul className="space-y-1.5 text-xs text-ink-400">
          <li>• Enable push notifications to receive alerts on your device.</li>
          <li>• Discipline reminders fire at the times you set above.</li>
          <li>• Custom reminders can be created from the Reminders page.</li>
          <li>• Notifications work even when the app is closed or your screen is locked.</li>
          <li>• Prayer times can be set manually now — automatic location-based times coming soon.</li>
        </ul>
      </div>
    </div>
  );
}
