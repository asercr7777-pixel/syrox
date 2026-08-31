import { useEffect, useMemo, useState } from 'react';
import { Check, Pencil, Plus, RotateCcw, Trash2, X, Play, Pause, Square, Clock } from 'lucide-react';

type Section = 'stretching' | 'main' | 'plyometric';
type Exercise = { id: string; name: string; sets: number; reps: string; section: Section; done: boolean };
type Day = { id: string; name: string; exercises: Exercise[] };
export type WorkoutHistoryEntry = { id: string; dayId: string; dayName: string; startedAt: number; completedAt: number; durationSeconds: number };

const KEY = 'stryven-six-day-workout-v1';
const DATE_KEY = 'stryven-six-day-workout-date-v1';
export const WORKOUT_HISTORY_KEY = 'stryven-workout-history-v1';
const seedNames = ['Day 1','Day 2','Day 3','Day 4','Day 5','Day 6'];
const seedExercises = (day: number): Exercise[] => [
  { id: `s-${day}`, name: 'Dynamic Stretching', sets: 1, reps: '5 min', section: 'stretching', done: false },
  { id: `m-${day}`, name: 'Main Strength Exercise', sets: 3, reps: '8-12', section: 'main', done: false },
  { id: `p-${day}`, name: 'Plyometric Drill', sets: 3, reps: '6-10', section: 'plyometric', done: false },
];
function initial(): Day[] { return seedNames.map((name, i) => ({ id: `day-${i + 1}`, name, exercises: seedExercises(i + 1) })); }
function load(): Day[] { try { const raw = localStorage.getItem(KEY); if (raw) { const value = JSON.parse(raw); if (Array.isArray(value) && value.length === 6) return value; } } catch {} return initial(); }
function loadHistory(): WorkoutHistoryEntry[] { try { const raw = localStorage.getItem(WORKOUT_HISTORY_KEY); const value = raw ? JSON.parse(raw) : []; return Array.isArray(value) ? value : []; } catch { return []; } }
function todayKey() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
const labels: Record<Section, string> = { stretching: 'Stretching', main: 'Main Training', plyometric: 'Plyometric' };

