import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Archive, CheckCircle2, ChevronDown, ChevronUp, Circle, Clock3, Dumbbell, ImagePlus, Loader2, Pause, Play, Plus, RefreshCw, Save, ShieldCheck, Target, TimerReset, X } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { toast } from './ui/Toast';

type ExerciseType = 'reps' | 'weight_reps' | 'time' | 'distance' | 'hold' | 'custom';
type ExerciseRow = {
  id: string; user_id: string; name: string; muscle_group: string | null; equipment: string | null;
  category: string | null; instructions: string | null; notes: string | null; exercise_type: ExerciseType;
  image_path: string | null; archived: boolean; created_at: string; imageUrl?: string;
};
type RoutineRow = { id: string; user_id: string; name: string; description: string; archived: boolean };
type RoutineExerciseRow = {
  id: string; user_id: string; routine_id: string; exercise_id: string; sort_order: number;
  sets: number; rep_target: string; weight_target: number | null; duration_seconds: number | null;
  distance_target: number | null; rest_seconds: number; notes: string; configuration: Record<string, unknown>;
};
type SessionRow = {
  id: string; user_id: string; routine_id: string;
  status: 'STARTING' | 'ACTIVE' | 'RESTING' | 'PAUSED' | 'COMPLETING' | 'COMPLETED' | 'FAILED';
  started_at: string; paused_at: string | null; accumulated_pause_seconds: number; completed_at: string | null;
};
type SetRow = {
  id: string; session_id: string; user_id: string; routine_exercise_id: string; set_number: number;
  status: 'completed' | 'skipped'; reps: number | null; weight: number | null;
  duration_seconds: number | null; distance: number | null; notes: string; completed_at: string;
};
type SessionStateRow = {
  session_id: string; routine_exercise_id: string; current_set: number; phase: 'exercise' | 'rest';
  target_timestamp: string | null; paused: boolean; entered_values: InputValues;
};
type InputValues = { reps: string; weight: string; durationSeconds: string; distance: string; notes: string };
type SessionExercise = { config: RoutineExerciseRow; exercise: ExerciseRow };
type ActiveWorkout = {
  session: SessionRow; routine: RoutineRow; exercises: SessionExercise[]; sets: SetRow[];
  currentIndex: number; currentSet: number; phase: 'exercise' | 'rest'; targetTimestamp: string | null;
  enteredValues: InputValues;
};
type HistoryRow = { id: string; session_id: string; routine_name: string; started_at: string; completed_at: string; duration_seconds: number; exercises_completed: number; sets_completed: number };
type HistorySet = SetRow & { exercise_name: string };

