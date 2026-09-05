import { useEffect, useMemo, useState } from 'react';
import { Check, Dumbbell, Pause, Pencil, Play, Plus, RotateCcw, Square, Trash2, X, Maximize2, Minimize2, Trophy } from 'lucide-react';
import { useStore } from '../store/useStore';
import { WORKOUT_SPLIT } from '../data/tasks';
import { toast } from '../components/ui/Toast';
import type { ExerciseEntry } from '../store/types';
import './workout-redesign.css';

type WorkoutMode = 'push' | 'pull' | 'legs' | 'cardio' | 'boxing' | 'custom';
const MODES: { id: WorkoutMode; label: string; icon: string }[] = [
  { id: 'push', label: 'Push', icon: 'PUSH' }, { id: 'pull', label: 'Pull', icon: 'PULL' },
  { id: 'legs', label: 'Legs', icon: 'LEGS' }, { id: 'cardio', label: 'Cardio', icon: 'CARDIO' },
  { id: 'boxing', label: 'Boxing', icon: 'BOX' }, { id: 'custom', label: 'Custom', icon: 'CUSTOM' },
];
const modeDay = (mode: WorkoutMode): 'push' | 'pull' | 'leg' => mode === 'legs' ? 'leg' : mode === 'pull' ? 'pull' : 'push';
const formatTime = (s: number) => `${String(Math.floor(s / 3600)).padStart(2,'0')}:${String(Math.floor(s / 60) % 60).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;

export function Workout2() {
  const { state, toggleExercise, addExercise, updateExercise, deleteExercise, saveWorkoutSession } = useStore();
  const [mode, setMode] = useState<WorkoutMode>('push');
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [focus, setFocus] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: '', sets: 3, reps: '10-12', section: 'main' as 'stretching' | 'main' | 'plyometric' });
  const [saving, setSaving] = useState(false);
  const dayId = modeDay(mode);
  const showExercises = mode === 'push' || mode === 'pull' || mode === 'legs';
  const exercises = showExercises ? state.workouts[dayId] : [];
  const completed = exercises.filter(e => e.completed).length;
  const progress = exercises.length ? Math.round(completed / exercises.length * 100) : 0;
  const split = WORKOUT_SPLIT.find(d => d.id === dayId);
  const sessions = useMemo(() => [...state.workoutSessions].reverse().slice(0, 8), [state.workoutSessions]);

  useEffect(() => {
    if (!running || startedAt === null) return;
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    tick(); const id = window.setInterval(tick, 1000); return () => window.clearInterval(id);
  }, [running, startedAt]);

  const switchMode = (next: WorkoutMode) => { if (running) return; setMode(next); setElapsed(0); setStartedAt(null); setRunning(false); };
  const start = () => { if (running) return; setStartedAt(Date.now() - elapsed * 1000); setRunning(true); };
  const pause = () => setRunning(false);
  const reset = () => { setRunning(false); setElapsed(0); setStartedAt(null); };
  const finish = () => {
    if (saving || !startedAt || elapsed <= 0) return;
    setSaving(true);
    const duration = elapsed;
    setRunning(false);
    saveWorkoutSession(mode, duration);
    toast({ title: 'Workout complete', message: `${formatTime(duration)} saved to your history.`, type: 'success', icon: '✓' });
    setTimeout(() => { setSaving(false); setElapsed(0); setStartedAt(null); }, 150);
  };
  const openAdd = () => { setEditId(null); setDraft({ name: '', sets: 3, reps: '10-12', section: 'main' }); setFormOpen(true); };
  const openEdit = (e: ExerciseEntry) => { setEditId(e.id); setDraft({ name: e.name, sets: e.sets, reps: e.reps, section: e.section }); setFormOpen(true); };
  const save = () => {
    const name = draft.name.trim(); const sets = Math.max(1, Math.min(50, Number(draft.sets) || 1)); const reps = draft.reps.trim();
    if (!name || !reps) { toast({ title: 'Complete the exercise fields', type: 'error' }); return; }
    if (saving) return;
    if (editId) updateExercise(dayId, editId, { name, sets, reps });
    else addExercise(dayId, name, sets, reps, draft.section);
    setFormOpen(false); setEditId(null); toast({ title: editId ? 'Exercise updated' : 'Exercise added', type: 'success' });
  };
  const remove = (id: string) => { if (saving) return; deleteExercise(dayId, id); toast({ title: 'Exercise removed', type: 'success' }); };

  return <div className={`stryven-workout-v2 ${focus ? 'is-focus' : ''}`}>
    <header className="workout-v2-header">
      <div><div className="workout-v2-kicker">TRAINING SYSTEM</div><h1 className="section-title">Workout 2.0</h1><p className="text-sm text-ink-300">Train with intent. Track every session.</p></div>
      <div className="workout-v2-header-actions">
        <button className="btn-ghost" onClick={() => setFocus(v => !v)}>{focus ? <Minimize2 size={16}/> : <Maximize2 size={16}/>} {focus ? 'Exit Focus' : 'Focus Mode'}</button>
        {showExercises && <button className="btn-primary" onClick={openAdd} disabled={running}><Plus size={17}/> Add Exercise</button>}
      </div>
    </header>

    <section className="workout-v2-card workout-v2-hero">
      <div className="workout-v2-modes">{MODES.map(m => <button key={m.id} onClick={() => switchMode(m.id)} disabled={running} className={`workout-v2-mode ${mode === m.id ? 'active' : ''}`}><span>{m.icon}</span><strong>{m.label}</strong></button>)}</div>
      <div className="workout-v2-timer"><div className="workout-v2-label">{MODES.find(m => m.id === mode)?.label} SESSION</div><div className="workout-v2-clock">{formatTime(elapsed)}</div><div className="workout-v2-state">{running ? 'SESSION IN PROGRESS' : elapsed ? 'SESSION PAUSED' : 'READY'}</div></div>
      <div className="workout-v2-controls">
        {!running ? <button className="btn-primary" onClick={start}><Play size={18}/> {elapsed ? 'Resume' : 'Start Session'}</button> : <button className="btn-ghost" onClick={pause}><Pause size={18}/> Pause</button>}
        <button className="btn-ghost" onClick={reset} disabled={!elapsed}><RotateCcw size={17}/> Reset</button>
        <button className="btn-primary" onClick={finish} disabled={!startedAt || elapsed <= 0 || saving}><Square size={16}/> {saving ? 'Saving…' : 'Finish & Save'}</button>
      </div>
    </section>

    {!focus && showExercises && <>
      <section className="workout-v2-card">
        <div className="workout-v2-section-head"><div><div className="workout-v2-kicker">CURRENT SPLIT</div><h2>{split?.name ?? `${mode} training`}</h2><p>{split?.description ?? 'Build your own session and track it.'}</p></div><div className="workout-v2-progress-value">{progress}%</div></div>
        <div className="workout-v2-progress"><span style={{ width: `${progress}%` }}/></div>
      </section>
      {(split?.sections ?? []).map(sec => { const list = exercises.filter(e => e.section === sec.type); if (!list.length) return null; return <section className="workout-v2-card" key={sec.type}><div className="workout-v2-section-title">{sec.name}<span>{list.filter(e => e.completed).length}/{list.length}</span></div><div className="workout-v2-list">{list.map(e => <div className={`workout-v2-exercise ${e.completed ? 'done' : ''}`} key={e.id}><button className="workout-v2-check" onClick={() => toggleExercise(dayId, e.id)} aria-label={e.completed ? 'Mark incomplete' : 'Mark complete'}>{e.completed && <Check size={15}/>}</button><div className="workout-v2-exercise-copy"><strong>{e.name}</strong><span>{e.sets} sets × {e.reps} reps</span></div><button className="btn-ghost workout-v2-icon" onClick={() => openEdit(e)} disabled={running}><Pencil size={15}/></button><button className="btn-ghost workout-v2-icon danger" onClick={() => remove(e.id)} disabled={running}><Trash2 size={15}/></button></div>)}</div></section>; })}
      {!exercises.length && <section className="workout-v2-card workout-v2-empty"><Dumbbell size={34}/><strong>No exercises yet</strong><span>Add your first exercise to this split.</span><button className="btn-primary" onClick={openAdd}><Plus size={16}/> Add Exercise</button></section>}
      {completed > 0 && completed === exercises.length && <div className="workout-v2-complete"><Trophy size={20}/><div><strong>Session plan complete</strong><span>Every exercise in this split is marked done.</span></div></div>}
    </>}

    {!focus && <section className="workout-v2-card"><div className="workout-v2-section-title">Recent Sessions<span>{state.workoutSessions.length} total</span></div>{sessions.length ? <div className="workout-v2-history">{sessions.map(s => <div key={s.id}><span className="history-type">{String(s.type).toUpperCase()}</span><span>{new Date(s.completedAt).toLocaleString()}</span><strong>{formatTime(s.durationSeconds)}</strong></div>)}</div> : <div className="workout-v2-empty compact"><Dumbbell size={26}/><span>No sessions logged yet.</span></div>}</section>}

    {formOpen && <div className="workout-v2-modal" role="dialog" aria-modal="true"><div className="workout-v2-modal-card"><div className="workout-v2-section-title"><span>{editId ? 'Edit Exercise' : 'Add Exercise'}</span><button className="btn-ghost workout-v2-icon" onClick={() => setFormOpen(false)}><X size={16}/></button></div><label>Name<input className="input" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} autoFocus /></label><div className="workout-v2-form-grid"><label>Sets<input className="input" type="number" min="1" max="50" value={draft.sets} onChange={e => setDraft(d => ({ ...d, sets: Number(e.target.value) }))} /></label><label>Reps / Duration<input className="input" value={draft.reps} onChange={e => setDraft(d => ({ ...d, reps: e.target.value }))} /></label></div>{!editId && <label>Section<select className="input" value={draft.section} onChange={e => setDraft(d => ({ ...d, section: e.target.value as typeof d.section }))}><option value="stretching">Stretching</option><option value="main">Main Training</option><option value="plyometric">Plyometric</option></select></label>}<div className="workout-v2-modal-actions"><button className="btn-ghost" onClick={() => setFormOpen(false)}>Cancel</button><button className="btn-primary" onClick={save} disabled={saving}><Check size={16}/> Save Exercise</button></div></div></div>}
  </div>;
}
