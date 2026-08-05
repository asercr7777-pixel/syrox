import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../lib/auth';
import { toast } from '../components/ui/Toast';
import { playSound } from '../lib/sound';
import {
  AlarmClock, Plus, Trash2, Pencil, X, Loader2, ChevronLeft, Clock, Calendar, Repeat, Save,
} from 'lucide-react';
import {
  fetchReminders, createReminder, updateReminder, deleteReminder, toggleReminder,
  type Reminder, type ReminderInput, type RepeatType,
} from '../lib/reminders';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const REPEAT_OPTIONS: { value: RepeatType; label: string }[] = [
  { value: 'once', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'custom', label: 'Custom days' },
];

interface RemindersProps {
  onNavigate: (v: any) => void;
}

export function Reminders({ onNavigate }: RemindersProps) {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<ReminderInput>({
    reminder_title: '',
    reminder_description: '',
    reminder_time: '08:00',
    reminder_date: null,
    repeat_type: 'once',
    repeat_days: [],
    is_enabled: true,
  });

  const load = useCallback(async () => {
    if (!user) return;
    const data = await fetchReminders(user.id);
    setReminders(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const resetForm = () => {
    setForm({
      reminder_title: '',
      reminder_description: '',
      reminder_time: '08:00',
      reminder_date: null,
      repeat_type: 'once',
      repeat_days: [],
      is_enabled: true,
    });
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (r: Reminder) => {
    setForm({
      reminder_title: r.reminder_title,
      reminder_description: r.reminder_description,
      reminder_time: r.reminder_time,
      reminder_date: r.reminder_date,
      repeat_type: r.repeat_type,
      repeat_days: r.repeat_days ?? [],
      is_enabled: r.is_enabled,
    });
    setEditingId(r.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!user) return;
    if (!form.reminder_title.trim()) {
      toast({ title: 'Title required', message: 'Please enter a reminder title.', type: 'error' });
      return;
    }
    if (form.repeat_type === 'once' && !form.reminder_date) {
      toast({ title: 'Date required', message: 'Please select a date for one-time reminders.', type: 'error' });
      return;
    }
    if ((form.repeat_type === 'weekly' || form.repeat_type === 'custom') && (!form.repeat_days || form.repeat_days.length === 0)) {
      toast({ title: 'Days required', message: 'Please select at least one day.', type: 'error' });
      return;
    }

    setSaving(true);
    playSound('click');
    try {
      if (editingId) {
        const { error } = await updateReminder(editingId, form);
        if (error) throw new Error(error);
        toast({ title: 'Reminder updated', type: 'success' });
      } else {
        const { error } = await createReminder(user.id, form);
        if (error) throw new Error(error);
        toast({ title: 'Reminder created', message: 'Your reminder has been saved.', type: 'success' });
      }
      closeForm();
      await load();
    } catch (err) {
      toast({ title: 'Save failed', message: err instanceof Error ? err.message : 'Unknown error', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    playSound('click');
    const { error } = await deleteReminder(id);
    if (error) {
      toast({ title: 'Delete failed', message: error, type: 'error' });
      return;
    }
    setReminders((prev) => prev.filter((r) => r.id !== id));
    toast({ title: 'Reminder deleted', type: 'info' });
  };

  const handleToggle = async (r: Reminder) => {
    playSound('click');
    const newEnabled = !r.is_enabled;
    setReminders((prev) => prev.map((x) => (x.id === r.id ? { ...x, is_enabled: newEnabled } : x)));
    const { error } = await toggleReminder(r.id, newEnabled);
    if (error) {
      setReminders((prev) => prev.map((x) => (x.id === r.id ? { ...x, is_enabled: !newEnabled } : x)));
      toast({ title: 'Toggle failed', message: error, type: 'error' });
    }
  };

  const toggleDay = (day: number) => {
    const current = form.repeat_days ?? [];
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort();
    setForm({ ...form, repeat_days: next });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatRepeat = (r: Reminder) => {
    if (r.repeat_type === 'once') return `Once · ${formatDate(r.reminder_date)}`;
    if (r.repeat_type === 'daily') return 'Every day';
    if (r.repeat_type === 'weekly') {
      const days = (r.repeat_days ?? []).map((d) => DAY_LABELS[d]).join(', ');
      return `Weekly · ${days}`;
    }
    if (r.repeat_type === 'custom') {
      const days = (r.repeat_days ?? []).map((d) => DAY_LABELS[d]).join(', ');
      return `Custom · ${days}`;
    }
    return r.repeat_type;
  };

  if (loading) {
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
          <AlarmClock size={24} /> Reminders
        </h1>
        <p className="text-sm text-ink-300">Create custom reminders for anything — workouts, study, water, goals, and more</p>
      </div>

      {/* Create button */}
      {!showForm && (
        <button onClick={openCreate} className="btn-primary w-full flex items-center justify-center gap-2">
          <Plus size={18} /> Create New Reminder
        </button>
      )}

      {/* Form */}
      {showForm && (
        <div className="card p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">
              {editingId ? 'Edit Reminder' : 'New Reminder'}
            </h2>
            <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-white/10">
              <X size={18} />
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="label flex items-center gap-1"><AlarmClock size={12} /> Title</label>
            <input
              type="text"
              value={form.reminder_title}
              onChange={(e) => setForm({ ...form, reminder_title: e.target.value })}
              placeholder="e.g. Morning Workout, Study Session, Drink Water..."
              maxLength={80}
              className="input mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <label className="label">Description (optional)</label>
            <textarea
              value={form.reminder_description ?? ''}
              onChange={(e) => setForm({ ...form, reminder_description: e.target.value || null })}
              placeholder="Add details about this reminder..."
              maxLength={200}
              rows={2}
              className="input mt-1 resize-none"
            />
          </div>

          {/* Time */}
          <div>
            <label className="label flex items-center gap-1"><Clock size={12} /> Time</label>
            <input
              type="time"
              value={form.reminder_time}
              onChange={(e) => setForm({ ...form, reminder_time: e.target.value })}
              className="input mt-1 [color-scheme:dark]"
            />
          </div>

          {/* Repeat type */}
          <div>
            <label className="label flex items-center gap-1"><Repeat size={12} /> Repeat</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
              {REPEAT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setForm({ ...form, repeat_type: opt.value })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    form.repeat_type === opt.value
                      ? 'bg-ember-500/20 border border-ember-500/50 text-ember-400'
                      : 'bg-ink-950/60 border border-white/5 hover:bg-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date (for one-time) */}
          {form.repeat_type === 'once' && (
            <div>
              <label className="label flex items-center gap-1"><Calendar size={12} /> Date</label>
              <input
                type="date"
                value={form.reminder_date ?? ''}
                onChange={(e) => setForm({ ...form, reminder_date: e.target.value || null })}
                className="input mt-1 [color-scheme:dark]"
              />
            </div>
          )}

          {/* Day picker (for weekly/custom) */}
          {(form.repeat_type === 'weekly' || form.repeat_type === 'custom') && (
            <div>
              <label className="label">Days of week</label>
              <div className="flex gap-1.5 mt-1">
                {DAY_LABELS.map((label, day) => {
                  const selected = form.repeat_days?.includes(day) ?? false;
                  return (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                        selected
                          ? 'bg-ember-500/30 border border-ember-500/50 text-ember-400'
                          : 'bg-ink-950/60 border border-white/5 text-ink-400 hover:bg-white/5'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {editingId ? 'Update Reminder' : 'Create Reminder'}
          </button>
        </div>
      )}

      {/* Reminder list */}
      <div className="space-y-3">
        {reminders.length === 0 && !showForm && (
          <div className="card p-8 text-center">
            <AlarmClock size={32} className="mx-auto text-ink-500 mb-3" />
            <p className="text-ink-300 font-medium">No reminders yet</p>
            <p className="text-xs text-ink-500 mt-1">Create a reminder for workouts, study, water, or any goal.</p>
          </div>
        )}
        {reminders.map((r) => (
          <div key={r.id} className={`card p-4 transition ${!r.is_enabled ? 'opacity-50' : ''}`}>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-sm truncate">{r.reminder_title}</h3>
                {r.reminder_description && (
                  <p className="text-xs text-ink-400 mt-0.5 line-clamp-2">{r.reminder_description}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="chip bg-ink-800 text-ink-200 text-xs flex items-center gap-1">
                    <Clock size={10} /> {r.reminder_time}
                  </span>
                  <span className="chip bg-ink-800 text-ink-200 text-xs flex items-center gap-1">
                    <Repeat size={10} /> {formatRepeat(r)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggle(r)}
                  className={`w-11 h-6 rounded-full relative transition flex-shrink-0 ${
                    r.is_enabled ? 'bg-ember-500' : 'bg-ink-700'
                  }`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition ${r.is_enabled ? 'left-5' : 'left-0.5'}`} />
                </button>
                <button
                  onClick={() => openEdit(r)}
                  className="p-2 rounded-lg bg-ink-900/60 hover:bg-white/10 text-ink-300 transition"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="p-2 rounded-lg bg-ink-900/60 hover:bg-danger-500/20 text-ink-300 hover:text-danger-400 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