const EMPTY_INPUTS: InputValues = { reps: '', weight: '', durationSeconds: '', distance: '', notes: '' };
const ACTIVE_STATUSES = ['STARTING', 'ACTIVE', 'RESTING', 'PAUSED', 'COMPLETING'];
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function firstRow<T>(data: unknown): T | null {
  if (Array.isArray(data)) return (data[0] as T | undefined) ?? null;
  return (data as T | null) ?? null;
}
function safeNumber(value: string): number | null {
  if (!value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}
function durationLabel(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const remainder = safe % 60;
  return hours ? `${hours}:${String(minutes).padStart(2,'0')}:${String(remainder).padStart(2,'0')}` : `${String(minutes).padStart(2,'0')}:${String(remainder).padStart(2,'0')}`;
}
function dateLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

export function TrainingCommand() {
  const { user } = useAuth();
  const { saveWorkoutSession } = useStore();
  const userId = user?.id;
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [historyDetails, setHistoryDetails] = useState<Record<string,HistorySet[]>>({});
  const [expandedHistoryId, setExpandedHistoryId] = useState<string|null>(null);
  const [loadingHistoryId, setLoadingHistoryId] = useState<string|null>(null);
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [routineName, setRoutineName] = useState('');
  const [configs, setConfigs] = useState<Record<string, { sets: number; repTarget: string; restSeconds: number }>>({});
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [exerciseForm, setExerciseForm] = useState({ name: '', muscleGroup: '', equipment: '', category: 'strength', instructions: '', notes: '', exerciseType: 'reps' as ExerciseType });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [inputs, setInputs] = useState<InputValues>(EMPTY_INPUTS);
  const [clockNow, setClockNow] = useState(Date.now());
  const restTransition = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const currentExercise = activeWorkout?.exercises[activeWorkout.currentIndex] ?? null;
  const currentSetCount = currentExercise ? activeWorkout!.sets.filter(item => item.routine_exercise_id === currentExercise.config.id && item.status === 'completed').length : 0;
  const elapsedSeconds = useMemo(() => {
    if (!activeWorkout) return 0;
    const started = new Date(activeWorkout.session.started_at).getTime();
    const pausedNow = activeWorkout.session.status === 'PAUSED' && activeWorkout.session.paused_at
      ? Math.max(0, Math.floor((clockNow - new Date(activeWorkout.session.paused_at).getTime()) / 1000)) : 0;
    return Math.max(0, Math.floor((clockNow - started) / 1000) - activeWorkout.session.accumulated_pause_seconds - pausedNow);
  }, [activeWorkout, clockNow]);
  const restRemaining = activeWorkout?.phase === 'rest' && activeWorkout.targetTimestamp && activeWorkout.session.status !== 'PAUSED'
    ? Math.max(0, Math.ceil((new Date(activeWorkout.targetTimestamp).getTime() - clockNow) / 1000)) : 0;
  const totalPlannedSets = activeWorkout?.exercises.reduce((sum,item)=>sum+item.config.sets,0) ?? 0;
  const totalLoggedSets = activeWorkout?.sets.filter(item=>item.status==='completed').length ?? 0;

  const signedExercise = useCallback(async (row: ExerciseRow): Promise<ExerciseRow> => {
    if (!row.image_path) return { ...row, imageUrl: undefined };
    try {
      const { data } = await supabase.storage.from('workout-exercises').createSignedUrl(row.image_path, 3600);
      return { ...row, imageUrl: data?.signedUrl };
    } catch { return { ...row, imageUrl: undefined }; }
  }, []);

  const hydrateSession = useCallback(async (session: SessionRow): Promise<ActiveWorkout | null> => {
    const { data: routineData, error: routineError } = await supabase.from('syrox_routines').select('*').eq('id', session.routine_id).eq('user_id', session.user_id).maybeSingle();
    if (routineError) throw routineError;
    const routine = routineData as RoutineRow | null;
    if (!routine) return null;
    const { data: configData, error: configError } = await supabase.from('syrox_routine_exercises').select('*').eq('routine_id', routine.id).eq('user_id', session.user_id).order('sort_order');
    if (configError) throw configError;
    const routineConfigs = (configData ?? []) as RoutineExerciseRow[];
    if (!routineConfigs.length) return null;
    const ids = routineConfigs.map(item=>item.exercise_id);
    const { data: exerciseData, error: exerciseError } = await supabase.from('syrox_user_exercises').select('*').eq('user_id',session.user_id).in('id',ids);
    if (exerciseError) throw exerciseError;
    const signed = await Promise.all(((exerciseData ?? []) as ExerciseRow[]).map(signedExercise));
    const exerciseMap = new Map(signed.map(item=>[item.id,item]));
    const joined = routineConfigs.map(config=>({config,exercise:exerciseMap.get(config.exercise_id)})).filter((item):item is SessionExercise=>Boolean(item.exercise));
    if (!joined.length) return null;
    const { data: setData, error: setError } = await supabase.from('syrox_workout_session_sets').select('*').eq('session_id',session.id).eq('user_id',session.user_id).order('completed_at');
    if (setError) throw setError;
    const { data: stateData, error: stateError } = await supabase.from('syrox_workout_session_state').select('*').eq('session_id',session.id).eq('user_id',session.user_id).maybeSingle();
    if (stateError) throw stateError;
    const saved = stateData as SessionStateRow | null;
    let currentIndex = saved ? Math.max(0,joined.findIndex(item=>item.config.id===saved.routine_exercise_id)) : 0;
    if (currentIndex < 0) currentIndex = 0;
    const sets = (setData ?? []) as SetRow[];
    let currentSet = saved?.current_set ?? 1;
    const alreadyLogged = sets.filter(item=>item.routine_exercise_id===joined[currentIndex].config.id && item.status==='completed').length;
    currentSet = Math.max(currentSet, alreadyLogged + 1);
    while (currentIndex < joined.length - 1 && sets.filter(item=>item.routine_exercise_id===joined[currentIndex].config.id && item.status==='completed').length >= joined[currentIndex].config.sets) {
      currentIndex += 1;
      currentSet = Math.max(1, sets.filter(item=>item.routine_exercise_id===joined[currentIndex].config.id && item.status==='completed').length + 1);
    }
    const allDone = joined.every(item=>sets.filter(set=>set.routine_exercise_id===item.config.id&&set.status==='completed').length>=item.config.sets);
    if (allDone) { currentIndex = joined.length - 1; currentSet = joined[currentIndex].config.sets; }
    const phase = allDone ? 'exercise' : (saved?.phase ?? 'exercise');
    return {
      session, routine, exercises: joined, sets, currentIndex, currentSet,
      phase, targetTimestamp: allDone ? null : (saved?.target_timestamp ?? null), enteredValues: { ...EMPTY_INPUTS, ...(saved?.entered_values ?? {}) }
    };
  }, [signedExercise]);

  const loadAll = useCallback(async (cancelled: () => boolean) => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [exerciseResult, historyResult, activeResult] = await Promise.all([
        supabase.from('syrox_user_exercises').select('*').eq('user_id',userId).eq('archived',false).order('created_at',{ascending:false}),
        supabase.from('syrox_workout_history').select('*').eq('user_id',userId).order('completed_at',{ascending:false}).limit(20),
        supabase.from('syrox_workout_sessions').select('*').eq('user_id',userId).in('status',ACTIVE_STATUSES).order('started_at',{ascending:false}).limit(1).maybeSingle()
      ]);
      if (exerciseResult.error) throw exerciseResult.error;
      if (historyResult.error) throw historyResult.error;
      if (activeResult.error) throw activeResult.error;
      const signed = await Promise.all(((exerciseResult.data ?? []) as ExerciseRow[]).map(signedExercise));
      if (cancelled()) return;
      setExercises(signed);
      setHistory((historyResult.data ?? []) as HistoryRow[]);
      const session = activeResult.data as SessionRow | null;
      if (session) {
        const hydrated = await hydrateSession(session);
        if (!cancelled()) setActiveWorkout(hydrated);
      } else if (!cancelled()) setActiveWorkout(null);
    } catch (error) {
      if (!cancelled()) toast({ title: 'Training data unavailable', message: error instanceof Error ? error.message : 'Could not load your saved training data.', type: 'error' });
    } finally { if (!cancelled()) setLoading(false); }
  }, [userId, signedExercise, hydrateSession]);

  const persistSessionState = useCallback(async (workout: ActiveWorkout, values: InputValues, paused = workout.session.status === 'PAUSED') => {
    const item = workout.exercises[Math.min(workout.currentIndex,workout.exercises.length-1)];
    if (!item) return;
    const { error } = await supabase.rpc('syrox_save_session_state', {
      p_session_id: workout.session.id,
      p_routine_exercise_id: item.config.id,
      p_current_set: Math.max(1,Math.min(50,workout.currentSet)),
      p_phase: workout.phase,
      p_target_timestamp: workout.targetTimestamp,
      p_paused: paused,
      p_entered_values: values
    });
    if (error) throw error;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadAll(() => cancelled);
    return () => { cancelled = true; };
  }, [loadAll]);

  const activeSessionId = activeWorkout?.session.id;
  useEffect(() => {
    if (!activeSessionId) return;
    const timer = window.setInterval(()=>setClockNow(Date.now()),1000);
    return ()=>window.clearInterval(timer);
  }, [activeSessionId]);

  useEffect(() => {
    if (!activeWorkout || activeWorkout.phase !== 'rest' || activeWorkout.session.status === 'PAUSED' || !activeWorkout.targetTimestamp || restRemaining > 0 || restTransition.current) return;
    restTransition.current = true;
    const next = { ...activeWorkout, phase: 'exercise' as const, targetTimestamp: null };
    void persistSessionState(next, EMPTY_INPUTS).then(()=>{
      setActiveWorkout(next);
      setInputs(EMPTY_INPUTS);
    }).catch(error=>{
      setActiveWorkout(next);
      setInputs(EMPTY_INPUTS);
      toast({title:'Rest timer advanced; checkpoint warning',message:error instanceof Error?error.message:'The timer state will be retried on your next action.',type:'error'});
    }).finally(()=>{restTransition.current=false;});
  }, [activeWorkout, restRemaining, persistSessionState]);

  useEffect(() => {
    const values = activeWorkout?.enteredValues;
    if (values) setInputs({ ...EMPTY_INPUTS, ...values });
  }, [activeWorkout?.session.id, activeWorkout?.currentIndex, activeWorkout?.currentSet, activeWorkout?.enteredValues]);

  useEffect(() => {
    if (!activeWorkout || activeWorkout.session.status === 'PAUSED') return;
    const timeout = window.setTimeout(() => {
      const checkpoint = { ...activeWorkout, enteredValues: inputs };
      void persistSessionState(checkpoint, inputs, false).catch(() => {
        // A later input, pause, or set completion will retry the checkpoint.
      });
    }, 550);
    return () => window.clearTimeout(timeout);
  }, [activeWorkout, inputs, persistSessionState]);

  function toggleSelected(exerciseId: string) {
    setSelectedIds(old=>old.includes(exerciseId)?old.filter(id=>id!==exerciseId):[...old,exerciseId]);
    setConfigs(old=>old[exerciseId]?old:{...old,[exerciseId]:{sets:3,repTarget:'8-12',restSeconds:60}});
  }

  async function startWorkout() {
    if (!userId || !selectedIds.length || busy) return;
    setBusy(true);
    let routineId: string | null = null;
    try {
      const name = routineName.trim() || `Manual Session · ${new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date())}`;
      const { data: routineData, error: routineError } = await supabase.from('syrox_routines').insert({user_id:userId,name,description:'Manually selected exercises',archived:false}).select('*').single();
      if (routineError) throw routineError;
      const routine = routineData as RoutineRow;
      routineId = routine.id;
      const payload = selectedIds.map((exerciseId,index)=>{
        const config = configs[exerciseId] ?? {sets:3,repTarget:'8-12',restSeconds:60};
        return {routine_id:routine.id,user_id:userId,exercise_id:exerciseId,sort_order:index,sets:Math.max(1,Math.min(50,Math.floor(config.sets)||1)),rep_target:config.repTarget.trim()||'8-12',rest_seconds:Math.max(0,Math.min(3600,Math.floor(config.restSeconds)||0)),configuration:{}};
      });
      const { data: routineExerciseData, error: routineExerciseError } = await supabase.from('syrox_routine_exercises').insert(payload).select('*');
      if (routineExerciseError) throw routineExerciseError;
      const { data: sessionData, error: sessionError } = await supabase.rpc('syrox_start_session',{p_routine_id:routine.id});
      if (sessionError) throw sessionError;
      const session = firstRow<SessionRow>(sessionData);
      if (!session) throw new Error('The database did not return a workout session.');
      if (session.routine_id !== routine.id) {
        await supabase.from('syrox_routine_exercises').delete().eq('routine_id',routine.id).eq('user_id',userId);
        await supabase.from('syrox_routines').delete().eq('id',routine.id).eq('user_id',userId);
        routineId = null;
        const existing = await hydrateSession(session);
        setActiveWorkout(existing);
        toast({title:'Resumed existing session',message:'An active session already existed, so it has been restored.',type:'success'});
        return;
      }
      const rowConfigs = (routineExerciseData ?? []) as RoutineExerciseRow[];
      const exerciseMap = new Map(exercises.map(item=>[item.id,item]));
      const joined = rowConfigs.map(config=>({config,exercise:exerciseMap.get(config.exercise_id)})).filter((item):item is SessionExercise=>Boolean(item.exercise));
      if (!joined.length) throw new Error('Could not match the selected exercises to the session.');
      const next: ActiveWorkout = {session,routine,exercises:joined,sets:[],currentIndex:0,currentSet:1,phase:'exercise',targetTimestamp:null,enteredValues:EMPTY_INPUTS};
      setActiveWorkout(next);
      setSelectedIds([]);
      setRoutineName('');
      await persistSessionState(next,EMPTY_INPUTS,false).catch(error=>toast({title:'Session started; resume checkpoint needs attention',message:error instanceof Error?error.message:'Checkpoint could not be saved.',type:'error'}));
      toast({title:'Training session started',message:'Your selected exercises are now active and saved.',type:'success'});
    } catch (error) {
      if (routineId && userId) {
        await supabase.from('syrox_routine_exercises').delete().eq('routine_id',routineId).eq('user_id',userId);
        await supabase.from('syrox_routines').delete().eq('id',routineId).eq('user_id',userId);
      }
      toast({title:'Could not start workout',message:error instanceof Error?error.message:'Please retry.',type:'error'});
    } finally { setBusy(false); }
  }

  async function logSet() {
    if (!activeWorkout || !currentExercise || !userId || busy) return;
    const type = currentExercise.exercise.exercise_type;
    if (['reps','weight_reps','custom'].includes(type) && safeNumber(inputs.reps) === null) {
      toast({title:'Enter actual reps',message:'Record the reps you completed before saving this set.',type:'error'}); return;
    }
    if (['time','hold'].includes(type) && safeNumber(inputs.durationSeconds) === null) {
      toast({title:'Enter actual duration',message:'Record the completed duration in seconds before saving this set.',type:'error'}); return;
    }
    if (type === 'distance' && safeNumber(inputs.distance) === null) {
      toast({title:'Enter actual distance',message:'Record the distance you completed before saving this set.',type:'error'}); return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc('syrox_complete_set', {
        p_session_id: activeWorkout.session.id,
        p_routine_exercise_id: currentExercise.config.id,
        p_set_number: activeWorkout.currentSet,
        p_reps: safeNumber(inputs.reps),
        p_weight: safeNumber(inputs.weight),
        p_duration_seconds: safeNumber(inputs.durationSeconds),
        p_distance: safeNumber(inputs.distance),
        p_notes: inputs.notes.trim(),
        p_configuration: { exercise_type: type },
        p_action_token: crypto.randomUUID()
      });
      if (error) throw error;
      const logged = firstRow<SetRow>(data);
      if (!logged) throw new Error('The database did not confirm the completed set.');
      const sets = [...activeWorkout.sets.filter(item=>!(item.routine_exercise_id===logged.routine_exercise_id&&item.set_number===logged.set_number)),logged];
      const finishedCurrentExercise = activeWorkout.currentSet >= currentExercise.config.sets;
      const nextIndex = finishedCurrentExercise ? Math.min(activeWorkout.currentIndex+1,activeWorkout.exercises.length-1) : activeWorkout.currentIndex;
      const isLastSet = finishedCurrentExercise && activeWorkout.currentIndex === activeWorkout.exercises.length-1;
      const nextSet = isLastSet ? currentExercise.config.sets : finishedCurrentExercise ? 1 : activeWorkout.currentSet+1;
      const restSeconds = currentExercise.config.rest_seconds;
      const shouldRest = !isLastSet && restSeconds > 0;
      const next: ActiveWorkout = {...activeWorkout,sets,currentIndex:nextIndex,currentSet:nextSet,phase:shouldRest?'rest':'exercise',targetTimestamp:shouldRest?new Date(Date.now()+restSeconds*1000).toISOString():null,enteredValues:EMPTY_INPUTS};
      setActiveWorkout(next);
      setInputs(EMPTY_INPUTS);
      try {
        await persistSessionState(next,EMPTY_INPUTS,false);
        toast({title:'Set recorded',message:`Set ${logged.set_number} saved to your workout history.`,type:'success'});
      } catch (checkpointError) {
        toast({title:'Set recorded; checkpoint warning',message:checkpointError instanceof Error?checkpointError.message:'Your set is saved; the resume checkpoint could not be updated.',type:'error'});
      }
    } catch (error) {
      toast({title:'Set was not confirmed',message:error instanceof Error?error.message:'Please retry. The session remains open.',type:'error'});
    } finally { setBusy(false); }
  }

  async function pauseWorkout() {
    if (!activeWorkout || !userId || busy || activeWorkout.session.status==='PAUSED') return;
    setBusy(true);
    const now = new Date();
    const restLeft = activeWorkout.phase==='rest' && activeWorkout.targetTimestamp ? Math.max(0,Math.ceil((new Date(activeWorkout.targetTimestamp).getTime()-now.getTime())/1000)) : 0;
    const next: ActiveWorkout = {...activeWorkout,session:{...activeWorkout.session,status:'PAUSED',paused_at:now.toISOString()},targetTimestamp:activeWorkout.phase==='rest'?new Date(now.getTime()+restLeft*1000).toISOString():activeWorkout.targetTimestamp,enteredValues:inputs};
    try {
      const { data, error } = await supabase.from('syrox_workout_sessions').update({status:'PAUSED',paused_at:now.toISOString()}).eq('id',activeWorkout.session.id).eq('user_id',userId).select('*').single();
      if (error) throw error;
      next.session = data as SessionRow;
      setActiveWorkout(next);
      try {
        await persistSessionState(next,inputs,true);
        toast({title:'Workout paused',message:'Your timer and current set are saved. Resume whenever you are ready.',type:'success'});
      } catch(checkpointError) {
        toast({title:'Workout paused; checkpoint warning',message:checkpointError instanceof Error?checkpointError.message:'The pause is saved, but the resume checkpoint needs attention.',type:'error'});
      }
    } catch(error) { toast({title:'Could not pause workout',message:error instanceof Error?error.message:'Please retry.',type:'error'}); }
    finally {setBusy(false);}
  }

  async function resumeWorkout() {
    if (!activeWorkout || !userId || busy || activeWorkout.session.status!=='PAUSED') return;
    setBusy(true);
    try {
      const now = new Date();
      const pausedSeconds = activeWorkout.session.paused_at ? Math.max(0,Math.floor((now.getTime()-new Date(activeWorkout.session.paused_at).getTime())/1000)) : 0;
      const { data, error } = await supabase.from('syrox_workout_sessions').update({status:'ACTIVE',paused_at:null,accumulated_pause_seconds:activeWorkout.session.accumulated_pause_seconds+pausedSeconds}).eq('id',activeWorkout.session.id).eq('user_id',userId).select('*').single();
      if (error) throw error;
      const next: ActiveWorkout = {...activeWorkout,session:data as SessionRow,enteredValues:inputs};
      setActiveWorkout(next);
      try {
        await persistSessionState(next,inputs,false);
        toast({title:'Workout resumed',type:'success'});
      } catch(checkpointError) {
        toast({title:'Workout resumed; checkpoint warning',message:checkpointError instanceof Error?checkpointError.message:'Your session is active, but the resume checkpoint could not be refreshed.',type:'error'});
      }
    } catch(error) { toast({title:'Could not resume workout',message:error instanceof Error?error.message:'Please retry.',type:'error'}); }
    finally {setBusy(false);}
  }

  async function finishWorkout() {
    if (!activeWorkout || !userId || busy) return;
    const allSetsDone = totalPlannedSets > 0 && totalLoggedSets >= totalPlannedSets;
    if (!allSetsDone && !window.confirm('Finish this session early? Only sets already saved will be recorded.')) return;
    setBusy(true);
    let finishConfirmed = false;
    try {
      let session = activeWorkout.session;
      if (session.status==='PAUSED' && session.paused_at) {
        const pausedSeconds = Math.max(0,Math.floor((Date.now()-new Date(session.paused_at).getTime())/1000));
        const {data,error}=await supabase.from('syrox_workout_sessions').update({accumulated_pause_seconds:session.accumulated_pause_seconds+pausedSeconds,paused_at:null}).eq('id',session.id).eq('user_id',userId).select('*').single();
        if(error) throw error;
        session=data as SessionRow;
        setActiveWorkout({...activeWorkout,session});
      }
      const {data,error}=await supabase.rpc('syrox_finish_session',{p_session_id:session.id});
      if(error) throw error;
      finishConfirmed = true;
      const result=firstRow<{status:string;duration_seconds?:number;sets_completed?:number;exercises_completed?:number}>(data);
      const duration=Number(result?.duration_seconds ?? elapsedSeconds);
      setActiveWorkout(null);
      setInputs(EMPTY_INPUTS);
      saveWorkoutSession('custom',Math.max(0,Math.floor(duration)));
      toast({title:'Workout saved',message:`${result?.sets_completed ?? totalLoggedSets} sets recorded. Your session is now in history.`,type:'success'});
      const archiveResult = await supabase.from('syrox_routines').update({archived:true}).eq('id',activeWorkout.routine.id).eq('user_id',userId);
      if (archiveResult.error) toast({title:'Workout saved; cleanup pending',message:'Your session is saved. The temporary routine could not be archived.',type:'error'});
      const {data:historyData,error:historyError}=await supabase.from('syrox_workout_history').select('*').eq('user_id',userId).order('completed_at',{ascending:false}).limit(20);
      if(historyError) toast({title:'Workout saved; history refresh pending',message:historyError.message,type:'error'});
      else setHistory((historyData??[]) as HistoryRow[]);
    } catch(error) {
      if (finishConfirmed) toast({title:'Workout saved; refresh warning',message:error instanceof Error?error.message:'The session is complete; some summary data could not refresh.',type:'error'});
      else toast({title:'Could not finish workout',message:error instanceof Error?error.message:'The session remains available to resume.',type:'error'});
    } finally {setBusy(false);}
  }

  async function toggleHistoryDetails(item: HistoryRow) {
    if (!userId) return;
    if (expandedHistoryId === item.id) { setExpandedHistoryId(null); return; }
    setExpandedHistoryId(item.id);
    if (historyDetails[item.id]) return;
    setLoadingHistoryId(item.id);
    try {
      const {data:setRows,error:setError}=await supabase.from('syrox_workout_session_sets').select('*').eq('session_id',item.session_id).eq('user_id',userId).order('set_number');
      if(setError) throw setError;
      const rows=(setRows??[]) as SetRow[];
      const configIds=[...new Set(rows.map(row=>row.routine_exercise_id))];
      const configResult=configIds.length?await supabase.from('syrox_routine_exercises').select('id,exercise_id').in('id',configIds):{data:[],error:null};
      if(configResult.error) throw configResult.error;
      const exerciseIds=[...new Set(((configResult.data??[]) as {id:string;exercise_id:string}[]).map(row=>row.exercise_id))];
      const exerciseResult=exerciseIds.length?await supabase.from('syrox_user_exercises').select('id,name').eq('user_id',userId).in('id',exerciseIds):{data:[],error:null};
      if(exerciseResult.error) throw exerciseResult.error;
      const nameMap=new Map(((exerciseResult.data??[]) as {id:string;name:string}[]).map(row=>[row.id,row.name]));
      const exerciseMap=new Map(((configResult.data??[]) as {id:string;exercise_id:string}[]).map(row=>[row.id,nameMap.get(row.exercise_id)??'Archived exercise']));
      setHistoryDetails(old=>({...old,[item.id]:rows.map(row=>({...row,exercise_name:exerciseMap.get(row.routine_exercise_id)??'Exercise'}))}));
    } catch(error) {
      toast({title:'Could not load set details',message:error instanceof Error?error.message:'Please retry.',type:'error'});
      setExpandedHistoryId(null);
    } finally {setLoadingHistoryId(null);}
  }

  function editExercise(exercise: ExerciseRow) {
    setEditingExerciseId(exercise.id);
    setExerciseForm({name:exercise.name,muscleGroup:exercise.muscle_group??'',equipment:exercise.equipment??'',category:exercise.category??'strength',instructions:exercise.instructions??'',notes:exercise.notes??'',exerciseType:exercise.exercise_type});
    setImageFile(null);
    setImagePreview(exercise.imageUrl??null);
    setShowExerciseForm(true);
  }
  function resetExerciseForm() {
    setEditingExerciseId(null);
    setExerciseForm({name:'',muscleGroup:'',equipment:'',category:'strength',instructions:'',notes:'',exerciseType:'reps'});
    setImageFile(null); setImagePreview(null);
    if(fileInput.current) fileInput.current.value='';
  }
  function onChooseImage(file?: File) {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type) || file.size > 5*1024*1024) {
      toast({title:'Image not accepted',message:'Choose JPG, PNG, WebP or GIF up to 5 MB.',type:'error'});
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function saveExercise() {
    if (!userId || !exerciseForm.name.trim() || busy) return;
    setBusy(true);
    let uploadedPath: string | null = null;
    try {
      let imagePath = editingExerciseId ? exercises.find(item=>item.id===editingExerciseId)?.image_path ?? null : null;
      if (imageFile) {
        const safeName=imageFile.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(-90);
        uploadedPath=`${userId}/${crypto.randomUUID()}-${safeName}`;
        const {error:uploadError}=await supabase.storage.from('workout-exercises').upload(uploadedPath,imageFile,{contentType:imageFile.type,upsert:false});
        if(uploadError) throw uploadError;
        imagePath=uploadedPath;
      }
      const values={user_id:userId,name:exerciseForm.name.trim(),muscle_group:exerciseForm.muscleGroup.trim()||null,equipment:exerciseForm.equipment.trim()||null,category:exerciseForm.category.trim()||null,instructions:exerciseForm.instructions.trim()||null,notes:exerciseForm.notes.trim()||null,exercise_type:exerciseForm.exerciseType,image_path:imagePath,archived:false};
      const result=editingExerciseId
        ? await supabase.from('syrox_user_exercises').update(values).eq('id',editingExerciseId).eq('user_id',userId).select('*').single()
        : await supabase.from('syrox_user_exercises').insert(values).select('*').single();
      if(result.error) throw result.error;
      const row=await signedExercise(result.data as ExerciseRow);
      setExercises(old=>editingExerciseId?old.map(item=>item.id===row.id?row:item):[row,...old]);
      if(imageFile&&editingExerciseId){
        const oldPath=exercises.find(item=>item.id===editingExerciseId)?.image_path;
        if(oldPath&&oldPath!==imagePath) await supabase.storage.from('workout-exercises').remove([oldPath]);
      }
      setShowExerciseForm(false);resetExerciseForm();
      toast({title:editingExerciseId?'Exercise updated':'Exercise added',message:'Your exercise library has been saved.',type:'success'});
    } catch(error) {
      if(uploadedPath) await supabase.storage.from('workout-exercises').remove([uploadedPath]);
      toast({title:'Could not save exercise',message:error instanceof Error?error.message:'Please retry.',type:'error'});
    } finally {setBusy(false);}
  }

  async function archiveExercise(exercise: ExerciseRow) {
    if (!userId || busy) return;
    if (!window.confirm(`Archive “${exercise.name}”? Existing workout history will be preserved.`)) return;
    setBusy(true);
    try {
      const {error}=await supabase.from('syrox_user_exercises').update({archived:true}).eq('id',exercise.id).eq('user_id',userId);
      if(error) throw error;
      setExercises(old=>old.filter(item=>item.id!==exercise.id));
      setSelectedIds(old=>old.filter(id=>id!==exercise.id));
      toast({title:'Exercise archived',message:'Existing sessions and history were preserved.',type:'success'});
    } catch(error) {toast({title:'Could not archive exercise',message:error instanceof Error?error.message:'Please retry.',type:'error'});}
    finally {setBusy(false);}
  }

  const paused = activeWorkout?.session.status==='PAUSED';
  const exerciseFormContent = showExerciseForm && <div className="sv-training-form-wrap"><form className="sv-training-form" onSubmit={event=>{event.preventDefault();void saveExercise();}}>
    <div className="sv-section-head"><div><span className="sv-eyebrow">{editingExerciseId?'EDIT EXERCISE':'EXERCISE LIBRARY'}</span><h2>{editingExerciseId?'Update exercise':'Add exercise'}</h2><p>Saved to your private exercise library.</p></div><button type="button" onClick={()=>{setShowExerciseForm(false);resetExerciseForm();}} aria-label="Close exercise form"><X size={18}/></button></div>
    <label>Exercise name<input value={exerciseForm.name} onChange={e=>setExerciseForm(s=>({...s,name:e.target.value}))} maxLength={120} required placeholder="e.g. Push-up"/></label>
    <div className="sv-training-form-grid"><label>Muscle group<input value={exerciseForm.muscleGroup} onChange={e=>setExerciseForm(s=>({...s,muscleGroup:e.target.value}))} placeholder="Chest, back, legs…"/></label><label>Equipment<input value={exerciseForm.equipment} onChange={e=>setExerciseForm(s=>({...s,equipment:e.target.value}))} placeholder="Bodyweight, dumbbell…"/></label></div>
    <div className="sv-training-form-grid"><label>Category<select value={exerciseForm.category} onChange={e=>setExerciseForm(s=>({...s,category:e.target.value}))}><option value="strength">Strength</option><option value="cardio">Cardio</option><option value="mobility">Mobility</option><option value="flexibility">Flexibility</option><option value="plyometric">Plyometric</option><option value="rehabilitation">Rehabilitation</option><option value="custom">Custom</option></select></label><label>Tracking type<select value={exerciseForm.exerciseType} onChange={e=>setExerciseForm(s=>({...s,exerciseType:e.target.value as ExerciseType}))}><option value="reps">Reps</option><option value="weight_reps">Weight + reps</option><option value="time">Time</option><option value="distance">Distance</option><option value="hold">Hold</option><option value="custom">Custom</option></select></label></div>
    <label>Instructions<textarea rows={2} value={exerciseForm.instructions} onChange={e=>setExerciseForm(s=>({...s,instructions:e.target.value}))} maxLength={2000} placeholder="Technique cues and form notes"/></label>
    <label>Notes<textarea rows={2} value={exerciseForm.notes} onChange={e=>setExerciseForm(s=>({...s,notes:e.target.value}))} maxLength={2000} placeholder="Optional private notes"/></label>
    <div className="sv-training-image-upload"><div><ImagePlus size={18}/><b>Exercise image</b><small>Private upload · JPG, PNG, WebP or GIF · max 5 MB</small></div><input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e=>onChooseImage(e.target.files?.[0])}/>{imagePreview&&<img src={imagePreview} alt="Exercise preview"/>}</div>
    <div className="sv-training-form-actions"><button type="button" className="sv-btn sv-btn--ghost" onClick={()=>{setShowExerciseForm(false);resetExerciseForm();}}>Cancel</button><button type="submit" className="sv-btn sv-btn--primary" disabled={busy||!exerciseForm.name.trim()}>{busy?<Loader2 className="animate-spin" size={15}/>:<Save size={15}/>} {editingExerciseId?'Save exercise':'Add to library'}</button></div>
  </form></div>;

  return <div className="sv-command sv-training-page">
    <header className="sv-module-header"><div><p className="sv-eyebrow"><Dumbbell size={14}/> STRYVEN / TRAINING CHAMBER</p><h1>Training</h1><p>Select your exercises, configure your sets, and record only the performance you complete.</p></div><div className="sv-identity-rank"><ShieldCheck size={16}/><b>{activeWorkout?paused?'SESSION PAUSED':'SESSION ACTIVE':'READY'}</b></div></header>

    {activeWorkout ? <section className="sv-section sv-surface sv-active-workout">
      <div className="sv-section-head"><div><span className="sv-eyebrow">ACTIVE WORKOUT // SAVED SESSION</span><h2>{activeWorkout.routine.name}</h2><p>Started {dateLabel(activeWorkout.session.started_at)}</p></div><div className="sv-session-live">{paused?'PAUSED':activeWorkout.phase==='rest'?'RESTING':'IN PROGRESS'}</div></div>
      <div className="sv-workout-timer-grid"><div className="sv-workout-clock"><Clock3 size={17}/><small>SESSION TIMER</small><strong>{durationLabel(elapsedSeconds)}</strong><span>{paused?'Timer paused':activeWorkout.phase==='rest'?'Rest interval running':'Training time excluding pauses'}</span></div><div className="sv-workout-clock is-rest"><TimerReset size={17}/><small>REST TIMER</small><strong>{durationLabel(restRemaining)}</strong><span>{activeWorkout.phase==='rest'?'Until next set':'Ready for your next rest interval'}</span></div></div>
      <div className="sv-workout-progress-line"><div><span>LOGGED SETS</span><b>{totalLoggedSets}/{totalPlannedSets}</b></div><div className="sv-page-progress"><span style={{width:`${totalPlannedSets?Math.min(100,totalLoggedSets/totalPlannedSets*100):0}%`}}/></div></div>
      {currentExercise ? <div className="sv-current-exercise">
        <div className="sv-current-exercise-head"><span className="sv-eyebrow">CURRENT EXERCISE / {activeWorkout.currentIndex+1} OF {activeWorkout.exercises.length}</span><span className="sv-set-counter">SET {activeWorkout.currentSet} / {currentExercise.config.sets}</span></div>
        <div className="sv-current-exercise-info">{currentExercise.exercise.imageUrl&&<img src={currentExercise.exercise.imageUrl} alt={currentExercise.exercise.name}/>}<div><h3>{currentExercise.exercise.name}</h3><p>{currentExercise.exercise.muscle_group||currentExercise.exercise.category||'Exercise'} · {currentExercise.exercise.equipment||'Equipment not specified'}</p><strong>{currentExercise.config.sets} sets × {currentExercise.config.rep_target}</strong></div></div>
        {activeWorkout.phase==='rest'&&<div className="sv-rest-banner"><TimerReset size={18}/><div><b>Rest interval</b><span>Next set begins when the timer reaches zero. You can skip the remaining rest.</span></div><button type="button" onClick={()=>{const next={...activeWorkout,phase:'exercise' as const,targetTimestamp:null};void persistSessionState(next,inputs,false).then(()=>setActiveWorkout(next)).catch(error=>toast({title:'Could not skip rest',message:error instanceof Error?error.message:'Please retry.',type:'error'}));}}>Skip rest</button></div>}
        <div className="sv-set-input-grid">
          {currentExercise.exercise.exercise_type==='reps'||currentExercise.exercise.exercise_type==='weight_reps'||currentExercise.exercise.exercise_type==='custom' ? <label>Actual reps<input type="number" min="0" max="9999" inputMode="numeric" value={inputs.reps} onChange={e=>setInputs(s=>({...s,reps:e.target.value}))} placeholder="Completed reps" disabled={paused||activeWorkout.phase==='rest'}/></label>:null}
          {currentExercise.exercise.exercise_type==='weight_reps'&&<label>Weight<input type="number" min="0" step="0.25" value={inputs.weight} onChange={e=>setInputs(s=>({...s,weight:e.target.value}))} placeholder="kg / load" disabled={paused||activeWorkout.phase==='rest'}/></label>}
          {(currentExercise.exercise.exercise_type==='time'||currentExercise.exercise.exercise_type==='hold')&&<label>Actual duration (sec)<input type="number" min="0" value={inputs.durationSeconds} onChange={e=>setInputs(s=>({...s,durationSeconds:e.target.value}))} placeholder="Seconds held" disabled={paused||activeWorkout.phase==='rest'}/></label>}
          {currentExercise.exercise.exercise_type==='distance'&&<label>Distance<input type="number" min="0" step="0.1" value={inputs.distance} onChange={e=>setInputs(s=>({...s,distance:e.target.value}))} placeholder="Distance" disabled={paused||activeWorkout.phase==='rest'}/></label>}
          <label className="sv-set-notes">Set notes<input value={inputs.notes} onChange={e=>setInputs(s=>({...s,notes:e.target.value}))} maxLength={500} placeholder="How did the set feel?" disabled={paused||activeWorkout.phase==='rest'}/></label>
        </div>
        <div className="sv-current-exercise-actions"><button type="button" className="sv-btn sv-btn--primary" onClick={()=>void logSet()} disabled={busy||paused||activeWorkout.phase==='rest'||(currentSetCount>=currentExercise.config.sets)}>{busy?<Loader2 className="animate-spin" size={15}/>:<CheckCircle2 size={15}/>} Log completed set</button><span>{currentSetCount} set(s) saved for this exercise</span></div>
        <div className="sv-workout-exercise-list">{activeWorkout.exercises.map((item,index)=>{const done=activeWorkout.sets.filter(set=>set.routine_exercise_id===item.config.id&&set.status==='completed').length;return <div key={item.config.id} className={index===activeWorkout.currentIndex?'is-current':''}><span>{done>=item.config.sets?<CheckCircle2 size={16}/>:<Circle size={16}/>}</span><div><b>{item.exercise.name}</b><small>{done}/{item.config.sets} sets saved</small></div>{index===activeWorkout.currentIndex&&<i>CURRENT</i>}</div>})}</div>
      </div>:<div className="sv-empty-record">No exercise configuration is attached to this session. Refresh the page or contact support before discarding it.</div>}
      <div className="sv-active-workout-footer"><button type="button" className="sv-btn sv-btn--ghost" onClick={()=>void (paused?resumeWorkout():pauseWorkout())} disabled={busy}>{busy?<Loader2 className="animate-spin" size={15}/>:paused?<Play size={15}/>:<Pause size={15}/>} {paused?'Resume session':'Pause session'}</button><button type="button" className="sv-btn sv-btn--danger" onClick={()=>void finishWorkout()} disabled={busy}>{busy?<Loader2 className="animate-spin" size={15}/>:<CheckCircle2 size={15}/>} {totalLoggedSets>=totalPlannedSets&&totalPlannedSets>0?'Finish workout':'Finish early & save'}</button></div>
    </section> : <section className="sv-section sv-surface">
      <div className="sv-section-head"><div><span className="sv-eyebrow">SESSION BUILDER</span><h2>Build your workout</h2><p>Choose exercises yourself. Nothing starts until you select and confirm the session.</p></div><Target size={18}/></div>
      <label className="sv-routine-name">SESSION NAME<input value={routineName} onChange={e=>setRoutineName(e.target.value)} maxLength={120} placeholder="e.g. Upper body strength"/></label>
      <div className="sv-training-builder-toolbar"><div><b>{selectedIds.length} selected</b><span>{exercises.length} exercises in your private library</span></div><button type="button" className="sv-btn sv-btn--ghost" onClick={()=>{resetExerciseForm();setShowExerciseForm(v=>!v);}}><Plus size={15}/> Add exercise</button></div>
      {loading ? <div className="sv-empty-record"><Loader2 className="animate-spin inline-block mr-2" size={15}/>LOADING YOUR SAVED EXERCISES</div> : exercises.length ? <div className="sv-training-library">{exercises.map(exercise=>{
        const selected=selectedIds.includes(exercise.id);
        const config=configs[exercise.id]??{sets:3,repTarget:'8-12',restSeconds:60};
        return <article key={exercise.id} className={`sv-library-exercise ${selected?'is-selected':''}`}>
          <button type="button" className="sv-library-select" onClick={()=>toggleSelected(exercise.id)} aria-pressed={selected} aria-label={selected?'Remove from workout':'Select exercise'}>{selected?<CheckCircle2 size={20}/>:<Circle size={20}/>}</button>
          {exercise.imageUrl?<img className="sv-library-image" src={exercise.imageUrl} alt={exercise.name}/>:<div className="sv-library-image sv-library-image-empty"><Dumbbell size={20}/></div>}
          <div className="sv-library-copy"><b>{exercise.name}</b><small>{exercise.muscle_group||exercise.category||'Exercise'} · {exercise.equipment||'Equipment not specified'}</small><span>{exercise.exercise_type.replace('_',' + ')}</span></div>
          <div className="sv-library-actions"><button type="button" onClick={()=>editExercise(exercise)} aria-label={`Edit ${exercise.name}`}><Save size={14}/></button><button type="button" onClick={()=>void archiveExercise(exercise)} aria-label={`Archive ${exercise.name}`}><Archive size={14}/></button></div>
          {selected&&<div className="sv-library-config"><label>Sets<input type="number" min="1" max="50" value={config.sets} onChange={e=>setConfigs(old=>({...old,[exercise.id]:{...config,sets:Math.max(1,Math.min(50,Number(e.target.value)||1))}}))}/></label><label>Rep / target<input value={config.repTarget} maxLength={40} onChange={e=>setConfigs(old=>({...old,[exercise.id]:{...config,repTarget:e.target.value}}))}/></label><label>Rest sec<input type="number" min="0" max="3600" value={config.restSeconds} onChange={e=>setConfigs(old=>({...old,[exercise.id]:{...config,restSeconds:Math.max(0,Math.min(3600,Number(e.target.value)||0))}}))}/></label></div>}
        </article>;
      })}</div> : <div className="sv-training-empty"><Dumbbell size={28}/><b>Your exercise library is empty</b><span>Add your first exercise, then select it to build a session.</span><button type="button" className="sv-btn sv-btn--primary" onClick={()=>{resetExerciseForm();setShowExerciseForm(true);}}><Plus size={15}/> Add first exercise</button></div>}
      <div className="sv-start-session-bar"><div><small>SESSION LOADOUT</small><b>{selectedIds.length} exercises selected</b><span>Session and exercise data are saved to your account.</span></div><button type="button" className="sv-btn sv-btn--primary" onClick={()=>void startWorkout()} disabled={busy||loading||selectedIds.length===0}>{busy?<Loader2 className="animate-spin" size={15}/>:<Play size={15}/>} Start session</button></div>
    </section>}

    {exerciseFormContent}
    <section className="sv-section sv-surface"><div className="sv-section-head"><div><span className="sv-eyebrow">SESSION ARCHIVE</span><h2>Workout History</h2><p>Completed sessions saved by the workout database.</p></div><button type="button" className="sv-btn sv-btn--ghost" onClick={()=>void loadAll(()=>false)} disabled={loading}><RefreshCw size={14}/> Refresh</button></div>
      {history.length ? <div className="sv-training-history">{history.map(item=><div className="sv-history-record" key={item.id}><article><button type="button" className="sv-training-history-main" onClick={()=>void toggleHistoryDetails(item)} aria-expanded={expandedHistoryId===item.id}><span className="sv-training-history-icon"><Activity size={17}/></span><span className="sv-training-history-copy"><b>{item.routine_name}</b><span>{dateLabel(item.completed_at)}</span><small>{item.exercises_completed} exercises · {item.sets_completed} sets</small></span>{loadingHistoryId===item.id?<Loader2 size={14} className="animate-spin"/>:expandedHistoryId===item.id?<ChevronUp size={15}/>:<ChevronDown size={15}/>}</button><strong>{durationLabel(item.duration_seconds)}</strong></article>{expandedHistoryId===item.id&&<div className="sv-training-history-details">{(historyDetails[item.id]??[]).length ? historyDetails[item.id]!.map(set=><div key={set.id}><b>{set.exercise_name}</b><span>SET {set.set_number}</span><strong>{set.reps!==null?`${set.reps} reps`:set.duration_seconds!==null?`${set.duration_seconds}s`:set.distance!==null?`${set.distance} distance`:'Completed'}</strong>{set.weight!==null&&<small>{set.weight} weight</small>}{set.notes&&<small>{set.notes}</small>}</div>) : <p>No set details were recorded for this session.</p>}</div>}</div>)}</div> : <div className="sv-empty-record">NO COMPLETED WORKOUTS SAVED YET. YOUR FINISHED SESSIONS WILL APPEAR HERE.</div>}
    </section>
  </div>;
}
