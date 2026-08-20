import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Workout } from '../views/Workout';

interface PlannedExercise { day: 'push' | 'pull' | 'leg'; name: string; sets: number; reps: string; section: 'stretching' | 'main' | 'plyometric'; }

export function WorkoutWithAIPlan() {
  const { state, addExercise, deleteExercise } = useStore();
  const appliedRef = useRef(false);

  useEffect(() => {
    if (appliedRef.current) return;
    const raw = localStorage.getItem('forged-shadow-ai-workout-plan');
    if (!raw) return;
    try {
      const payload = JSON.parse(raw) as { id?: string; exercises?: PlannedExercise[] };
      if (!payload.exercises?.length) return;
      const key = payload.id ?? raw.slice(0, 80);
      if (localStorage.getItem('forged-shadow-ai-applied') === key) return;
      appliedRef.current = true;
      (['push', 'pull', 'leg'] as const).forEach((day) => {
        state.workouts[day].forEach((exercise) => deleteExercise(day, exercise.id));
      });
      payload.exercises.forEach((exercise) => addExercise(exercise.day, exercise.name, exercise.sets, exercise.reps, exercise.section));
      localStorage.setItem('forged-shadow-ai-applied', key);
    } catch {
      localStorage.removeItem('forged-shadow-ai-workout-plan');
    }
  }, []);

  return <Workout />;
}
