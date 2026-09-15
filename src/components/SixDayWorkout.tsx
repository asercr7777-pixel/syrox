import { useEffect, useMemo, useState } from 'react';
import { Check, Pencil, Plus, RotateCcw, Trash2, X, Play, Pause, Square, Clock, History, Trophy } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ALL_CHAPTERS } from '../data/story';
import { playSound } from '../lib/sound';
import { supabase } from '../lib/supabase';

type Section = 'stretching' | 'main' | 'plyometric';
type Exercise = { id: string; name: string; sets: number; reps: string; section: Section; done: boolean };
type Day = { id: string; name: string; exercises: Exercise[] };
type HistoryEntry = { id: string; dayId: string; dayName: string; startedAt: number; completedAt: number; durationSeconds: number };

const PLAN_KEY = 'stryven-six-day-workout-v1';
const DATE_KEY = 'stryven-six-day-workout-date-v1';
const STORY_WORKOUT_KEY = 'stryven-story-workout-events-v1';
const seedNames = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6'];
const seedExercises = (day: number): Exercise[] => [
  { id: `s-${day}`, name: 'Dynamic Stretching', sets: 1, reps: '5 min', section: 'stretching', done: false },
  { id: `m-${day}`, name: 'Main Strength Exercise', sets: 3, reps: '8-12', section: 'main', done: false },
  { id: `p-${day}`, name: 'Plyometric Drill', sets: 3, reps: '6-10', section: 'plyometric', done: false },
];
function initial(): Day[] { return seedNames.map((name, i) => ({ id: `day-${i + 1}`, name, exercises: seedExercises(i + 1) })); }
function validDays(value: unknown): value is Day[] { return Array.isArray(value) && value.length === 6 && value.every((day: any) => day && typeof day.id === 'string' && typeof day.name === 'string' && Array.isArray(day.exercises)); }
function readLegacyPlan(): Day[] | null { try { const raw = localStorage.getItem(PLAN_KEY); if (!raw) return null; const value = JSON.parse(raw); return validDays(value) ? value : null; } catch { return null; } }
function todayKey() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function dayKey(timestamp: number) { const d = new Date(timestamp); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
const labels: Record<Section, string> = { stretching: 'Stretching', main: 'Main Training', plyometric: 'Plyometric' };

export function SixDayWorkout() {
  const { state, completeStoryMission } = useStore();
  const [days, setDays] = useState<Day[]>(initial);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState(false);
  const [editingDay, setEditingDay] = useState(false);
  const [dayName, setDayName] = useState('');
  const [exerciseDraft, setExerciseDraft] = useState<{ id?: string; name: string; sets: number; reps: string; section: Section } | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const current = days[active] ?? days[0];
  const progress = useMemo(() => { const total = current.exercises.length; return total ? Math.round(current.exercises.filter(e => e.done).length / total * 100) : 0; }, [current]);
  const todayHistory = useMemo(() => history.filter(h => dayKey(h.completedAt) === todayKey()), [history]);

  const persistPlan = async (next: Day[]) => {
    setDays(next);
    setSavingPlan(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Please sign in to save your workout plan.');
      const { error } = await supabase.from('workout_plans').upsert({ user_id: user.id, days: next, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (error) throw error;
      localStorage.removeItem(PLAN_KEY);
      localStorage.removeItem(DATE_KEY);
    } catch (error) {
      console.error('[SixDayWorkout] plan save failed:', error);
      try { localStorage.setItem(PLAN_KEY, JSON.stringify(next)); } catch {}
    } finally { setSavingPlan(false); }
  };

  useEffect(() => {
    let cancelled = false;
    const loadCloud = async () => {
      setLoading(true);
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) { if (!cancelled) setLoading(false); return; }
      const { data, error } = await supabase.from('workout_plans').select('days').eq('user_id', user.id).maybeSingle();
      if (cancelled) return;
      if (error) console.error('[SixDayWorkout] plan load failed:', error);
      let next: Day[];
      if (validDays(data?.days)) next = data.days;
      else {
        const legacy = readLegacyPlan();
        next = legacy ?? initial();
        const { error: seedError } = await supabase.from('workout_plans').upsert({ user_id: user.id, days: next, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
        if (seedError) console.error('[SixDayWorkout] plan seed failed:', seedError); else { localStorage.removeItem(PLAN_KEY); localStorage.removeItem(DATE_KEY); }
      }
      const savedDate = localStorage.getItem(DATE_KEY);
      if (savedDate && savedDate !== todayKey()) next = next.map(d => ({ ...d, exercises: d.exercises.map(e => ({ ...e, done: false })) }));
      setDays(next);
      if (savedDate !== todayKey()) void supabase.from('workout_plans').update({ days: next, updated_at: new Date().toISOString() }).eq('user_id', user.id);
      localStorage.setItem(DATE_KEY, todayKey());
      setLoading(false);
    };
    void loadCloud();
    return () => { cancelled = true; };
  }, []);

  const loadHistory = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    const { data, error } = await supabase.from('workout_sessions').select('id, duration_seconds, completed_at, started_at, ended_at, metadata').eq('user_id', user.id).order('completed_at', { ascending: false }).limit(100);
    if (error) { console.error('[SixDayWorkout] history load failed:', error); return; }
    const rows: HistoryEntry[] = (data ?? []).map((row: any) => ({
      id: row.id,
      dayId: String(row.metadata?.dayId ?? 'day-1'),
      dayName: String(row.metadata?.dayName ?? row.workout_type ?? 'Workout'),
      startedAt: new Date(row.started_at ?? row.completed_at).getTime(),
      completedAt: new Date(row.ended_at ?? row.completed_at).getTime(),
      durationSeconds: Math.max(0, Number(row.duration_seconds) || 0),
    }));
    setHistory(rows);
  };

  useEffect(() => { void loadHistory(); }, []);
  useEffect(() => { if (!running || startedAt === null) return; const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000))); tick(); const id = window.setInterval(tick, 250); return () => window.clearInterval(id); }, [running, startedAt]);

  const updateCurrent = (fn: (day: Day) => Day) => { const next = days.map((day, index) => index === active ? fn(day) : day); void persistPlan(next); };
  const toggle = (id: string) => {
    const next = days.map((day, index) => index === active ? { ...day, exercises: day.exercises.map(e => e.id === id ? { ...e, done: !e.done } : e) } : day);
    void persistPlan(next);
    const nextCurrent = next[active];
    if (nextCurrent.exercises.length > 0 && nextCurrent.exercises.every(e => e.done)) playSound('workoutComplete');
  };
  const saveDayName = () => { const value = dayName.trim(); if (!value) return; updateCurrent(day => ({ ...day, name: value })); setEditingDay(false); };
  const saveExercise = () => {
    if (!exerciseDraft?.name.trim()) return;
    const normalized = { ...exerciseDraft, name: exerciseDraft.name.trim(), reps: exerciseDraft.reps.trim(), sets: Math.max(1, Math.min(50, Number(exerciseDraft.sets) || 1)) };
    updateCurrent(day => ({ ...day, exercises: normalized.id ? day.exercises.map(e => e.id === normalized.id ? { ...e, ...normalized, id: e.id, done: e.done } : e) : [...day.exercises, { ...normalized, id: crypto.randomUUID(), done: false }] }));
    setExerciseDraft(null);
  };
  const remove = (id: string) => updateCurrent(day => ({ ...day, exercises: day.exercises.filter(e => e.id !== id) }));

  const syncStoryAfterWorkout = (durationSeconds: number) => {
    const today = todayKey();
    try { const raw = localStorage.getItem(STORY_WORKOUT_KEY); const events = raw ? JSON.parse(raw) : {}; events[`${today}:${current.id}`] ??= Date.now(); localStorage.setItem(STORY_WORKOUT_KEY, JSON.stringify(events)); } catch {}
    const chapter = ALL_CHAPTERS.find(item => item.number === Math.min(state.storyChapter + 1, 30));
    if (!chapter) return;
    const workoutCountToday = todayHistory.length + 1;
    chapter.missions.filter(mission => mission.type === 'workout' && !state.storyCompletedMissions[mission.id] && workoutCountToday >= mission.target).forEach(mission => completeStoryMission(mission.id, { xp: mission.xpReward }));
    window.dispatchEvent(new CustomEvent('stryven-story-event', { detail: { type: 'workout_completed', dayId: current.id, dayName: current.name, durationSeconds, date: today, workoutCountToday } }));
  };

  const startTimer = () => { if (running) return; const now = Date.now(); setStartedAt(now - elapsed * 1000); setRunning(true); playSound('click'); };
  const pauseTimer = () => { setRunning(false); playSound('click'); };
  const resetTimer = () => { setRunning(false); setElapsed(0); setStartedAt(null); };
  const finishTimer = async () => {
    if (startedAt === null || elapsed <= 0) return;
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    const completedAt = Date.now();
    const { data, error } = await supabase.from('workout_sessions').insert({ user_id: user.id, workout_type: 'custom', duration_seconds: elapsed, started_at: new Date(startedAt).toISOString(), ended_at: new Date(completedAt).toISOString(), completed_at: new Date(completedAt).toISOString(), metadata: { dayId: current.id, dayName: current.name, exercises: current.exercises.length, sets: current.exercises.reduce((sum, e) => sum + e.sets, 0) } }).select('id').single();
    if (error) { console.error('[SixDayWorkout] session save failed:', error); return; }
    setHistory(prev => [{ id: data.id, dayId: current.id, dayName: current.name, startedAt, completedAt, durationSeconds: elapsed }, ...prev].slice(0, 100));
    syncStoryAfterWorkout(elapsed);
    playSound('workoutComplete');
    window.dispatchEvent(new Event('stryven-workout-history-updated'));
    resetTimer();
  };

  const resetPlan = async () => { const next = initial(); setActive(0); await persistPlan(next); };
  const formatTimer = (seconds: number) => `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const formatDate = (timestamp: number) => new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }).format(timestamp);
  const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`;

  if (loading) return <div className="card-premium p-8 text-center text-sm text-ink-400">Loading your six-day workout…</div>;

  return <div className="space-y-5">
    <div><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl card flex items-center justify-center theme-accent-bg"><Trophy size={19} className="theme-accent" /></div><div><h1 className="section-title">6-Day Workout</h1><p className="text-sm text-ink-300">Your split. Your exercises. Your progression.</p></div></div></div>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">{days.map((day, i) => <button key={day.id} onClick={() => { if (!running) setActive(i); }} className={`card p-3 text-left transition-all ${active === i ? 'theme-accent-border theme-accent-bg' : 'hover:border-white/20'} ${running ? 'cursor-default' : ''}`}><p className="text-xs text-ink-400">DAY {i + 1}</p><p className="font-bold truncate mt-1">{day.name}</p><p className="text-xs text-ink-400 mt-1">{day.exercises.filter(e => e.done).length}/{day.exercises.length} complete</p></button>)}</div>
    <div className="card-premium p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div>{editingDay ? <div className="flex gap-2"><input autoFocus value={dayName} onChange={e => setDayName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveDayName()} className="input" placeholder="Day name" /><button onClick={saveDayName} className="btn-primary">Save</button><button onClick={() => setEditingDay(false)} className="btn-ghost"><X size={16} /></button></div> : <div><div className="flex items-center gap-2"><h2 className="font-display text-2xl font-bold">{current.name}</h2><button className="btn-ghost p-2" onClick={() => { setDayName(current.name); setEditingDay(true); }} disabled={running}><Pencil size={15} /></button></div><p className="text-sm text-ink-400">Day {active + 1} • {progress}% complete</p></div>}</div><button onClick={() => setExerciseDraft({ name: '', sets: 3, reps: '8-12', section: 'main' })} className="btn-primary" disabled={running || savingPlan}><Plus size={17} /> Add Exercise</button></div><div className="relative isolate z-[1] h-2 bg-ink-950 rounded-full overflow-hidden mt-5"><div className="relative z-[2] h-full bg-gradient-to-r from-ember-500 to-gold-500 transition-all" style={{ width: `${progress}%` }} /></div></div>
    <div className="card-premium p-5 sm:p-6 border border-white/10"><div className="flex items-center gap-2 mb-3"><Clock size={18} className="theme-accent" /><h2 className="font-display text-lg font-bold">Workout Timer</h2><span className="ml-auto text-xs text-ink-400">{todayHistory.length} session{todayHistory.length === 1 ? '' : 's'} today</span></div><div className="text-center py-2"><div className="font-mono text-4xl sm:text-5xl font-bold tracking-wider tabular-nums">{formatTimer(elapsed)}</div><p className="text-xs text-ink-400 mt-2">Session will be saved under <span className="font-semibold text-ink-200">{current.name}</span></p></div><div className="flex flex-wrap justify-center gap-2 mt-4">{!running ? <button className="btn-primary" onClick={startTimer}><Play size={16} /> {elapsed > 0 ? 'Resume' : 'Start Session'}</button> : <button className="btn-ghost" onClick={pauseTimer}><Pause size={16} /> Pause</button>}<button className="btn-ghost" onClick={resetTimer} disabled={elapsed === 0}><RotateCcw size={16} /> Reset</button><button className="btn-primary" onClick={() => void finishTimer()} disabled={startedAt === null || elapsed === 0}><Square size={15} /> Finish & Save</button></div></div>
    {(['stretching', 'main', 'plyometric'] as Section[]).map(section => { const items = current.exercises.filter(e => e.section === section); return <div key={section} className="card p-4 sm:p-5"><div className="flex items-center justify-between mb-3"><h3 className="font-display font-bold uppercase tracking-wider theme-accent">{labels[section]}</h3><span className="text-xs text-ink-400">{items.filter(e => e.done).length}/{items.length}</span></div>{items.length === 0 ? <p className="text-sm text-ink-400 py-3">No exercises yet.</p> : <div className="space-y-2">{items.map(ex => <div key={ex.id} className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${ex.done ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-white/5 bg-ink-950/30'}`}><button onClick={() => toggle(ex.id)} className={`w-7 h-7 shrink-0 rounded-md border-2 flex items-center justify-center transition-all ${ex.done ? 'bg-emerald-500 border-emerald-500' : 'border-ink-500 hover:border-white/50'}`} aria-label={ex.done ? 'Mark incomplete' : 'Mark complete'}>{ex.done && <Check size={15} />}</button><div className="flex-1 min-w-0"><p className={`font-medium ${ex.done ? 'line-through text-ink-400' : ''}`}>{ex.name}</p><p className="text-xs text-ink-400">{ex.sets} sets × {ex.reps}</p></div><button className="btn-ghost p-2" onClick={() => setExerciseDraft({ id: ex.id, name: ex.name, sets: ex.sets, reps: ex.reps, section: ex.section })} disabled={running}><Pencil size={14} /></button><button className="btn-ghost p-2 text-danger-400" onClick={() => remove(ex.id)} disabled={running}><Trash2 size={14} /></button></div>)}</div>}</div>; })}
    <div className="card-premium p-5 sm:p-6"><div className="flex items-center gap-2 mb-4"><History size={18} className="theme-accent" /><div><h2 className="font-display text-lg font-bold">Workout History</h2><p className="text-xs text-ink-400">Duration, time and training day are preserved in Supabase.</p></div></div>{history.length === 0 ? <div className="py-7 text-center text-sm text-ink-400">No completed sessions yet.</div> : <div className="space-y-2">{history.slice(0, 8).map(entry => <div key={entry.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-ink-950/30 p-3"><div className="w-9 h-9 rounded-lg card flex items-center justify-center"><Clock size={16} className="theme-accent" /></div><div className="flex-1 min-w-[140px]"><p className="font-semibold">{entry.dayName}</p><p className="text-xs text-ink-400">{formatDate(entry.completedAt)}</p></div><div className="text-sm font-mono font-semibold">{formatDuration(entry.durationSeconds)}</div></div>)}</div>}</div>
    <div className="flex justify-end"><button className="btn-ghost text-xs" onClick={() => void resetPlan()} disabled={running || savingPlan}>Reset six-day plan</button></div>
    {exerciseDraft && <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setExerciseDraft(null)}><div className="card w-full max-w-md p-5 space-y-4" onClick={e => e.stopPropagation()}><div className="flex justify-between items-center"><h2 className="font-display text-xl font-bold">{exerciseDraft.id ? 'Edit Exercise' : 'Add Exercise'}</h2><button onClick={() => setExerciseDraft(null)}><X /></button></div><input autoFocus className="input" placeholder="Exercise name" value={exerciseDraft.name} onChange={e => setExerciseDraft({ ...exerciseDraft, name: e.target.value })} /><div className="grid grid-cols-2 gap-3"><input className="input" type="number" min="1" value={exerciseDraft.sets} onChange={e => setExerciseDraft({ ...exerciseDraft, sets: Number(e.target.value) || 1 })} /><input className="input" placeholder="Reps / time" value={exerciseDraft.reps} onChange={e => setExerciseDraft({ ...exerciseDraft, reps: e.target.value })} /></div><select className="input" value={exerciseDraft.section} onChange={e => setExerciseDraft({ ...exerciseDraft, section: e.target.value as Section })}><option value="stretching">Stretching</option><option value="main">Main Training</option><option value="plyometric">Plyometric</option></select><button className="btn-primary w-full" onClick={saveExercise}>Save Exercise</button></div></div>}
  </div>;
}

export default SixDayWorkout;
