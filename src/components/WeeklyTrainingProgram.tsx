import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, ChevronRight, Dumbbell, Loader2, Play, Save, ShieldCheck } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { toast } from './ui/Toast';

type ExerciseType = 'reps' | 'weight_reps' | 'time' | 'distance' | 'hold' | 'custom';
type ExerciseRow = {
  id: string;
  user_id: string;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
  category: string | null;
  exercise_type: ExerciseType;
  archived: boolean;
};
type ProgramExercise = { exerciseId: string; sets: number; repTarget: string; restSeconds: number };
type ProgramDay = { dayNumber: number; name: string; description: string; exercises: ProgramExercise[] };
type LegacyExercise = { name?: string; sets?: number; reps?: string; section?: string };
const DAY_NAMES = ['Push', 'Pull', 'Legs', 'Upper Body', 'Lower Body', 'Full Body'];
const PLACEHOLDERS = new Set(['dynamic stretching', 'main strength exercise', 'plyometric drill']);

function makeEmptyDays(): ProgramDay[] {
  return DAY_NAMES.map((name, index) => ({ dayNumber: index + 1, name: name, description: '', exercises: [] }));
}
function parseStoredDays(value: unknown): unknown[] {
  let parsed = value;
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed); } catch { return []; }
  }
  return Array.isArray(parsed) ? parsed : [];
}
function clampSets(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(1, Math.min(50, Math.floor(number))) : 3;
}
function clampRest(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(3600, Math.floor(number))) : 60;
}
function firstRow<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return (value as T | null) ?? null;
}
function isCanonicalDays(days: unknown[]): boolean {
  return days.length > 0 && days.every((day) => {
    if (!day || typeof day !== 'object') return false;
    const item = day as Record<string, unknown>;
    return Number.isFinite(Number(item.dayNumber)) && Array.isArray(item.exercises);
  });
}

