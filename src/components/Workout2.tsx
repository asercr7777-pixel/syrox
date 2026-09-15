import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Clock3, Dumbbell, ImagePlus, Maximize2, Minimize2, Pause, Pencil, Play, Plus, RotateCcw, SkipForward, Square, TimerReset, Trash2, X, Trophy, Flame, Layers3, Zap, History, UploadCloud, ShieldCheck } from 'lucide-react';
import { useStore } from '../store/useStore';
import { WORKOUT_SPLIT } from '../data/tasks';
import { toast } from '../components/ui/Toast';
import { supabase } from '../lib/supabase';
import type { ExerciseEntry, WorkoutSessionRecord } from '../store/types';
import './workout-redesign.css';
import './workout-v2.css';

type WorkoutMode = 'push' | 'pull' | 'legs' | 'cardio' | 'boxing' | 'custom';
type ExerciseMeta = { exercise_type: 'reps' | 'time'; duration_seconds: number | null; rest_seconds: number | null; notes: string | null; image_path: string | null };
type MetaMap = Record<string, ExerciseMeta>;
const MODES: { id: WorkoutMode; label: string; code: string; icon: typeof Dumbbell }[] = [
  { id: 'push', label: 'Push', code: '01', icon: Dumbbell }, { id: 'pull', label: 'Pull', code: '02', icon: Layers3 },
  { id: 'legs', label: 'Legs', code: '03', icon: Flame }, { id: 'cardio', label: 'Cardio', code: '04', icon: Zap },
  { id: 'boxing', label: 'Boxing', code: '05', icon: ShieldCheck }, { id: 'custom', label: 'Custom', code: '06', icon: Plus },
];
const modeDay = (mode: WorkoutMode): 'push' | 'pull' | 'leg' => mode === 'legs' ? 'leg' : mode === 'pull' ? 'pull' : 'push';
const formatTime = (s: number) => `${String(Math.floor(Math.max(0, s) / 3600)).padStart(2, '0')}:${String(Math.floor(Math.max(0, s) / 60) % 60).padStart(2, '0')}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;
const formatShort = (s: number) => s >= 3600 ? `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m` : s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
const emptyMeta = (): ExerciseMeta => ({ exercise_type: 'reps', duration_seconds: null, rest_seconds: null, notes: null, image_path: null });
const waitForRender = () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

export function Workout2() {
  const { state, toggleExercise, addExercise, updateExercise, deleteExercise, saveWorkoutSession } = useStore();
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);
  const [mode, setMode] = useState<WorkoutMode>('push');
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [pausedMs, setPausedMs] = useState(0);
  const [focus, setFocus] = useState(false);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [activeSet, setActiveSet] = useState(1);
  const [restRemaining, setRestRemaining] = useState(0);
  const [restEndAt, setRestEndAt] = useState<number | null>(null);
  const [restRunning, setRestRunning] = useState(false);
  const [meta, setMeta] = useState<MetaMap>({});
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showEstimate, setShowEstimate] = useState(false);
  const [draft, setDraft] = useState({ name: '', sets: 3, reps: '10-12', section: 'main' as 'stretching' | 'main' | 'plyometric', type: 'reps' as 'reps' | 'time', duration: '', rest: '', notes: '', image: null as File | null });
  const fileRef = useRef<HTMLInputElement>(null);
  const dayId = modeDay(mode);
  const showExercises = mode === 'push' || mode === 'pull' || mode === 'legs';
  const exercises = showExercises ? state.workouts[dayId] : [];
  const completed = exercises.filter(e => e.completed).length;
  const totalSets = exercises.reduce((n, e) => n + e.sets, 0);
  const completedSets = exercises.reduce((n, e) => n + (e.completed ? e.sets : 0), 0);
  const progress = totalSets ? Math.round(completedSets / totalSets * 100) : 0;
  const split = WORKOUT_SPLIT.find(d => d.id === dayId);
  const sessions = useMemo(() => [...state.workoutSessions].reverse().slice(0, 10), [state.workoutSessions]);
  const exerciseTime = exercises.reduce((n, e) => n + ((meta[e.id]?.duration_seconds ?? 0) * e.sets), 0);
  const restTime = exercises.reduce((n, e) => n + ((meta[e.id]?.rest_seconds ?? 0) * Math.max(0, e.sets - 1)), 0);
  const estimatedTime = exerciseTime + restTime;
  const activeExercise = exercises.find(e => e.id === activeExerciseId) ?? null;
  const activeMeta = activeExercise ? meta[activeExercise.id] ?? emptyMeta() : null;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!showExercises) return;
      const { data, error } = await supabase.from('workout_exercise_meta').select('*').eq('day_id', dayId);
      if (cancelled) return;
      if (error) { console.error('[Workout2] metadata load error:', error); return; }
      const next: MetaMap = {};
      (data ?? []).forEach((row: any) => { next[row.exercise_id] = { exercise_type: row.exercise_type === 'time' ? 'time' : 'reps', duration_seconds: row.duration_seconds, rest_seconds: row.rest_seconds, notes: row.notes, image_path: row.image_path }; });
      setMeta(next);
      const rows = (data ?? []).filter((row: any) => row.image_path);
      if (!rows.length) { setImageUrls({}); return; }
      const signed = await supabase.storage.from('workout-exercises').createSignedUrls(rows.map((row: any) => row.image_path), 3600);
      if (cancelled) return;
      const urls: Record<string, string> = {};
      (signed.data ?? []).forEach((item: any, index: number) => { if (item.signedUrl) urls[rows[index].exercise_id] = item.signedUrl; });
      setImageUrls(urls);
    };
    void load();
    return () => { cancelled = true; };
  }, [dayId, showExercises]);

  useEffect(() => {
    if (!running || startedAt === null) return;
    const tick = () => { const pausedNow = pausedAt ? Date.now() - pausedAt : 0; setElapsed(Math.max(0, Math.floor((Date.now() - startedAt - pausedMs - pausedNow) / 1000))); };
    tick(); const id = window.setInterval(tick, 250); return () => window.clearInterval(id);
  }, [running, startedAt, pausedAt, pausedMs]);

  useEffect(() => {
    if (!restRunning || restEndAt === null) return;
    const tick = () => { const remaining = Math.max(0, Math.ceil((restEndAt - Date.now()) / 1000)); setRestRemaining(remaining); if (remaining <= 0) { setRestRunning(false); setRestEndAt(null); } };
    tick(); const id = window.setInterval(tick, 200); return () => window.clearInterval(id);
  }, [restRunning, restEndAt]);

  const resetWorkout = () => { setRunning(false); setElapsed(0); setStartedAt(null); setPausedAt(null); setPausedMs(0); setActiveExerciseId(null); setActiveSet(1); setRestRunning(false); setRestEndAt(null); setRestRemaining(0); };
  const switchMode = (next: WorkoutMode) => { if (!running) { setMode(next); resetWorkout(); setShowEstimate(false); } };
  const start = () => { if (running) return; const now = Date.now(); if (startedAt === null) setStartedAt(now); else if (pausedAt !== null) setPausedMs(v => v + now - pausedAt); setPausedAt(null); setRunning(true); if (!activeExerciseId && exercises.length) setActiveExerciseId(exercises[0].id); };
  const pause = () => { if (!running) return; setPausedAt(Date.now()); setRunning(false); if (restRunning && restEndAt !== null) { setRestRemaining(Math.max(0, Math.ceil((restEndAt - Date.now()) / 1000))); setRestRunning(false); setRestEndAt(null); } };
  const finish = () => { if (saving || !startedAt || elapsed <= 0) return; setSaving(true); setRunning(false); const duration = elapsed; saveWorkoutSession(mode as WorkoutSessionRecord['type'], duration); toast({ title: 'Workout complete', message: `${formatTime(duration)} saved to your history.`, type: 'success', icon: '✓' }); window.setTimeout(() => { setSaving(false); resetWorkout(); }, 150); };
  const startRest = (seconds: number) => { if (seconds <= 0) return; setRestRemaining(seconds); setRestEndAt(Date.now() + seconds * 1000); setRestRunning(true); };
  const toggleRest = () => { if (restRunning && restEndAt !== null) { setRestRemaining(Math.max(0, Math.ceil((restEndAt - Date.now()) / 1000))); setRestRunning(false); setRestEndAt(null); } else if (restRemaining > 0) { setRestEndAt(Date.now() + restRemaining * 1000); setRestRunning(true); } };
  const completeSet = () => { if (!activeExercise || restRunning) return; if (activeSet < activeExercise.sets) { setActiveSet(v => v + 1); startRest(activeMeta?.rest_seconds ?? 0); return; } toggleExercise(dayId, activeExercise.id); const index = exercises.findIndex(e => e.id === activeExercise.id); const next = exercises[index + 1]; if (next) { setActiveExerciseId(next.id); setActiveSet(1); setRestRemaining(0); setRestEndAt(null); setRestRunning(false); } };
  const skipExercise = () => { const index = activeExercise ? exercises.findIndex(e => e.id === activeExercise.id) : -1; const next = exercises[index + 1]; if (next) { setActiveExerciseId(next.id); setActiveSet(1); setRestRemaining(0); setRestEndAt(null); setRestRunning(false); } };
  const openAdd = () => { setEditId(null); setDraft({ name: '', sets: 3, reps: '10-12', section: 'main', type: 'reps', duration: '', rest: '', notes: '', image: null }); setFormOpen(true); };
  const openEdit = (e: ExerciseEntry) => { const m = meta[e.id] ?? emptyMeta(); setEditId(e.id); setDraft({ name: e.name, sets: e.sets, reps: e.reps, section: e.section, type: m.exercise_type, duration: m.duration_seconds ? String(m.duration_seconds) : '', rest: m.rest_seconds !== null ? String(m.rest_seconds) : '', notes: m.notes ?? '', image: null }); setFormOpen(true); };

  const save = async () => {
    const name = draft.name.trim(); const sets = Math.max(1, Math.min(50, Number(draft.sets) || 1)); const duration = draft.type === 'time' ? Math.max(1, Number(draft.duration) || 0) : null; const rest = draft.rest === '' ? null : Math.max(0, Math.min(3600, Number(draft.rest) || 0));
    if (!name || (draft.type === 'reps' && !draft.reps.trim()) || (draft.type === 'time' && !duration)) { toast({ title: 'Complete the exercise fields', message: 'Choose reps or a valid duration.', type: 'error' }); return; }
    setSaving(true);
    try {
      const existingIds = new Set(exercises.map(e => e.id)); let exerciseId = editId;
      if (exerciseId) updateExercise(dayId, exerciseId, { name, sets, reps: draft.reps.trim() });
      else { addExercise(dayId, name, sets, draft.reps.trim(), draft.section); await waitForRender(); const created = stateRef.current.workouts[dayId].find(e => !existingIds.has(e.id) && e.name === name); exerciseId = created?.id ?? null; }
      if (!exerciseId) throw new Error('Could not resolve the new exercise ID. Please try again.');
      let imagePath = editId ? (meta[exerciseId]?.image_path ?? null) : null;
      if (draft.image) {
        setUploading(true); if (!draft.image.type.startsWith('image/')) throw new Error('Please choose an image or GIF.'); if (draft.image.size > 10 * 1024 * 1024) throw new Error('Image must be 10 MB or smaller.');
        const user = (await supabase.auth.getUser()).data.user; if (!user) throw new Error('Please sign in before uploading exercise media.');
        const ext = draft.image.name.split('.').pop()?.toLowerCase() || 'jpg'; imagePath = `${user.id}/${exerciseId}-${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('workout-exercises').upload(imagePath, draft.image, { upsert: true, contentType: draft.image.type }); if (error) throw error;
        const { data: signed } = await supabase.storage.from('workout-exercises').createSignedUrl(imagePath, 3600); if (signed?.signedUrl) setImageUrls(v => ({ ...v, [exerciseId!]: signed.signedUrl }));
      }
      const user = (await supabase.auth.getUser()).data.user; if (!user) throw new Error('Please sign in before saving exercise configuration.');
      const row = { user_id: user.id, exercise_id: exerciseId, day_id: dayId, exercise_type: draft.type, duration_seconds: duration, rest_seconds: rest, notes: draft.notes.trim() || null, image_path: imagePath, updated_at: new Date().toISOString() };
      const { error } = await supabase.from('workout_exercise_meta').upsert(row, { onConflict: 'user_id,exercise_id' }); if (error) throw error;
      setMeta(v => ({ ...v, [exerciseId!]: { exercise_type: draft.type, duration_seconds: duration, rest_seconds: rest, notes: draft.notes.trim() || null, image_path: imagePath } })); setFormOpen(false); setEditId(null); toast({ title: editId ? 'Exercise upgraded' : 'Exercise added', message: 'Your workout configuration is saved.', type: 'success' });
    } catch (err: any) { toast({ title: 'Could not save exercise', message: err?.message ?? 'Please try again.', type: 'error' }); }
    finally { setUploading(false); setSaving(false); }
  };

  const remove = async (id: string) => { if (saving) return; const path = meta[id]?.image_path; deleteExercise(dayId, id); const user = (await supabase.auth.getUser()).data.user; if (user) await supabase.from('workout_exercise_meta').delete().eq('user_id', user.id).eq('exercise_id', id).eq('day_id', dayId); if (path) await supabase.storage.from('workout-exercises').remove([path]); setMeta(v => { const n = { ...v }; delete n[id]; return n; }); setImageUrls(v => { const n = { ...v }; delete n[id]; return n; }); if (activeExerciseId === id) { setActiveExerciseId(null); setActiveSet(1); } toast({ title: 'Exercise removed', message: 'The exercise and its media were removed.', type: 'success' }); };

  return <div className={`stryven-workout-v2 ${focus ? 'is-focus' : ''}`}>
    <header className="workout-v2-header"><div className="workout-v2-heading"><div className="workout-v2-kicker">SYROX / TRAINING SYSTEM 2.0</div><h1 className="section-title">Workout Execution</h1><p>Precision training. Real-time execution. Permanent progression.</p></div><div className="workout-v2-header-actions"><button className="btn-ghost" onClick={() => setFocus(v => !v)}>{focus ? <Minimize2 size={16}/> : <Maximize2 size={16}/>} {focus ? 'Exit Focus' : 'Focus Mode'}</button>{showExercises && <button className="btn-primary" onClick={openAdd} disabled={running}><Plus size={17}/> Add Exercise</button>}</div></header>
    <section className="workout-v2-card workout-v2-command"><div className="workout-v2-command-top"><div><div className="workout-v2-kicker">COMMAND CENTER</div><h2>{MODES.find(m => m.id === mode)?.label} Protocol</h2></div><div className={`workout-v2-live ${running ? 'on' : ''}`}><span></span>{running ? 'LIVE SESSION' : elapsed ? 'PAUSED' : 'READY'}</div></div><div className="workout-v2-modes">{MODES.map(m => { const Icon = m.icon; return <button key={m.id} onClick={() => switchMode(m.id)} disabled={running} className={`workout-v2-mode ${mode === m.id ? 'active' : ''}`}><span className="workout-v2-mode-code">{m.code}</span><Icon size={17}/><strong>{m.label}</strong></button>; })}</div><div className="workout-v2-clock-wrap"><div className="workout-v2-label">SESSION ELAPSED</div><div className="workout-v2-clock">{formatTime(elapsed)}</div><div className="workout-v2-state">{running ? 'EXECUTION IN PROGRESS' : elapsed ? 'SESSION PAUSED' : 'SYSTEM READY'}</div></div><div className="workout-v2-controls">{!running ? <button className="btn-primary" onClick={start}><Play size={18}/> {elapsed ? 'Resume Session' : 'Start Workout'}</button> : <button className="btn-ghost" onClick={pause}><Pause size={18}/> Pause</button>}<button className="btn-ghost" onClick={resetWorkout} disabled={!elapsed}><RotateCcw size={17}/> Reset</button><button className="btn-primary" onClick={finish} disabled={!startedAt || elapsed <= 0 || saving}><Square size={15}/> {saving ? 'Saving…' : 'Finish & Save'}</button></div>{showExercises && <div className="workout-v2-overview"><div><span>EXERCISES</span><strong>{exercises.length}</strong><small>planned</small></div><div><span>TOTAL SETS</span><strong>{totalSets}</strong><small>{completedSets} completed</small></div><div><span>PROGRESS</span><strong>{progress}%</strong><small>set completion</small></div><div><span>ESTIMATED</span><strong>{estimatedTime ? formatShort(estimatedTime) : '—'}</strong><small>fixed-time only</small></div><button className="workout-v2-time-button" onClick={() => setShowEstimate(v => !v)}><Clock3 size={16}/> Breakdown</button></div>}{showEstimate && showExercises && <div className="workout-v2-estimate"><div><span>EXERCISE TIME</span><strong>{exerciseTime ? formatShort(exerciseTime) : 'No fixed time'}</strong></div><div><span>REST TIME</span><strong>{restTime ? formatShort(restTime) : 'No rest timers'}</strong></div><div><span>REPS</span><strong>Manual execution</strong></div><div><span>ESTIMATE RULE</span><strong>No invented transition time</strong></div></div>}</section>
    {running && activeExercise && <section className="workout-v2-card workout-v2-active"><div className="workout-v2-active-top"><div><span>ACTIVE EXERCISE</span><strong>{exercises.findIndex(e => e.id === activeExercise.id) + 1} / {exercises.length}</strong></div><div><span>SET</span><strong>{activeSet} / {activeExercise.sets}</strong></div></div><div className="workout-v2-progress"><span style={{ width: `${Math.min(100, ((exercises.findIndex(e => e.id === activeExercise.id) + (activeSet - 1) / Math.max(1, activeExercise.sets)) / Math.max(1, exercises.length)) * 100)}%` }}/></div><div className="workout-v2-active-grid"><div className="workout-v2-media-frame">{imageUrls[activeExercise.id] ? <img className="workout-v2-active-image" src={imageUrls[activeExercise.id]} alt={activeExercise.name}/> : <div className="workout-v2-active-placeholder"><Dumbbell size={42}/><span>ADD EXERCISE MEDIA</span></div>}<div className="workout-v2-media-badge">{activeMeta?.exercise_type === 'time' ? 'TIME' : 'REPS'}</div></div><div className="workout-v2-active-info"><div className="workout-v2-kicker">CURRENT TARGET</div><h2>{activeExercise.name}</h2><div className="workout-v2-target">{activeMeta?.exercise_type === 'time' && activeMeta.duration_seconds ? <><TimerReset size={18}/> {formatTime(activeMeta.duration_seconds)} target</> : <><Dumbbell size={18}/> {activeExercise.reps} reps</>}</div>{activeMeta?.notes && <p className="workout-v2-coach-note">{activeMeta.notes}</p>}{activeMeta?.exercise_type === 'time' && activeMeta.duration_seconds ? <TimeExercise key={`${activeExercise.id}-${activeSet}-${activeMeta.duration_seconds}`} duration={activeMeta.duration_seconds} running={running && !restRunning}/> : <div className="workout-v2-reps-display">{activeExercise.reps}<small>CONTROLLED REPS</small></div>}<div className="workout-v2-active-actions"><button className="btn-primary workout-v2-main-action" onClick={completeSet} disabled={restRunning}><Check size={17}/> {activeSet < activeExercise.sets ? 'Complete Set' : 'Complete Exercise'}</button><button className="btn-ghost" onClick={skipExercise}><SkipForward size={16}/> Skip</button></div></div></div>{restRemaining > 0 && <div className={`workout-v2-rest ${restRunning ? 'is-running' : 'is-paused'}`}><div className="workout-v2-rest-copy"><span>RECOVERY WINDOW</span><strong>{formatTime(restRemaining)}</strong></div><div className="workout-v2-rest-actions"><button className="btn-ghost" onClick={toggleRest}>{restRunning ? <Pause size={15}/> : <Play size={15}/>} {restRunning ? 'Pause' : 'Resume'}</button><button className="btn-ghost" onClick={() => { setRestRunning(false); setRestEndAt(null); setRestRemaining(0); }}>Skip Rest</button></div></div>}</section>}
    {!focus && showExercises && <><section className="workout-v2-card workout-v2-progress-card"><div className="workout-v2-section-head"><div><div className="workout-v2-kicker">CURRENT SPLIT</div><h2>{split?.name ?? `${mode} training`}</h2><p>{split?.description ?? 'Build and track your own session.'}</p></div><div className="workout-v2-progress-stat"><strong>{completedSets}</strong><span>/ {totalSets} SETS</span></div></div><div className="workout-v2-progress"><span style={{ width: `${progress}%` }}/></div><div className="workout-v2-progress-meta"><span>{completed} / {exercises.length} exercises cleared</span><strong>{progress}% complete</strong></div></section>{(split?.sections ?? []).map(sec => { const list = exercises.filter(e => e.section === sec.type); if (!list.length) return null; return <section className="workout-v2-card" key={sec.type}><div className="workout-v2-section-title"><div><span className="workout-v2-section-dot"></span>{sec.name}</div><span>{list.filter(e => e.completed).length}/{list.length}</span></div><div className="workout-v2-list">{list.map((e, index) => { const m = meta[e.id] ?? emptyMeta(); const isActive = activeExerciseId === e.id && running; return <article className={`workout-v2-exercise ${e.completed ? 'done' : ''} ${isActive ? 'is-active' : ''}`} key={e.id}><button className="workout-v2-check" onClick={() => toggleExercise(dayId, e.id)} aria-label={e.completed ? 'Mark incomplete' : 'Mark complete'}>{e.completed && <Check size={15}/>}</button>{imageUrls[e.id] ? <img className="workout-v2-thumb" src={imageUrls[e.id]} alt=""/> : <div className="workout-v2-thumb placeholder"><Dumbbell size={17}/></div>}<div className="workout-v2-exercise-copy"><div className="workout-v2-exercise-title"><span className="workout-v2-index">{String(index + 1).padStart(2, '0')}</span><strong>{e.name}</strong></div><span>{e.sets} sets × {m.exercise_type === 'time' && m.duration_seconds ? `${formatTime(m.duration_seconds)} / set` : `${e.reps} reps`}</span></div><div className="workout-v2-exercise-metrics">{m.rest_seconds !== null && <span>{m.rest_seconds}s rest</span>}{m.exercise_type === 'time' && <span className="workout-v2-type">TIME</span>}</div><button className="btn-ghost workout-v2-icon" onClick={() => openEdit(e)} disabled={running} aria-label="Edit exercise"><Pencil size={15}/></button><button className="btn-ghost workout-v2-icon danger" onClick={() => void remove(e.id)} disabled={running} aria-label="Delete exercise"><Trash2 size={15}/></button></article>; })}</div></section>; })}{!exercises.length && <section className="workout-v2-card workout-v2-empty"><div className="workout-v2-empty-icon"><Dumbbell size={30}/></div><strong>No exercises configured</strong><span>This split is ready for your first training protocol.</span><button className="btn-primary" onClick={openAdd}><Plus size={16}/> Add First Exercise</button></section>}{completed > 0 && completed === exercises.length && <div className="workout-v2-complete"><div className="workout-v2-complete-icon"><Trophy size={20}/></div><div><strong>Split cleared</strong><span>Every exercise in this training plan is marked complete.</span></div><span className="workout-v2-complete-tag">COMPLETE</span></div>}</>}
    {!focus && <section className="workout-v2-card workout-v2-history-card"><div className="workout-v2-section-title"><div><History size={15}/> Recent Sessions</div><span>{state.workoutSessions.length} total</span></div>{sessions.length ? <div className="workout-v2-history">{sessions.map(s => <div key={s.id}><span className="history-type">{String(s.type).toUpperCase()}</span><div><strong>{formatTime(s.durationSeconds)}</strong><span>{new Date(s.completedAt).toLocaleDateString()} · {new Date(s.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div><span className="history-arrow">›</span></div>)}</div> : <div className="workout-v2-empty compact"><History size={24}/><span>No sessions logged yet.</span></div>}</section>}
    {formOpen && <div className="workout-v2-modal" role="dialog" aria-modal="true"><div className="workout-v2-modal-card"><div className="workout-v2-modal-head"><div><div className="workout-v2-kicker">WORKOUT CONFIGURATION</div><h2>{editId ? 'Edit Exercise' : 'Add Exercise'}</h2><p>Configure the exact target you want the System to execute.</p></div><button className="btn-ghost workout-v2-icon" onClick={() => setFormOpen(false)} aria-label="Close"><X size={16}/></button></div><div className="workout-v2-form-grid"><label>Name<input className="input" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} autoFocus placeholder="e.g. Bulgarian Split Squat"/></label><label>Sets<input className="input" type="number" min="1" max="50" value={draft.sets} onChange={e => setDraft(d => ({ ...d, sets: Number(e.target.value) }))}/></label></div><div className="workout-v2-type-switch"><button className={draft.type === 'reps' ? 'active' : ''} onClick={() => setDraft(d => ({ ...d, type: 'reps' }))}><Dumbbell size={15}/> Reps Based</button><button className={draft.type === 'time' ? 'active' : ''} onClick={() => setDraft(d => ({ ...d, type: 'time' }))}><TimerReset size={15}/> Time Based</button></div>{draft.type === 'reps' ? <label>Target Reps<input className="input" value={draft.reps} onChange={e => setDraft(d => ({ ...d, reps: e.target.value }))} placeholder="10-12"/></label> : <label>Duration (seconds)<input className="input" type="number" min="1" max="7200" value={draft.duration} onChange={e => setDraft(d => ({ ...d, duration: e.target.value }))} placeholder="45"/></label>}<div className="workout-v2-form-grid"><label>Rest after set (seconds)<input className="input" type="number" min="0" max="3600" value={draft.rest} onChange={e => setDraft(d => ({ ...d, rest: e.target.value }))} placeholder="Optional"/></label>{!editId && <label>Section<select className="input" value={draft.section} onChange={e => setDraft(d => ({ ...d, section: e.target.value as typeof d.section }))}><option value="stretching">Stretching</option><option value="main">Main Training</option><option value="plyometric">Plyometric</option></select></label>}</div><label>Coaching Notes<textarea className="input workout-v2-notes" value={draft.notes} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))} placeholder="Optional cues, tempo, breathing or form notes..."/></label><div className="workout-v2-upload-zone" onClick={() => fileRef.current?.click()}><input ref={fileRef} hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e => setDraft(d => ({ ...d, image: e.target.files?.[0] ?? null }))}/><div className="workout-v2-upload-icon"><UploadCloud size={20}/></div><div><strong>{draft.image?.name ?? 'Upload exercise image / GIF'}</strong><span>JPG, PNG, WEBP or GIF · max 10 MB</span></div><ImagePlus size={18}/></div>{draft.image && <div className="workout-v2-file-ready"><Check size={14}/> {Math.round(draft.image.size / 1024)} KB ready to upload</div>}<div className="workout-v2-modal-actions"><button className="btn-ghost" onClick={() => setFormOpen(false)}>Cancel</button><button className="btn-primary" onClick={() => void save()} disabled={saving || uploading}><Check size={16}/> {saving ? 'Saving…' : uploading ? 'Uploading…' : 'Save Exercise'}</button></div></div></div>}
  </div>;
}

function TimeExercise({ duration, running }: { duration: number; running: boolean }) {
  const [remaining, setRemaining] = useState(duration); const [startedAt, setStartedAt] = useState<number | null>(null); const [accumulated, setAccumulated] = useState(0);
  useEffect(() => { setRemaining(duration); setStartedAt(null); setAccumulated(0); }, [duration]);
  useEffect(() => { if (!running) { if (startedAt !== null) { setAccumulated(v => v + Date.now() - startedAt); setStartedAt(null); } return; } if (startedAt === null) setStartedAt(Date.now()); const id = window.setInterval(() => { const active = startedAt ?? Date.now(); const seconds = Math.floor((accumulated + Date.now() - active) / 1000); setRemaining(Math.max(0, duration - seconds)); }, 200); return () => window.clearInterval(id); }, [running, startedAt, accumulated, duration]);
  return <div className={`workout-v2-exercise-timer ${remaining === 0 ? 'finished' : ''}`}><Clock3 size={18}/><strong>{formatTime(remaining)}</strong><span>{remaining === 0 ? 'TIME COMPLETE' : running ? 'TIME TARGET' : 'PAUSED'}</span></div>;
}