export function SixDayWorkout() {
  const [days, setDays] = useState<Day[]>(load);
  const [active, setActive] = useState(0);
  const [editingDay, setEditingDay] = useState(false);
  const [dayName, setDayName] = useState('');
  const [exerciseDraft, setExerciseDraft] = useState<{ id?: string; name: string; sets: number; reps: string; section: Section } | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const current = days[active];
  const progress = useMemo(() => { const total = current.exercises.length; return total ? Math.round(current.exercises.filter(e => e.done).length / total * 100) : 0; }, [current]);
  const persist = (next: Day[]) => { setDays(next); localStorage.setItem(KEY, JSON.stringify(next)); };
  const updateCurrent = (fn: (d: Day) => Day) => persist(days.map((d, i) => i === active ? fn(d) : d));
  const toggle = (id: string) => updateCurrent(d => ({ ...d, exercises: d.exercises.map(e => e.id === id ? { ...e, done: !e.done } : e) }));
  const saveDayName = () => { const value = dayName.trim(); if (!value) return; updateCurrent(d => ({ ...d, name: value })); setEditingDay(false); };
  const saveExercise = () => { if (!exerciseDraft?.name.trim()) return; updateCurrent(d => ({ ...d, exercises: exerciseDraft.id ? d.exercises.map(e => e.id === exerciseDraft.id ? { ...e, ...exerciseDraft, id: e.id } : e) : [...d.exercises, { ...exerciseDraft, id: `${Date.now()}-${Math.random()}`, done: false }] })); setExerciseDraft(null); };
  const remove = (id: string) => updateCurrent(d => ({ ...d, exercises: d.exercises.filter(e => e.id !== id) }));

  useEffect(() => {
    const checkNewDay = () => {
      const currentDate = todayKey();
      const savedDate = localStorage.getItem(DATE_KEY);
      if (savedDate !== currentDate) {
        const stored = load();
        const next = stored.map(d => ({ ...d, exercises: d.exercises.map(e => ({ ...e, done: false })) }));
        setDays(next);
        localStorage.setItem(KEY, JSON.stringify(next));
        localStorage.setItem(DATE_KEY, currentDate);
      }
    };
    checkNewDay();
    const interval = window.setInterval(checkNewDay, 30 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => { if (!running || startedAt === null) return; const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000))); tick(); const id = window.setInterval(tick, 1000); return () => window.clearInterval(id); }, [running, startedAt]);
  const startTimer = () => { if (running) return; const now = Date.now(); setStartedAt(now - elapsed * 1000); setRunning(true); };
  const pauseTimer = () => setRunning(false);
  const resetTimer = () => { setRunning(false); setElapsed(0); setStartedAt(null); };
  const finishTimer = () => {
    if (startedAt === null || elapsed <= 0) return;
    const completedAt = Date.now();
    const entry: WorkoutHistoryEntry = { id: `${completedAt}-${Math.random()}`, dayId: current.id, dayName: current.name, startedAt, completedAt, durationSeconds: elapsed };
    localStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify([entry, ...loadHistory()].slice(0, 100)));
    window.dispatchEvent(new Event('stryven-workout-history-updated'));
    resetTimer();
  };
  const formatTimer = (seconds: number) => `${String(Math.floor(seconds / 3600)).padStart(2,'0')}:${String(Math.floor(seconds / 60) % 60).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`;

  return <div className="space-y-5">
    <div><h1 className="section-title">6-Day Workout</h1><p className="text-sm text-ink-300">Build your own six-day split. Every day follows Stretching → Main Training → Plyometric.</p></div>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">{days.map((d, i) => <button key={d.id} onClick={() => { if (!running) setActive(i); }} className={`card p-3 text-left transition-all ${active === i ? 'theme-accent-border theme-accent-bg' : 'hover:border-white/20'} ${running ? 'cursor-default' : ''}`}><p className="text-xs text-ink-400">DAY {i + 1}</p><p className="font-bold truncate mt-1">{d.name}</p><p className="text-xs text-ink-400 mt-1">{d.exercises.filter(e => e.done).length}/{d.exercises.length}</p></button>)}</div>
    <div className="card-premium p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div>{editingDay ? <div className="flex gap-2"><input autoFocus value={dayName} onChange={e => setDayName(e.target.value)} className="input" placeholder="Day name" /><button onClick={saveDayName} className="btn-primary">Save</button><button onClick={() => setEditingDay(false)} className="btn-ghost"><X size={16}/></button></div> : <div><div className="flex items-center gap-2"><h2 className="font-display text-2xl font-bold">{current.name}</h2><button className="btn-ghost p-2" onClick={() => { setDayName(current.name); setEditingDay(true); }} disabled={running}><Pencil size={15}/></button></div><p className="text-sm text-ink-400">Day {active + 1} • {progress}% complete</p></div>}</div><button onClick={() => setExerciseDraft({ name: '', sets: 3, reps: '8-12', section: 'main' })} className="btn-primary" disabled={running}><Plus size={17}/> Add Exercise</button></div><div className="h-2 bg-ink-950 rounded-full overflow-hidden mt-5"><div className="h-full bg-gradient-to-r from-ember-500 to-gold-500 transition-all" style={{ width: `${progress}%` }}/></div></div>
    <div className="card-premium p-5 sm:p-6 border border-white/10"><div className="flex items-center gap-2 mb-3"><Clock size={18} className="theme-accent"/><h2 className="font-display text-lg font-bold">Workout Timer</h2></div><div className="text-center py-2"><div className="font-mono text-4xl sm:text-5xl font-bold tracking-wider tabular-nums">{formatTimer(elapsed)}</div><p className="text-xs text-ink-400 mt-2">Records this session under <span className="font-semibold text-ink-200">{current.name}</span></p></div><div className="flex flex-wrap justify-center gap-2 mt-4">{!running ? <button className="btn-primary" onClick={startTimer}><Play size={16}/> {elapsed > 0 ? 'Resume' : 'Start'}</button> : <button className="btn-ghost" onClick={pauseTimer}><Pause size={16}/> Pause</button>}<button className="btn-ghost" onClick={resetTimer} disabled={elapsed === 0}><RotateCcw size={16}/> Reset</button><button className="btn-primary" onClick={finishTimer} disabled={startedAt === null || elapsed === 0}><Square size={15}/> Finish Workout</button></div></div>
    {(['stretching','main','plyometric'] as Section[]).map(section => { const items = current.exercises.filter(e => e.section === section); return <div key={section} className="card p-4 sm:p-5"><div className="flex items-center justify-between mb-3"><h3 className="font-display font-bold uppercase tracking-wider theme-accent">{labels[section]}</h3><span className="text-xs text-ink-400">{items.length} exercises</span></div>{items.length === 0 ? <p className="text-sm text-ink-400 py-3">No exercises yet.</p> : <div className="space-y-2">{items.map(ex => <div key={ex.id} className={`flex items-center gap-3 rounded-xl border p-3 ${ex.done ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-white/5 bg-ink-950/30'}`}><button onClick={() => toggle(ex.id)} className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${ex.done ? 'bg-emerald-500 border-emerald-500' : 'border-ink-500'}`} aria-label={ex.done ? 'Mark incomplete' : 'Mark complete'}>{ex.done && <Check size={14}/>}</button><div className="flex-1 min-w-0"><p className={`font-medium ${ex.done ? 'line-through text-ink-400' : ''}`}>{ex.name}</p><p className="text-xs text-ink-400">{ex.sets} sets × {ex.reps}</p></div><button className="btn-ghost p-2" onClick={() => setExerciseDraft({ id: ex.id, name: ex.name, sets: ex.sets, reps: ex.reps, section: ex.section })} disabled={running}><Pencil size={14}/></button><button className="btn-ghost p-2 text-danger-400" onClick={() => remove(ex.id)} disabled={running}><Trash2 size={14}/></button></div>)}</div>}</div>; })}
    {exerciseDraft && <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setExerciseDraft(null)}><div className="card w-full max-w-md p-5 space-y-4" onClick={e => e.stopPropagation()}><div className="flex justify-between items-center"><h2 className="font-display text-xl font-bold">{exerciseDraft.id ? 'Edit Exercise' : 'Add Exercise'}</h2><button onClick={() => setExerciseDraft(null)}><X/></button></div><input className="input" placeholder="Exercise name" value={exerciseDraft.name} onChange={e => setExerciseDraft({ ...exerciseDraft, name: e.target.value })}/><div className="grid grid-cols-2 gap-3"><input className="input" type="number" min="1" value={exerciseDraft.sets} onChange={e => setExerciseDraft({ ...exerciseDraft, sets: Number(e.target.value) || 1 })}/><input className="input" placeholder="Reps / time" value={exerciseDraft.reps} onChange={e => setExerciseDraft({ ...exerciseDraft, reps: e.target.value })}/></div><select className="input" value={exerciseDraft.section} onChange={e => setExerciseDraft({ ...exerciseDraft, section: e.target.value as Section })}><option value="stretching">Stretching</option><option value="main">Main Training</option><option value="plyometric">Plyometric</option></select><button className="btn-primary w-full" onClick={saveExercise}>Save Exercise</button></div></div>}
  </div>;
}
export default SixDayWorkout;