export function WeeklyTrainingProgram() {
  const { user } = useAuth();
  const userId = user?.id;
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [days, setDays] = useState<ProgramDay[]>(makeEmptyDays);
  const [selectedDay, setSelectedDay] = useState(1);
  const [draftName, setDraftName] = useState(DAY_NAMES[0]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [configs, setConfigs] = useState<Record<string, { sets: number; repTarget: string; restSeconds: number }>>({});

  const activeDay = days.find((day) => day.dayNumber === selectedDay) ?? days[0];
  const plannedExerciseCount = useMemo(() => days.reduce((sum, day) => sum + day.exercises.length, 0), [days]);
  const totalSets = useMemo(() => days.reduce((sum, day) => sum + day.exercises.reduce((daySum, item) => daySum + item.sets, 0), 0), [days]);

  useEffect(() => {
    const day = days.find((item) => item.dayNumber === selectedDay);
    if (!day) return;
    setDraftName(day.name);
    setSelectedIds(day.exercises.map((item) => item.exerciseId));
    setConfigs(Object.fromEntries(day.exercises.map((item) => [item.exerciseId, {
      sets: item.sets, repTarget: item.repTarget, restSeconds: item.restSeconds
    }])));
  }, [days, selectedDay]);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;
    async function loadProgram() {
      setLoading(true);
      try {
        const [libraryResult, planResult] = await Promise.all([
          supabase.from('syrox_user_exercises').select('id,user_id,name,muscle_group,equipment,category,exercise_type,archived').eq('user_id', userId).eq('archived', false).order('name'),
          supabase.from('workout_plans').select('days').eq('user_id', userId).maybeSingle()
        ]);
        if (libraryResult.error) throw libraryResult.error;
        if (planResult.error) throw planResult.error;
        let library = (libraryResult.data ?? []) as ExerciseRow[];
        const stored = parseStoredDays(planResult.data?.days);

        if (isCanonicalDays(stored)) {
          const normalized = makeEmptyDays().map((fallback) => {
            const raw = stored.find((item) => Number((item as Record<string, unknown>).dayNumber) === fallback.dayNumber) as Record<string, unknown> | undefined;
            if (!raw) return fallback;
            const rawExercises = Array.isArray(raw.exercises) ? raw.exercises : [];
            const validExercises = rawExercises.map((entry) => {
              const exercise = entry as Record<string, unknown>;
              const exerciseId = typeof exercise.exerciseId === 'string' ? exercise.exerciseId : '';
              if (!exerciseId || !library.some((item) => item.id === exerciseId)) return null;
              return { exerciseId, sets: clampSets(exercise.sets), repTarget: String(exercise.repTarget ?? '8-12'), restSeconds: clampRest(exercise.restSeconds) };
            }).filter((item): item is ProgramExercise => Boolean(item));
            return { dayNumber: fallback.dayNumber, name: String(raw.name || fallback.name).slice(0, 80), description: String(raw.description || ''), exercises: validExercises };
          });
          if (!cancelled) setDays(normalized);
        } else if (stored.length) {
          // Recover the previous six-day plan. Old entries were saved as names and local IDs,
          // so match them to the cloud library or safely import missing exercises before conversion.
          const byName = new Map(library.map((item) => [item.name.trim().toLocaleLowerCase(), item]));
          const recovered = makeEmptyDays();
          for (let index = 0; index < recovered.length; index += 1) {
            const legacyDay = stored[index] as { name?: string; exercises?: LegacyExercise[] } | undefined;
            if (!legacyDay) continue;
            recovered[index].name = String(legacyDay.name || recovered[index].name).slice(0, 80);
            for (const legacyExercise of Array.isArray(legacyDay.exercises) ? legacyDay.exercises : []) {
              const name = typeof legacyExercise.name === 'string' ? legacyExercise.name.trim() : '';
              if (!name || PLACEHOLDERS.has(name.toLocaleLowerCase())) continue;
              let exercise = byName.get(name.toLocaleLowerCase());
              if (!exercise) {
                const reps = String(legacyExercise.reps || '8-12');
                const isTimed = /\b(min|mins|minute|minutes|sec|secs|second|seconds)\b/i.test(reps);
                const inserted = await supabase.from('syrox_user_exercises').insert({
                  user_id: userId, name, muscle_group: null, equipment: null,
                  category: legacyExercise.section || 'strength', instructions: null,
                  notes: 'Recovered from your saved six-day training program.',
                  exercise_type: isTimed ? 'time' : 'reps', image_path: null, archived: false
                }).select('id,user_id,name,muscle_group,equipment,category,exercise_type,archived').single();
                if (inserted.error) throw inserted.error;
                exercise = inserted.data as ExerciseRow;
                byName.set(name.toLocaleLowerCase(), exercise);
                library = [...library, exercise];
              }
              recovered[index].exercises.push({
                exerciseId: exercise.id,
                sets: clampSets(legacyExercise.sets),
                repTarget: String(legacyExercise.reps || '8-12').slice(0, 40),
                restSeconds: 60
              });
            }
          }
          const { error: migrationError } = await supabase.from('workout_plans').upsert({
            user_id: userId, days: recovered, updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
          if (migrationError) throw migrationError;
          if (!cancelled) {
            setExercises(library);
            setDays(recovered);
            toast({ title: 'Your six-day plan was recovered', message: 'Previous exercise names, sets and targets were transferred into the new program.', type: 'success' });
          }
        } else {
          if (!cancelled) setDays(makeEmptyDays());
        }
        if (!cancelled) setExercises(library);
      } catch (error) {
        if (!cancelled) toast({ title: 'Weekly program could not load', message: error instanceof Error ? error.message : 'Your saved program was left unchanged. Please retry.', type: 'error' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadProgram();
    return () => { cancelled = true; };
  }, [userId]);

  function toggleExercise(exerciseId: string) {
    setSelectedIds((current) => current.includes(exerciseId) ? current.filter((id) => id !== exerciseId) : [...current, exerciseId]);
    setConfigs((current) => current[exerciseId] ? current : { ...current, [exerciseId]: { sets: 3, repTarget: '8-12', restSeconds: 60 } });
  }

  function makeDraftDay(): ProgramDay {
    return {
      dayNumber: selectedDay,
      name: draftName.trim().slice(0, 80) || 'Day ' + selectedDay,
      description: activeDay?.description ?? '',
      exercises: selectedIds.map((exerciseId) => {
        const config = configs[exerciseId] ?? { sets: 3, repTarget: '8-12', restSeconds: 60 };
        return { exerciseId, sets: clampSets(config.sets), repTarget: String(config.repTarget || '8-12').slice(0, 40), restSeconds: clampRest(config.restSeconds) };
      })
    };
  }

  async function persistDay(): Promise<ProgramDay[]> {
    if (!userId) throw new Error('Sign in to save your weekly program.');
    const draft = makeDraftDay();
    const updated = makeEmptyDays().map((fallback) => fallback.dayNumber === selectedDay ? draft : (days.find((day) => day.dayNumber === fallback.dayNumber) ?? fallback));
    const { error } = await supabase.from('workout_plans').upsert({
      user_id: userId, days: updated, updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
    if (error) throw error;
    setDays(updated);
    return updated;
  }

  async function saveDay() {
    if (busy) return;
    setBusy(true);
    try {
      await persistDay();
      toast({ title: 'Training day saved', message: 'Day ' + selectedDay + ' is saved to your account.', type: 'success' });
    } catch (error) {
      toast({ title: 'Could not save this day', message: error instanceof Error ? error.message : 'Please retry.', type: 'error' });
    } finally { setBusy(false); }
  }

  async function startDay() {
    if (!userId || busy) return;
    setBusy(true);
    let routineId: string | null = null;
    try {
      const updatedDays = await persistDay();
      const day = updatedDays.find((item) => item.dayNumber === selectedDay);
      if (!day || !day.exercises.length) throw new Error('Add at least one exercise to this day before starting it.');
      const activeResult = await supabase.from('syrox_workout_sessions').select('id,routine_id').eq('user_id', userId).in('status', ['STARTING', 'ACTIVE', 'RESTING', 'PAUSED', 'COMPLETING']).order('started_at', { ascending: false }).limit(1).maybeSingle();
      if (activeResult.error) throw activeResult.error;
      if (activeResult.data) throw new Error('Finish or resume your active workout before starting another session.');
      const missing = day.exercises.filter((item) => !exercises.some((exercise) => exercise.id === item.exerciseId));
      if (missing.length) throw new Error('One or more saved exercises are no longer in your active library. Edit this day and choose available exercises.');
      const routineResult = await supabase.from('syrox_routines').insert({
        user_id: userId, name: day.name + ' · Day ' + day.dayNumber,
        description: 'Weekly Program · Day ' + day.dayNumber, archived: false
      }).select('*').single();
      if (routineResult.error) throw routineResult.error;
      routineId = routineResult.data.id;
      const payload = day.exercises.map((item, index) => ({
        routine_id: routineId, user_id: userId, exercise_id: item.exerciseId, sort_order: index,
        sets: item.sets, rep_target: item.repTarget, rest_seconds: item.restSeconds, configuration: { program_day_number: day.dayNumber }
      }));
      const configResult = await supabase.from('syrox_routine_exercises').insert(payload);
      if (configResult.error) throw configResult.error;
      const sessionResult = await supabase.rpc('syrox_start_session', { p_routine_id: routineId });
      if (sessionResult.error) throw sessionResult.error;
      const session = firstRow<{ id: string; routine_id: string }>(sessionResult.data);
      if (!session) throw new Error('The database did not confirm the new workout session.');
      if (session.routine_id !== routineId) {
        await supabase.from('syrox_routine_exercises').delete().eq('routine_id', routineId).eq('user_id', userId);
        await supabase.from('syrox_routines').delete().eq('id', routineId).eq('user_id', userId);
        routineId = null;
        throw new Error('Another active session was found. It has not been replaced.');
      }
      toast({ title: 'Weekly session started', message: day.name + ' is ready. Loading the workout timer…', type: 'success' });
      window.setTimeout(() => window.location.reload(), 450);
    } catch (error) {
      if (routineId) {
        await supabase.from('syrox_routine_exercises').delete().eq('routine_id', routineId).eq('user_id', userId);
        await supabase.from('syrox_routines').delete().eq('id', routineId).eq('user_id', userId);
      }
      toast({ title: 'Could not start this day', message: error instanceof Error ? error.message : 'Please retry.', type: 'error' });
    } finally { setBusy(false); }
  }

  return <section className="sv-weekly-program sv-section sv-surface" aria-labelledby="weekly-program-title">
    <div className="sv-weekly-program__head">
      <div>
        <span className="sv-eyebrow"><CalendarDays size={14}/> WEEKLY TRAINING PROGRAM</span>
        <h2 id="weekly-program-title">Your 6-day split</h2>
        <p>Build each day once, save it to your account, then launch the same session system used by manual training.</p>
      </div>
      <div className="sv-weekly-program__summary"><b>{plannedExerciseCount}</b><span>PLANNED EXERCISES</span><i>{totalSets} TOTAL SETS</i></div>
    </div>

    <div className="sv-weekly-program__days" role="group" aria-label="Choose a training day">
      {makeEmptyDays().map((day) => {
        const saved = days.find((item) => item.dayNumber === day.dayNumber) ?? day;
        return <button type="button" key={day.dayNumber} className={selectedDay === day.dayNumber ? 'is-active' : ''} onClick={() => setSelectedDay(day.dayNumber)} aria-pressed={selectedDay === day.dayNumber}>
          <small>DAY {String(day.dayNumber).padStart(2, '0')}</small>
          <b>{saved.name}</b>
          <span>{saved.exercises.length} EXERCISES</span>
          <i><ChevronRight size={14}/></i>
        </button>;
      })}
    </div>

    <div className="sv-weekly-program__editor">
      <div className="sv-weekly-program__editor-head">
        <div><span className="sv-eyebrow">DAY {String(selectedDay).padStart(2, '0')} / PROGRAM EDITOR</span><h3>Configure this day</h3></div>
        <span className="sv-weekly-program__private"><ShieldCheck size={13}/> PRIVATE SAVE</span>
      </div>
      <label className="sv-weekly-program__name">DAY NAME<input value={draftName} onChange={(event) => setDraftName(event.target.value)} maxLength={80} placeholder={'e.g. Push · Strength'}/></label>
      {loading ? <div className="sv-weekly-program__empty"><Loader2 size={17} className="animate-spin"/> Loading your saved program…</div> : exercises.length ? <div className="sv-weekly-program__library">
        {exercises.map((exercise) => {
          const selected = selectedIds.includes(exercise.id);
          const config = configs[exercise.id] ?? { sets: 3, repTarget: '8-12', restSeconds: 60 };
          return <article key={exercise.id} className={selected ? 'is-selected' : ''}>
            <button type="button" className="sv-weekly-program__check" onClick={() => toggleExercise(exercise.id)} aria-pressed={selected} aria-label={(selected ? 'Remove ' : 'Add ') + exercise.name}>{selected ? <CheckCircle2 size={19}/> : <Dumbbell size={17}/>}</button>
            <div className="sv-weekly-program__exercise"><b>{exercise.name}</b><small>{exercise.muscle_group || exercise.category || 'Exercise'} · {exercise.equipment || 'No equipment specified'}</small></div>
            {selected && <div className="sv-weekly-program__config">
              <label>SETS<input type="number" min="1" max="50" value={config.sets} onChange={(event) => setConfigs((current) => ({ ...current, [exercise.id]: { ...config, sets: clampSets(event.target.value) } }))}/></label>
              <label>REPS / TARGET<input value={config.repTarget} maxLength={40} onChange={(event) => setConfigs((current) => ({ ...current, [exercise.id]: { ...config, repTarget: event.target.value } }))}/></label>
              <label>REST SEC<input type="number" min="0" max="3600" value={config.restSeconds} onChange={(event) => setConfigs((current) => ({ ...current, [exercise.id]: { ...config, restSeconds: clampRest(event.target.value) } }))}/></label>
            </div>}
          </article>;
        })}
      </div> : <div className="sv-weekly-program__empty"><Dumbbell size={18}/> Add exercises to your private library in the manual builder below, then return here to assign them.</div>}
      <div className="sv-weekly-program__actions">
        <span>{selectedIds.length} EXERCISES SELECTED FOR DAY {selectedDay}</span>
        <div>
          <button type="button" className="sv-btn sv-btn--ghost" onClick={() => void saveDay()} disabled={busy || loading}><Save size={14}/> Save day</button>
          <button type="button" className="sv-btn sv-btn--primary" onClick={() => void startDay()} disabled={busy || loading || selectedIds.length === 0}>{busy ? <Loader2 size={14} className="animate-spin"/> : <Play size={14}/>} Start day session</button>
        </div>
      </div>
      <p className="sv-weekly-program__footnote">Manual exercise selection and the existing session timer, rest controls, set logging and workout history remain available below.</p>
    </div>
  </section>;
}
