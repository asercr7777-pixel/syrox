import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Clock3, Dumbbell, ImagePlus, Maximize2, Minimize2, Pause, Pencil, Play, Plus, RotateCcw, SkipForward, Square, TimerReset, Trash2, X, Trophy } from 'lucide-react';
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
const MODES: { id: WorkoutMode; label: string; icon: string }[] = [
  { id: 'push', label: 'Push', icon: 'PUSH' }, { id: 'pull', label: 'Pull', icon: 'PULL' },
  { id: 'legs', label: 'Legs', icon: 'LEGS' }, { id: 'cardio', label: 'Cardio', icon: 'CARDIO' },
  { id: 'boxing', label: 'Boxing', icon: 'BOX' }, { id: 'custom', label: 'Custom', icon: 'CUSTOM' },
];
const modeDay = (mode: WorkoutMode): 'push' | 'pull' | 'leg' => mode === 'legs' ? 'leg' : mode === 'pull' ? 'pull' : 'push';
const formatTime = (s: number) => `${String(Math.floor(s / 3600)).padStart(2,'0')}:${String(Math.floor(s / 60) % 60).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
const formatShort = (s: number) => s >= 3600 ? `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m` : `${Math.floor(s/60)}m ${s%60}s`;
const emptyMeta = (): ExerciseMeta => ({ exercise_type: 'reps', duration_seconds: null, rest_seconds: null, notes: null, image_path: null });

export function Workout2() {
  const { state, toggleExercise, addExercise, updateExercise, deleteExercise, saveWorkoutSession } = useStore();
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
  const [restRunning, setRestRunning] = useState(false);
  const [meta, setMeta] = useState<MetaMap>({});
  const [imageUrls, setImageUrls] = useState<Record<string,string>>({});
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
  const progress = exercises.length ? Math.round(completed / exercises.length * 100) : 0;
  const split = WORKOUT_SPLIT.find(d => d.id === dayId);
  const sessions = useMemo(() => [...state.workoutSessions].reverse().slice(0, 8), [state.workoutSessions]);
  const totalSets = exercises.reduce((n,e) => n + e.sets, 0);
  const completedSets = exercises.reduce((n,e) => n + (e.completed ? e.sets : 0), 0);
  const exerciseTime = exercises.reduce((n,e) => n + ((meta[e.id]?.duration_seconds ?? 0) * e.sets), 0);
  const restTime = exercises.reduce((n,e) => n + ((meta[e.id]?.rest_seconds ?? 0) * Math.max(0, e.sets - 1)), 0);
  const estimatedTime = exerciseTime + restTime;
  const activeExercise = exercises.find(e => e.id === activeExerciseId) ?? null;
  const activeMeta = activeExercise ? meta[activeExercise.id] ?? emptyMeta() : null;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!showExercises) return;
      const { data } = await supabase.from('workout_exercise_meta').select('*').eq('day_id', dayId);
      if (cancelled) return;
      const next: MetaMap = {};
      (data ?? []).forEach((row: any) => { next[row.exercise_id] = { exercise_type: row.exercise_type === 'time' ? 'time' : 'reps', duration_seconds: row.duration_seconds, rest_seconds: row.rest_seconds, notes: row.notes, image_path: row.image_path }; });
      setMeta(next);
      const urls: Record<string,string> = {};
      for (const row of data ?? []) if (row.image_path) {
        const { data: signed } = await supabase.storage.from('workout-exercises').createSignedUrl(row.image_path, 3600);
        if (!cancelled && signed?.signedUrl) urls[row.exercise_id] = signed.signedUrl;
      }
      if (!cancelled) setImageUrls(urls);
    };
    void load();
    return () => { cancelled = true; };
  }, [dayId, showExercises]);

  useEffect(() => {
    if (!running || startedAt === null) return;
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startedAt - pausedMs - (pausedAt ? Date.now() - pausedAt : 0)) / 1000)));
    tick(); const id = window.setInterval(tick, 250); return () => window.clearInterval(id);
  }, [running, startedAt, pausedAt, pausedMs]);

  useEffect(() => {
    if (!restRunning) return;
    const id = window.setInterval(() => setRestRemaining(v => {
      if (v <= 1) { setRestRunning(false); return 0; }
      return v - 1;
    }), 1000);
    return () => window.clearInterval(id);
  }, [restRunning]);

  const switchMode = (next: WorkoutMode) => { if (running) return; setMode(next); resetWorkout(); };
  const resetWorkout = () => { setRunning(false); setElapsed(0); setStartedAt(null); setPausedAt(null); setPausedMs(0); setActiveExerciseId(null); setActiveSet(1); setRestRunning(false); setRestRemaining(0); };
  const start = () => {
    if (running) return;
    const now = Date.now();
    if (startedAt === null) setStartedAt(now);
    else if (pausedAt !== null) setPausedMs(v => v + now - pausedAt);
    setPausedAt(null); setRunning(true);
    if (!activeExerciseId && exercises.length) setActiveExerciseId(exercises[0].id);
  };
  const pause = () => { if (!running) return; setPausedAt(Date.now()); setRunning(false); };
  const finish = () => {
    if (saving || !startedAt || elapsed <= 0) return;
    setSaving(true);
    const duration = elapsed;
    const sessionType = mode as WorkoutSessionRecord['type'];
    setRunning(false);
    saveWorkoutSession(sessionType, duration);
    toast({ title: 'Workout complete', message: `${formatTime(duration)} saved to your history.`, type: 'success', icon: '✓' });
    window.setTimeout(() => { setSaving(false); resetWorkout(); }, 150);
  };
  const completeSet = () => {
    if (!activeExercise) return;
    if (activeSet < activeExercise.sets) {
      const rest = activeMeta?.rest_seconds ?? 0;
      if (rest > 0) { setRestRemaining(rest); setRestRunning(true); }
      setActiveSet(v => v + 1);
    } else {
      toggleExercise(dayId, activeExercise.id);
      const index = exercises.findIndex(e => e.id === activeExercise.id);
      const next = exercises[index + 1];
      if (next) { setActiveExerciseId(next.id); setActiveSet(1); setRestRemaining(0); setRestRunning(false); }
    }
  };
  const skipExercise = () => {
    const index = activeExercise ? exercises.findIndex(e => e.id === activeExercise.id) : -1;
    const next = exercises[index + 1];
    if (next) { setActiveExerciseId(next.id); setActiveSet(1); setRestRunning(false); setRestRemaining(0); }
  };
  const openAdd = () => { setEditId(null); setDraft({ name:'', sets:3, reps:'10-12', section:'main', type:'reps', duration:'', rest:'', notes:'', image:null }); setFormOpen(true); };
  const openEdit = (e: ExerciseEntry) => { const m = meta[e.id] ?? emptyMeta(); setEditId(e.id); setDraft({ name:e.name, sets:e.sets, reps:e.reps, section:e.section, type:m.exercise_type, duration:m.duration_seconds ? String(m.duration_seconds) : '', rest:m.rest_seconds !== null ? String(m.rest_seconds) : '', notes:m.notes ?? '', image:null }); setFormOpen(true); };
  const save = async () => {
    const name = draft.name.trim(); const sets = Math.max(1, Math.min(50, Number(draft.sets) || 1));
    const duration = draft.type === 'time' ? Math.max(1, Number(draft.duration) || 0) : null;
    const rest = draft.rest === '' ? null : Math.max(0, Math.min(3600, Number(draft.rest) || 0));
    if (!name || (draft.type === 'reps' && !draft.reps.trim()) || (draft.type === 'time' && !duration)) { toast({ title:'Complete the exercise fields', message:'Choose reps or a valid duration.', type:'error' }); return; }
    setSaving(true);
    try {
      let exerciseId = editId;
      if (exerciseId) updateExercise(dayId, exerciseId, { name, sets, reps: draft.reps.trim() });
      else { exerciseId = Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4); addExercise(dayId, name, sets, draft.reps.trim(), draft.section); }
      if (!exerciseId) throw new Error('Could not create exercise');
      let imagePath = editId ? (meta[exerciseId]?.image_path ?? null) : null;
      if (draft.image) {
        setUploading(true);
        if (!draft.image.type.startsWith('image/')) throw new Error('Please choose an image or GIF.');
        if (draft.image.size > 10 * 1024 * 1024) throw new Error('Image must be 10 MB or smaller.');
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) throw new Error('Please sign in before uploading exercise media.');
        const ext = draft.image.name.split('.').pop()?.toLowerCase() || 'jpg';
        imagePath = `${user.id}/${exerciseId}-${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('workout-exercises').upload(imagePath, draft.image, { upsert:true, contentType:draft.image.type });
        if (error) throw error;
        const { data: signed } = await supabase.storage.from('workout-exercises').createSignedUrl(imagePath, 3600);
        if (signed?.signedUrl) setImageUrls(v => ({ ...v, [exerciseId!]: signed.signedUrl }));
      }
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Please sign in before saving exercise configuration.');
      const row = { user_id:user.id, exercise_id:exerciseId, day_id:dayId, exercise_type:draft.type, duration_seconds:duration, rest_seconds:rest, notes:draft.notes.trim() || null, image_path:imagePath, updated_at:new Date().toISOString() };
      const { error } = await supabase.from('workout_exercise_meta').upsert(row, { onConflict:'user_id,exercise_id' });
      if (error) throw error;
      setMeta(v => ({ ...v, [exerciseId!]: { exercise_type:draft.type, duration_seconds:duration, rest_seconds:rest, notes:draft.notes.trim() || null, image_path:imagePath } }));
      setFormOpen(false); setEditId(null); toast({ title: editId ? 'Exercise upgraded' : 'Exercise added', message:'Your workout configuration is saved.', type:'success' });
    } catch (err: any) { toast({ title:'Could not save exercise', message:err?.message ?? 'Please try again.', type:'error' }); }
    finally { setUploading(false); setSaving(false); }
  };
  const remove = async (id:string) => {
    if (saving) return;
    const path = meta[id]?.image_path;
    deleteExercise(dayId, id);
    await supabase.from('workout_exercise_meta').delete().eq('exercise_id', id).eq('day_id', dayId);
    if (path) await supabase.storage.from('workout-exercises').remove([path]);
    setMeta(v => { const n={...v}; delete n[id]; return n; }); setImageUrls(v => { const n={...v}; delete n[id]; return n; });
    toast({ title:'Exercise removed', type:'success' });
  };

  return <div className={`stryven-workout-v2 ${focus ? 'is-focus' : ''}`}>
    <header className="workout-v2-header"><div><div className="workout-v2-kicker">TRAINING SYSTEM / 2.0</div><h1 className="section-title">Workout Execution</h1><p className="text-sm text-ink-300">Plan precisely. Execute every set. Track the real session.</p></div><div className="workout-v2-header-actions"><button className="btn-ghost" onClick={() => setFocus(v=>!v)}>{focus ? <Minimize2 size={16}/> : <Maximize2 size={16}/>} {focus ? 'Exit Focus' : 'Focus Mode'}</button>{showExercises && <button className="btn-primary" onClick={openAdd} disabled={running}><Plus size={17}/> Add Exercise</button>}</div></header>
    <section className="workout-v2-card workout-v2-hero">
      <div className="workout-v2-modes">{MODES.map(m => <button key={m.id} onClick={() => switchMode(m.id)} disabled={running} className={`workout-v2-mode ${mode===m.id?'active':''}`}><span>{m.icon}</span><strong>{m.label}</strong></button>)}</div>
      <div className="workout-v2-timer"><div className="workout-v2-label">{MODES.find(m=>m.id===mode)?.label} SESSION</div><div className="workout-v2-clock">{formatTime(elapsed)}</div><div className="workout-v2-state">{running ? 'SESSION IN PROGRESS' : elapsed ? 'SESSION PAUSED' : 'READY'}</div></div>
      <div className="workout-v2-controls">{!running ? <button className="btn-primary" onClick={start}><Play size={18}/> {elapsed ? 'Resume' : 'Start Workout'}</button> : <button className="btn-ghost" onClick={pause}><Pause size={18}/> Pause</button>}<button className="btn-ghost" onClick={resetWorkout} disabled={!elapsed}><RotateCcw size={17}/> Reset</button><button className="btn-primary" onClick={finish} disabled={!startedAt || elapsed<=0 || saving}><Square size={16}/> {saving?'Saving…':'Finish & Save'}</button></div>
      {showExercises && <div className="workout-v2-overview"><div><span>EXERCISES</span><strong>{exercises.length}</strong></div><div><span>SETS</span><strong>{totalSets}</strong></div><div><span>EXERCISE TIME</span><strong>{exerciseTime ? formatShort(exerciseTime) : '—'}</strong></div><div><span>REST TIME</span><strong>{restTime ? formatShort(restTime) : '—'}</strong></div><button className="workout-v2-time-button" onClick={() => setShowEstimate(v=>!v)}><Clock3 size={16}/> {estimatedTime ? `Estimated ${formatShort(estimatedTime)}` : 'Workout Time'} </button></div>}
      {showEstimate && showExercises && <div className="workout-v2-estimate"><div><span>Timed exercises</span><strong>{exerciseTime ? formatShort(exerciseTime) : 'No fixed time'}</strong></div><div><span>Configured rests</span><strong>{restTime ? formatShort(restTime) : 'No rest timers'}</strong></div><div><span>Reps-based exercises</span><strong>No artificial timer</strong></div></div>}
    </section>
    {running && activeExercise && <section className="workout-v2-card workout-v2-active">
      <div className="workout-v2-active-top"><span>EXERCISE {exercises.findIndex(e=>e.id===activeExercise.id)+1} / {exercises.length}</span><span>SET {activeSet} / {activeExercise.sets}</span></div>
      <div className="workout-v2-active-grid">{imageUrls[activeExercise.id] ? <img className="workout-v2-active-image" src={imageUrls[activeExercise.id]} alt={activeExercise.name}/> : <div className="workout-v2-active-placeholder"><Dumbbell size={42}/><span>NO MEDIA</span></div>}<div className="workout-v2-active-info"><div className="workout-v2-kicker">CURRENT EXERCISE</div><h2>{activeExercise.name}</h2><div className="workout-v2-target">{activeMeta?.exercise_type==='time' && activeMeta.duration_seconds ? <><TimerReset size={18}/> {formatTime(activeMeta.duration_seconds)} target</> : <><Dumbbell size={18}/> {activeExercise.reps} reps</>}</div>{activeMeta?.notes && <p>{activeMeta.notes}</p>}{activeMeta?.exercise_type==='time' && activeMeta.duration_seconds ? <TimeExercise key={`${activeExercise.id}-${activeSet}-${activeMeta.duration_seconds}`} duration={activeMeta.duration_seconds} running={running && !restRunning}/> : <div className="workout-v2-reps-display">{activeExercise.reps}<small>REPS</small></div>}<div className="workout-v2-active-actions"><button className="btn-primary" onClick={completeSet}><Check size={17}/> {activeSet < activeExercise.sets ? 'Complete Set' : 'Complete Exercise'}</button><button className="btn-ghost" onClick={skipExercise}><SkipForward size={16}/> Skip</button></div></div></div>
      {restRunning && <div className="workout-v2-rest"><div><span>REST</span><strong>{formatTime(restRemaining)}</strong></div><button className="btn-ghost" onClick={()=>setRestRunning(v=>!v)}>{restRunning?<Pause size={16}/>:<Play size={16}/>} {restRunning?'Pause':'Resume'}</button><button className="btn-ghost" onClick={()=>{setRestRunning(false);setRestRemaining(0)}}>Skip Rest</button></div>}
    </section>}
    {!focus && showExercises && <><section className="workout-v2-card"><div className="workout-v2-section-head"><div><div className="workout-v2-kicker">CURRENT SPLIT</div><h2>{split?.name ?? `${mode} training`}</h2><p>{split?.description ?? 'Build and track your own session.'}</p></div><div className="workout-v2-progress-value">{completedSets}/{totalSets}</div></div><div className="workout-v2-progress"><span style={{width:`${progress}%`}}/></div></section>
      {(split?.sections ?? []).map(sec=>{const list=exercises.filter(e=>e.section===sec.type);if(!list.length)return null;return <section className="workout-v2-card" key={sec.type}><div className="workout-v2-section-title">{sec.name}<span>{list.filter(e=>e.completed).length}/{list.length}</span></div><div className="workout-v2-list">{list.map(e=>{const m=meta[e.id]??emptyMeta();return <div className={`workout-v2-exercise ${e.completed?'done':''}`} key={e.id}><button className="workout-v2-check" onClick={()=>toggleExercise(dayId,e.id)} aria-label={e.completed?'Mark incomplete':'Mark complete'}>{e.completed&&<Check size={15}/>}</button>{imageUrls[e.id]?<img className="workout-v2-thumb" src={imageUrls[e.id]} alt=""/>:<div className="workout-v2-thumb placeholder"><Dumbbell size={17}/></div>}<div className="workout-v2-exercise-copy"><strong>{e.name}</strong><span>{e.sets} sets × {m.exercise_type==='time'&&m.duration_seconds?`${formatTime(m.duration_seconds)} / set`:`${e.reps} reps`}{m.rest_seconds!==null?` • ${m.rest_seconds}s rest`:''}</span></div>{m.exercise_type==='time'&&<span className="workout-v2-type">TIME</span>}<button className="btn-ghost workout-v2-icon" onClick={()=>openEdit(e)} disabled={running}><Pencil size={15}/></button><button className="btn-ghost workout-v2-icon danger" onClick={()=>void remove(e.id)} disabled={running}><Trash2 size={15}/></button></div>})}</div></section>})}
      {!exercises.length&&<section className="workout-v2-card workout-v2-empty"><Dumbbell size={34}/><strong>No exercises yet</strong><span>Add your first exercise to this split.</span><button className="btn-primary" onClick={openAdd}><Plus size={16}/> Add Exercise</button></section>}
      {completed>0&&completed===exercises.length&&<div className="workout-v2-complete"><Trophy size={20}/><div><strong>Session plan complete</strong><span>Every exercise in this split is marked done.</span></div></div></>}
    {!focus&&<section className="workout-v2-card"><div className="workout-v2-section-title">Recent Sessions<span>{state.workoutSessions.length} total</span></div>{sessions.length?<div className="workout-v2-history">{sessions.map(s=><div key={s.id}><span className="history-type">{String(s.type).toUpperCase()}</span><span>{new Date(s.completedAt).toLocaleString()}</span><strong>{formatTime(s.durationSeconds)}</strong></div>)}</div>:<div className="workout-v2-empty compact"><Dumbbell size={26}/><span>No sessions logged yet.</span></div>}</section>}
    {formOpen&&<div className="workout-v2-modal" role="dialog" aria-modal="true"><div className="workout-v2-modal-card"><div className="workout-v2-section-title"><span>{editId?'Edit Exercise':'Add Exercise'}</span><button className="btn-ghost workout-v2-icon" onClick={()=>setFormOpen(false)}><X size={16}/></button></div><label>Name<input className="input" value={draft.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))} autoFocus/></label><div className="workout-v2-form-grid"><label>Sets<input className="input" type="number" min="1" max="50" value={draft.sets} onChange={e=>setDraft(d=>({...d,sets:Number(e.target.value)}))}/></label><label>Mode<select className="input" value={draft.type} onChange={e=>setDraft(d=>({...d,type:e.target.value as 'reps'|'time'}))}><option value="reps">Reps</option><option value="time">Time</option></select></label></div>{draft.type==='reps'?<label>Reps<input className="input" value={draft.reps} onChange={e=>setDraft(d=>({...d,reps:e.target.value}))} placeholder="10-12"/></label>:<label>Duration (seconds)<input className="input" type="number" min="1" value={draft.duration} onChange={e=>setDraft(d=>({...d,duration:e.target.value}))} placeholder="45"/></label>}<label>Rest after set (seconds)<input className="input" type="number" min="0" max="3600" value={draft.rest} onChange={e=>setDraft(d=>({...d,rest:e.target.value}))} placeholder="Optional"/></label>{!editId&&<label>Section<select className="input" value={draft.section} onChange={e=>setDraft(d=>({...d,section:e.target.value as typeof d.section}))}><option value="stretching">Stretching</option><option value="main">Main Training</option><option value="plyometric">Plyometric</option></select></label>}<label>Notes<textarea className="input workout-v2-notes" value={draft.notes} onChange={e=>setDraft(d=>({...d,notes:e.target.value}))} placeholder="Optional coaching notes..."/></label><div className="workout-v2-upload"><input ref={fileRef} hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e=>setDraft(d=>({...d,image:e.target.files?.[0]??null}))}/><button className="btn-ghost" onClick={()=>fileRef.current?.click()}><ImagePlus size={17}/> {draft.image?.name??'Upload image / GIF'}</button>{draft.image&&<span>{Math.round(draft.image.size/1024)} KB</span>}</div><div className="workout-v2-modal-actions"><button className="btn-ghost" onClick={()=>setFormOpen(false)}>Cancel</button><button className="btn-primary" onClick={()=>void save()} disabled={saving||uploading}><Check size={16}/> {saving?'Saving…':'Save Exercise'}</button></div></div></div>}
  </div>;
}

function TimeExercise({ duration, running }: { duration:number; running:boolean }) {
  const [started, setStarted] = useState<number|null>(null); const [remaining, setRemaining] = useState(duration);
  useEffect(()=>{ if(!running){ setStarted(null); return; } if(started===null) setStarted(Date.now()); const id=window.setInterval(()=>setRemaining(Math.max(0,duration-Math.floor((Date.now()-(started??Date.now()))/1000))),250); return()=>window.clearInterval(id); },[running,duration,started]);
  useEffect(()=>{ if(!running) setRemaining(duration); },[running,duration]);
  return <div className={`workout-v2-exercise-timer ${remaining===0?'finished':''}`}><Clock3 size={18}/><strong>{formatTime(remaining)}</strong><span>{remaining===0?'TIME COMPLETE':'TIME TARGET'}</span></div>;
}
