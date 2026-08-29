import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { Plus, Pencil, Trash2, Check, Dumbbell, Play, Pause, Square, RotateCcw, Settings2 } from 'lucide-react';
import { toast } from '../components/ui/Toast';
import type { CustomWorkoutDay, ExerciseEntry } from '../store/types';

const CONFIG_KEY = '__six_day_workout_config__';
const SECTION_NAMES = { stretching: 'Stretching', main: 'Main Workout', plyometric: 'Plyometric' } as const;
const EMOJIS = ['🔥', '⚡', '🦾', '🗡️', '👑', '💀'];

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function readConfig(raw: string | undefined, fallback: CustomWorkoutDay[]): CustomWorkoutDay[] {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== 6) return fallback;
    return parsed.map((d, i) => ({ ...fallback[i], ...d, id: `day${i + 1}`, exercises: Array.isArray(d.exercises) ? d.exercises : fallback[i].exercises }));
  } catch { return fallback; }
}

export function Workout() {
  const { state, setNote, saveWorkoutSession } = useStore();
  const fallback = state.customWorkoutDays;
  const [days, setDays] = useState<CustomWorkoutDay[]>(() => readConfig(state.notes[CONFIG_KEY], fallback));
  const [activeDay, setActiveDay] = useState(0);
  const [setupOpen, setSetupOpen] = useState(() => !state.notes[CONFIG_KEY]);
  const [setupDraft, setSetupDraft] = useState<CustomWorkoutDay[]>(() => readConfig(state.notes[CONFIG_KEY], fallback));
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState('10-12');
  const [section, setSection] = useState<keyof typeof SECTION_NAMES>('main');
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!timerRunning) return;
    intervalRef.current = window.setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current); };
  }, [timerRunning]);

  const persist = useCallback((next: CustomWorkoutDay[]) => {
    setDays(next);
    setNote(CONFIG_KEY, JSON.stringify(next));
  }, [setNote]);

  const current = days[activeDay];
  const exercises = current?.exercises ?? [];
  const completedCount = exercises.filter((e) => e.completed).length;
  const allDone = exercises.length > 0 && completedCount === exercises.length;
  const sections = useMemo(() => (['stretching', 'main', 'plyometric'] as const), []);

  const saveSetup = () => {
    const cleaned = setupDraft.map((d, i) => ({ ...d, id: `day${i + 1}`, name: d.name.trim() || `Day ${i + 1}`, emoji: d.emoji || EMOJIS[i] }));
    persist(cleaned);
    setSetupDraft(cleaned);
    setSetupOpen(false);
    toast({ title: '6-day workout saved', message: 'Your custom training system is ready.', type: 'success' });
  };

  const resetTimer = () => { setTimerRunning(false); setElapsedSeconds(0); };
  const stopTimer = () => {
    setTimerRunning(false);
    if (elapsedSeconds > 0) {
      saveWorkoutSession('custom', elapsedSeconds);
      toast({ title: 'Workout saved!', message: `${formatTime(elapsedSeconds)} logged for ${current.name}.`, type: 'success', icon: '💪' });
    }
  };

  const openAdd = () => { setName(''); setSets(3); setReps('10-12'); setSection('main'); setAddOpen(true); };
  const openEdit = (ex: ExerciseEntry) => { setName(ex.name); setSets(ex.sets); setReps(ex.reps); setSection(ex.section); setEditId(ex.id); };

  const saveExercise = () => {
    if (!name.trim()) return toast({ title: 'Exercise name required', type: 'error' });
    const next = days.map((d, i) => i !== activeDay ? d : {
      ...d,
      exercises: editId
        ? d.exercises.map((e) => e.id === editId ? { ...e, name: name.trim(), sets, reps, section } : e)
        : [...d.exercises, { id: crypto.randomUUID(), name: name.trim(), sets, reps, section, completed: false }],
    });
    persist(next); setAddOpen(false); setEditId(null);
    toast({ title: editId ? 'Exercise updated' : 'Exercise added', type: 'success' });
  };

  const toggleExercise = (id: string) => {
    persist(days.map((d, i) => i !== activeDay ? d : { ...d, exercises: d.exercises.map((e) => e.id === id ? { ...e, completed: !e.completed } : e) }));
  };

  const deleteExercise = () => {
    if (!deleteId) return;
    persist(days.map((d, i) => i !== activeDay ? d : { ...d, exercises: d.exercises.filter((e) => e.id !== deleteId) }));
    setDeleteId(null);
    toast({ title: 'Exercise deleted', type: 'success' });
  };

  const editDayName = () => {
    const value = window.prompt('Enter the new name for this day:', current.name);
    if (value?.trim()) {
      const next = days.map((d, i) => i === activeDay ? { ...d, name: value.trim() } : d);
      persist(next); setSetupDraft(next);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div><h1 className="section-title">Workout System</h1><p className="text-sm text-ink-300">6 days. Your rules. Stretching + workout + plyometric.</p></div>
        <button onClick={() => { setSetupDraft(days); setSetupOpen(true); }} className="btn-ghost"><Settings2 size={17} /> Customize 6 Days</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {days.map((d, i) => (
          <button key={d.id} onClick={() => { setActiveDay(i); resetTimer(); }} className={`card p-3 text-left transition-all ${i === activeDay ? 'theme-accent-border theme-accent-bg' : 'hover:border-white/15'}`}>
            <div className="text-xl mb-1">{d.emoji}</div><div className="text-xs text-ink-400">DAY {i + 1}</div><div className="font-bold truncate">{d.name}</div>
          </button>
        ))}
      </div>

      <div className="card p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-radial-fade" />
        <div className="relative">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div><div className="flex items-center gap-2"><span className="text-2xl">{current.emoji}</span><h2 className="font-display text-2xl font-bold">{current.name}</h2><button onClick={editDayName} className="p-1.5 rounded-lg hover:bg-white/10"><Pencil size={14} /></button></div><p className="text-sm text-ink-300 mt-1">Day {activeDay + 1} of 6</p></div>
            <div className="text-right"><div className="text-4xl font-mono font-bold text-[rgb(var(--accent-400))]">{formatTime(elapsedSeconds)}</div><p className="text-xs text-ink-400">{timerRunning ? 'Training in progress' : elapsedSeconds ? 'Paused' : 'Ready'}</p></div>
          </div>
          <div className="h-2 bg-ink-950 rounded-full overflow-hidden mt-5"><div className="h-full bg-gradient-to-r from-ember-500 to-gold-500 transition-all" style={{ width: `${exercises.length ? (completedCount / exercises.length) * 100 : 0}%` }} /></div>
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {!timerRunning && elapsedSeconds === 0 && <button onClick={() => setTimerRunning(true)} className="btn-primary px-6 py-3"><Play size={19} /> Start</button>}
            {timerRunning && <button onClick={() => setTimerRunning(false)} className="btn-ghost px-6 py-3"><Pause size={19} /> Pause</button>}
            {!timerRunning && elapsedSeconds > 0 && <button onClick={() => setTimerRunning(true)} className="btn-primary px-6 py-3"><Play size={19} /> Resume</button>}
            {elapsedSeconds > 0 && <button onClick={stopTimer} className="btn-danger px-6 py-3"><Square size={19} /> Stop & Save</button>}
            <button onClick={resetTimer} className="btn-ghost px-6 py-3"><RotateCcw size={19} /> Reset</button>
          </div>
        </div>
      </div>

      {sections.map((sec) => {
        const list = exercises.filter((e) => e.section === sec);
        return <div key={sec} className="card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3"><h3 className="font-display text-sm font-bold uppercase tracking-wider text-[rgb(var(--accent-400))]">{SECTION_NAMES[sec]}</h3>{sec === 'main' && <button onClick={openAdd} className="btn-primary text-xs"><Plus size={15} /> Add Exercise</button>}</div>
          {list.length === 0 ? <p className="text-sm text-ink-400 py-3">No exercises here yet.</p> : <div className="space-y-2">{list.map((ex) => <div key={ex.id} className={`flex items-center gap-2 p-3 rounded-xl border ${ex.completed ? 'bg-emerald2-500/10 border-emerald2-500/30' : 'bg-ink-950/40 border-white/5'}`}>
            <button onClick={() => toggleExercise(ex.id)} className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${ex.completed ? 'bg-emerald2-500 border-emerald2-500' : 'border-ink-500'}`}>{ex.completed && <Check size={14} />}</button>
            <div className="flex-1 min-w-0"><p className={`font-medium ${ex.completed ? 'line-through text-emerald2-400' : ''}`}>{ex.name}</p><p className="text-xs text-ink-400">{ex.sets} sets × {ex.reps} reps</p></div>
            <button onClick={() => openEdit(ex)} className="p-2 rounded-lg hover:bg-white/10"><Pencil size={14} /></button><button onClick={() => setDeleteId(ex.id)} className="p-2 rounded-lg hover:bg-danger-500/20 text-danger-400"><Trash2 size={14} /></button>
          </div>)}</div>}
        </div>;
      })}

      <div className="card p-4 sm:p-5"><h2 className="section-title mb-4">Workout History</h2>{state.workoutSessions.length === 0 ? <p className="text-sm text-ink-400 text-center py-4">No workouts logged yet.</p> : <div className="space-y-2">{state.workoutSessions.slice(-5).reverse().map((s) => <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-ink-950/40 border border-white/5"><span className="text-xl">💪</span><div className="flex-1"><p className="font-medium text-sm">6-Day Workout</p><p className="text-xs text-ink-400">{new Date(s.completedAt).toLocaleString()}</p></div><span className="font-mono font-bold text-[rgb(var(--accent-400))]">{formatTime(s.durationSeconds)}</span></div>)}</div>}</div>

      <Modal open={setupOpen} onClose={() => { if (state.notes[CONFIG_KEY]) setSetupOpen(false); }} title="Build Your 6-Day Workout">
        <div className="space-y-4"><p className="text-sm text-ink-300">Choose a name and identity for every day. You can edit the exercises after saving. Every day always follows Stretching → Workout → Plyometric.</p>
          <div className="space-y-2">{setupDraft.map((d, i) => <div key={d.id} className="grid grid-cols-[auto_1fr_auto] gap-2 items-center"><span className="text-xl">{d.emoji}</span><input className="input" value={d.name} onChange={(e) => setSetupDraft(setupDraft.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder={`Day ${i + 1}`} /><button className="p-2 rounded-lg hover:bg-white/10" onClick={() => setSetupDraft(setupDraft.map((x, j) => j === i ? { ...x, emoji: EMOJIS[(EMOJIS.indexOf(x.emoji) + 1) % EMOJIS.length] } : x))}>🔄</button></div>)}</div>
          <button onClick={saveSetup} className="btn-primary w-full">Save My 6 Days</button>
        </div>
      </Modal>

      <Modal open={addOpen || editId !== null} onClose={() => { setAddOpen(false); setEditId(null); }} title={editId ? 'Edit Exercise' : 'Add Exercise'}>
        <div className="space-y-4"><div><label className="label">Exercise Name</label><input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Push Ups" autoFocus /></div><div className="grid grid-cols-2 gap-3"><div><label className="label">Sets</label><input type="number" className="input mt-1" value={sets} min={1} onChange={(e) => setSets(Math.max(1, Number(e.target.value)))} /></div><div><label className="label">Reps</label><input className="input mt-1" value={reps} onChange={(e) => setReps(e.target.value)} /></div></div><div><label className="label">Section</label><div className="grid grid-cols-3 gap-2 mt-1">{(Object.keys(SECTION_NAMES) as Array<keyof typeof SECTION_NAMES>).map((s) => <button key={s} onClick={() => setSection(s)} className={`px-2 py-2 rounded-lg text-xs capitalize border ${section === s ? 'bg-ember-500/20 border-ember-500/40 text-ember-400' : 'bg-ink-950/60 border-white/5'}`}>{SECTION_NAMES[s]}</button>)}</div></div><div className="flex justify-end gap-2"><button onClick={() => { setAddOpen(false); setEditId(null); }} className="btn-ghost">Cancel</button><button onClick={saveExercise} className="btn-primary">{editId ? 'Save' : 'Add'}</button></div></div>
      </Modal>

      <ConfirmModal open={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={deleteExercise} title="Delete Exercise" message="Remove this exercise from the workout?" confirmLabel="Delete" danger />
    </div>
  );
}
