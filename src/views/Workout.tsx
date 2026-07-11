import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { WORKOUT_SPLIT } from '../data/tasks';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { Plus, Pencil, Trash2, Check, Dumbbell, Play, Pause, Square, RotateCcw } from 'lucide-react';
import { toast } from '../components/ui/Toast';
import type { ExerciseEntry, WorkoutSessionRecord } from '../store/types';

type WorkoutMode = 'push' | 'pull' | 'legs' | 'cardio' | 'boxing' | 'custom';

const WORKOUT_MODES: { id: WorkoutMode; label: string; emoji: string; color: string }[] = [
  { id: 'push', label: 'Push', emoji: '💥', color: '#ff7a18' },
  { id: 'pull', label: 'Pull', emoji: '🏋️', color: '#3b82f6' },
  { id: 'legs', label: 'Legs', emoji: '🦵', color: '#10b981' },
  { id: 'cardio', label: 'Cardio', emoji: '🏃', color: '#f43f5e' },
  { id: 'boxing', label: 'Boxing', emoji: '🥊', color: '#a855f7' },
  { id: 'custom', label: 'Custom', emoji: '⚡', color: '#fbbf24' },
];

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function Workout() {
  const { state, toggleExercise, addExercise, updateExercise, deleteExercise, saveWorkoutSession } = useStore();
  const [activeMode, setActiveMode] = useState<WorkoutMode>('push');
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState('10-12');
  const [section, setSection] = useState<'stretching' | 'main' | 'plyometric'>('main');

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = window.setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
      return () => {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
      };
    }
  }, [timerRunning]);

  const handleStart = () => {
    if (elapsedSeconds > 0 && !timerRunning) {
      setTimerRunning(true);
    } else {
      setElapsedSeconds(0);
      setTimerRunning(true);
    }
  };

  const handlePause = () => {
    setTimerRunning(false);
  };

  const handleResume = () => {
    setTimerRunning(true);
  };

  const handleStop = useCallback(() => {
    setTimerRunning(false);
    if (elapsedSeconds > 0) {
      saveWorkoutSession(activeMode, elapsedSeconds);
      toast({ title: 'Workout saved!', message: `${formatTime(elapsedSeconds)} of ${activeMode} training logged.`, type: 'success', icon: '💪' });
    }
  }, [elapsedSeconds, activeMode, saveWorkoutSession]);

  const handleReset = () => {
    setTimerRunning(false);
    setElapsedSeconds(0);
  };

  const openAdd = () => {
    setName('');
    setSets(3);
    setReps('10-12');
    setSection('main');
    setAddOpen(true);
  };

  const openEdit = (ex: ExerciseEntry) => {
    setName(ex.name);
    setSets(ex.sets);
    setReps(ex.reps);
    setSection(ex.section);
    setEditId(ex.id);
  };

  const save = () => {
    if (!name.trim()) {
      toast({ title: 'Exercise name required', type: 'error' });
      return;
    }
    const dayId = activeMode === 'legs' ? 'leg' : activeMode === 'push' || activeMode === 'pull' ? activeMode : 'push';
    if (editId) {
      updateExercise(dayId as 'push' | 'pull' | 'leg', editId, { name, sets, reps });
      toast({ title: 'Exercise updated', type: 'success' });
      setEditId(null);
    } else {
      addExercise(dayId as 'push' | 'pull' | 'leg', name, sets, reps, section);
      toast({ title: 'Exercise added', type: 'success' });
      setAddOpen(false);
    }
  };

  // For push/pull/legs modes, show the exercise list; for cardio/boxing/custom, just the timer
  const showExercises = activeMode === 'push' || activeMode === 'pull' || activeMode === 'legs';
  const dayId = activeMode === 'legs' ? 'leg' : (activeMode as 'push' | 'pull');
  const exercises = showExercises ? state.workouts[dayId] : [];
  const completedCount = exercises.filter((e) => e.completed).length;
  const allDone = exercises.length > 0 && completedCount === exercises.length;

  const day = WORKOUT_SPLIT.find((d) => d.id === dayId);
  const sections = day?.sections ?? [];

  // Recent sessions
  const recentSessions = state.workoutSessions.slice(-5).reverse();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="section-title">Workout</h1>
          <p className="text-sm text-ink-300">Train your body. Forge your discipline.</p>
        </div>
        {showExercises && (
          <button onClick={openAdd} className="btn-primary">
            <Plus size={18} /> Add Exercise
          </button>
        )}
      </div>

      {/* Professional Timer */}
      <div className="card p-6 md:p-8 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 0%, ${WORKOUT_MODES.find((m) => m.id === activeMode)?.color}, transparent 60%)` }}
        />
        <div className="relative">
          {/* Mode selector */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
            {WORKOUT_MODES.map((m) => {
              const active = activeMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => { setActiveMode(m.id); handleReset(); }}
                  className={`p-3 rounded-xl border transition-all text-center ${
                    active
                      ? 'bg-gradient-to-br from-ember-500/20 to-transparent border-ember-500/50'
                      : 'bg-ink-900/60 border-white/5 hover:border-white/20'
                  }`}
                  style={active ? { boxShadow: `0 0 20px ${m.color}40` } : {}}
                >
                  <div className="text-2xl mb-1">{m.emoji}</div>
                  <p className="text-xs font-semibold">{m.label}</p>
                </button>
              );
            })}
          </div>

          {/* Timer display */}
          <div className="text-center py-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-300 mb-2">
              {WORKOUT_MODES.find((m) => m.id === activeMode)?.label} Session
            </p>
            <div
              className="font-mono text-6xl md:text-7xl font-bold tabular-nums"
              style={{
                color: timerRunning ? '#ff7a18' : '#e6eaf5',
                textShadow: timerRunning ? '0 0 30px rgba(255,122,24,0.5)' : 'none',
                transition: 'color 0.3s, text-shadow 0.3s',
              }}
            >
              {formatTime(elapsedSeconds)}
            </div>
            <p className="text-xs text-ink-400 mt-2">
              {timerRunning ? 'Training in progress...' : elapsedSeconds > 0 ? 'Paused' : 'Ready to begin'}
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {!timerRunning && elapsedSeconds === 0 && (
              <button onClick={handleStart} className="btn-primary px-6 py-3">
                <Play size={20} /> Start
              </button>
            )}
            {timerRunning && (
              <button onClick={handlePause} className="btn-ghost px-6 py-3">
                <Pause size={20} /> Pause
              </button>
            )}
            {!timerRunning && elapsedSeconds > 0 && (
              <button onClick={handleResume} className="btn-primary px-6 py-3">
                <Play size={20} /> Resume
              </button>
            )}
            {elapsedSeconds > 0 && (
              <button onClick={handleStop} className="btn-danger px-6 py-3">
                <Square size={20} /> Stop & Save
              </button>
            )}
            <button onClick={handleReset} className="btn-ghost px-6 py-3">
              <RotateCcw size={20} /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Exercise list (only for push/pull/legs) */}
      {showExercises && (
        <>
          {/* Day header */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="font-display text-xl font-bold">{day?.name}</h2>
                <p className="text-sm text-ink-300">{day?.description}</p>
              </div>
              {allDone && (
                <span className="chip bg-emerald2-500/15 text-emerald2-400 border border-emerald2-500/30">
                  <Check size={14} /> Complete
                </span>
              )}
            </div>
            <div className="h-2 bg-ink-950 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-gradient-to-r from-ember-500 to-gold-500 transition-all duration-500"
                style={{ width: `${exercises.length > 0 ? (completedCount / exercises.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Sections */}
          {sections.map((sec) => {
            const secExercises = exercises.filter((e) => e.section === sec.type);
            if (secExercises.length === 0) return null;
            return (
              <div key={sec.type} className="card p-5">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ember-400 mb-3">{sec.name}</h3>
                <div className="space-y-2">
                  {secExercises.map((ex) => (
                    <div
                      key={ex.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        ex.completed
                          ? 'bg-emerald2-500/10 border-emerald2-500/40'
                          : 'bg-ink-950/40 border-white/5'
                      }`}
                    >
                      <button
                        onClick={() => toggleExercise(dayId, ex.id)}
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                          ex.completed ? 'bg-emerald2-500 border-emerald2-500' : 'border-ink-500'
                        }`}
                      >
                        {ex.completed && <Check size={14} className="text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${ex.completed ? 'text-emerald2-400 line-through' : ''}`}>{ex.name}</p>
                        <p className="text-xs text-ink-400">{ex.sets} sets × {ex.reps} reps</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(ex)} className="p-2 rounded-lg hover:bg-white/10">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteId(ex.id)} className="p-2 rounded-lg hover:bg-danger-500/20 text-danger-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {exercises.length === 0 && (
            <div className="card p-8 text-center">
              <Dumbbell size={32} className="mx-auto text-ink-400 mb-2" />
              <p className="text-ink-300">No exercises for this day yet.</p>
              <button onClick={openAdd} className="btn-primary mt-3">
                <Plus size={16} /> Add Exercise
              </button>
            </div>
          )}
        </>
      )}

      {/* Workout History */}
      <div className="card p-5">
        <h2 className="section-title mb-4">Workout History</h2>
        {recentSessions.length === 0 ? (
          <p className="text-sm text-ink-400 text-center py-4">No workouts logged yet. Start training!</p>
        ) : (
          <div className="space-y-2">
            {recentSessions.map((s) => {
              const mode = WORKOUT_MODES.find((m) => m.id === s.type);
              return (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-ink-950/40 border border-white/5">
                  <span className="text-2xl">{mode?.emoji ?? '💪'}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{mode?.label ?? s.type}</p>
                    <p className="text-xs text-ink-400">{new Date(s.completedAt).toLocaleString()}</p>
                  </div>
                  <span className="font-mono font-bold text-ember-400">{formatTime(s.durationSeconds)}</span>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-ink-950/40 border border-white/5">
            <p className="text-2xl font-bold text-ember-400">{state.workoutSessions.length}</p>
            <p className="text-xs text-ink-300">Total Sessions</p>
          </div>
          <div className="p-3 rounded-xl bg-ink-950/40 border border-white/5">
            <p className="text-2xl font-bold text-gold-400">{Math.floor(state.totalWorkoutSeconds / 60)}m</p>
            <p className="text-xs text-ink-300">Total Time</p>
          </div>
        </div>
      </div>

      {/* Add/Edit modal */}
      <Modal open={addOpen || editId !== null} onClose={() => { setAddOpen(false); setEditId(null); }} title={editId ? 'Edit Exercise' : 'Add Exercise'}>
        <div className="space-y-4">
          <div>
            <label className="label">Exercise Name</label>
            <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bench Press" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Sets</label>
              <input type="number" className="input mt-1" value={sets} onChange={(e) => setSets(Math.max(1, Number(e.target.value)))} min={1} />
            </div>
            <div>
              <label className="label">Reps</label>
              <input className="input mt-1" value={reps} onChange={(e) => setReps(e.target.value)} placeholder="10-12" />
            </div>
          </div>
          {!editId && (
            <div>
              <label className="label">Section</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {(['stretching', 'main', 'plyometric'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSection(s)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition ${
                      section === s ? 'bg-ember-500/30 border border-ember-500/50 text-ember-400' : 'bg-ink-950/60 border border-white/5'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => { setAddOpen(false); setEditId(null); }} className="btn-ghost">Cancel</button>
            <button onClick={save} className="btn-primary">{editId ? 'Save' : 'Add'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteExercise(dayId, deleteId);
            toast({ title: 'Exercise deleted', type: 'success' });
          }
        }}
        title="Delete Exercise"
        message="Remove this exercise from the workout?"
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
