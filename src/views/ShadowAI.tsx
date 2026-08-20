import { useEffect, useMemo, useState } from 'react';
import { Brain, Dumbbell, HeartPulse, Sparkles, ArrowRight, RefreshCw, ShieldCheck, Utensils } from 'lucide-react';
import type { ViewId } from '../components/Navigation';
import { toast } from '../components/ui/Toast';

interface ShadowAIProps { onNavigate: (view: ViewId) => void; }
interface PlannedExercise { day: 'push' | 'pull' | 'leg'; name: string; sets: number; reps: string; section: 'stretching' | 'main' | 'plyometric'; }

const STORAGE_KEY = 'forged-shadow-ai-profile-v1';
const PLAN_KEY = 'forged-shadow-ai-workout-plan';

function buildPlan(age: number, weight: number, goal: string): PlannedExercise[] {
  const young = age < 16;
  const moderateSets = young ? 2 : 3;
  const mainReps = young ? '8–12' : '8–15';
  const plan: PlannedExercise[] = [
    { day: 'push', name: 'Arm Circles + Shoulder Mobility', sets: 1, reps: '45 sec', section: 'stretching' },
    { day: 'push', name: 'Incline or Knee Push-ups', sets: moderateSets, reps: mainReps, section: 'main' },
    { day: 'push', name: 'Standard Push-ups', sets: moderateSets, reps: mainReps, section: 'main' },
    { day: 'push', name: 'Pike Push-ups', sets: moderateSets, reps: '6–10', section: 'main' },
    { day: 'pull', name: 'Cat-Cow + Thoracic Mobility', sets: 1, reps: '60 sec', section: 'stretching' },
    { day: 'pull', name: 'Prone Y-T Raises', sets: moderateSets, reps: '8–12', section: 'main' },
    { day: 'pull', name: 'Reverse Snow Angels', sets: moderateSets, reps: '10–15', section: 'main' },
    { day: 'pull', name: 'Superman Hold', sets: moderateSets, reps: '20–30 sec', section: 'main' },
    { day: 'leg', name: 'Bodyweight Squat', sets: moderateSets, reps: '10–15', section: 'main' },
    { day: 'leg', name: 'Reverse Lunges', sets: moderateSets, reps: '8–12 / side', section: 'main' },
    { day: 'leg', name: 'Glute Bridge', sets: moderateSets, reps: '12–15', section: 'main' },
    { day: 'leg', name: goal.toLowerCase().includes('jump') ? 'Low-Impact Squat Jumps' : 'Calf Raises', sets: 2, reps: goal.toLowerCase().includes('jump') ? '5–8' : '12–20', section: goal.toLowerCase().includes('jump') ? 'plyometric' : 'main' },
  ];
  void weight;
  return plan;
}

export function ShadowAI({ onNavigate }: ShadowAIProps) {
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('Build strength and fitness');
  const [saved, setSaved] = useState(false);
  const [showPlan, setShowPlan] = useState(false);

  useEffect(() => {
    try {
      const savedProfile = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (savedProfile) { setAge(String(savedProfile.age ?? '')); setWeight(String(savedProfile.weight ?? '')); setGoal(savedProfile.goal ?? 'Build strength and fitness'); setSaved(true); }
    } catch { localStorage.removeItem(STORAGE_KEY); }
  }, []);

  const parsedAge = Number(age); const parsedWeight = Number(weight);
  const valid = Number.isFinite(parsedAge) && parsedAge >= 13 && parsedAge <= 100 && Number.isFinite(parsedWeight) && parsedWeight > 25 && parsedWeight < 250;
  const plan = useMemo(() => valid ? buildPlan(parsedAge, parsedWeight, goal) : [], [valid, parsedAge, parsedWeight, goal]);

  const saveProfile = () => {
    if (!valid) { toast({ title: 'Enter valid details', message: 'Add your age and weight first.', type: 'error' }); return; }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ age: parsedAge, weight: parsedWeight, goal }));
    setSaved(true); setShowPlan(false);
    toast({ title: 'Shadow AI profile ready', message: 'Your plan is personalized from the information you entered.', type: 'success' });
  };

  const useWorkoutPlan = () => {
    if (!plan.length) return;
    const id = `${Date.now()}-${parsedAge}-${parsedWeight}-${goal}`;
    localStorage.setItem(PLAN_KEY, JSON.stringify({ id, exercises: plan }));
    localStorage.removeItem('forged-shadow-ai-applied');
    toast({ title: 'Workout plan prepared', message: 'Open Workout to load your Shadow AI exercises.', type: 'success' });
    onNavigate('workout');
  };

  return <div className="space-y-6">
    <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-950/45 via-slate-950/90 to-black p-5 sm:p-7">
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-purple-500/10 blur-3xl" />
      <div className="relative flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-400/20 bg-purple-500/15 shadow-[0_0_35px_rgba(168,85,247,.18)]"><Brain size={28} className="text-purple-300" /></div><div><p className="text-[10px] font-bold uppercase tracking-[.25em] text-purple-300/60">FORGED INTELLIGENCE</p><h1 className="font-display text-2xl font-bold text-white sm:text-3xl">SHADOW AI</h1><p className="mt-1 text-sm text-purple-200/60">Your personal training and wellness strategist.</p></div></div>
    </div>

    <div className="card-premium p-5 sm:p-6"><div className="mb-5 flex items-center gap-2"><ShieldCheck size={19} className="text-emerald-400" /><h2 className="section-title">Hunter Profile</h2></div><p className="mb-5 text-sm text-ink-300">Enter your basics once. Shadow AI uses them to build a sensible, progressive plan. It does not replace a doctor or qualified coach.</p><div className="grid gap-4 sm:grid-cols-3"><label className="text-sm text-ink-300">Age<input type="number" min="13" max="100" value={age} onChange={(e) => setAge(e.target.value)} className="input mt-2 w-full" placeholder="Your age" /></label><label className="text-sm text-ink-300">Weight (kg)<input type="number" min="25" max="249" value={weight} onChange={(e) => setWeight(e.target.value)} className="input mt-2 w-full" placeholder="Your weight" /></label><label className="text-sm text-ink-300">Main goal<select value={goal} onChange={(e) => setGoal(e.target.value)} className="input mt-2 w-full"><option>Build strength and fitness</option><option>Improve conditioning</option><option>Improve jump and athletic ability</option><option>Build a consistent routine</option></select></label></div><button onClick={saveProfile} className="btn-primary mt-5"><Sparkles size={16} /> {saved ? 'Update Shadow AI' : 'Activate Shadow AI'}</button></div>

    {valid && <><div className="grid gap-4 md:grid-cols-3"><div className="card-premium p-5"><Dumbbell className="mb-3 text-purple-400" size={22} /><p className="text-xs text-ink-400">Training</p><p className="mt-1 font-bold text-white">3-day Push / Pull / Legs</p></div><div className="card-premium p-5"><HeartPulse className="mb-3 text-emerald-400" size={22} /><p className="text-xs text-ink-400">Intensity</p><p className="mt-1 font-bold text-white">Moderate, progressive</p></div><div className="card-premium p-5"><Utensils className="mb-3 text-gold-400" size={22} /><p className="text-xs text-ink-400">Nutrition</p><p className="mt-1 font-bold text-white">Balanced meals + hydration</p></div></div>
      <div className="card-premium overflow-hidden"><button onClick={() => setShowPlan((v) => !v)} className="flex w-full items-center justify-between p-5 text-left"><div><h2 className="section-title">Shadow Training Plan</h2><p className="mt-1 text-xs text-ink-400">{plan.length} exercises generated from your profile</p></div><RefreshCw size={18} className={`text-purple-400 transition ${showPlan ? 'rotate-180' : ''}`} /></button>{showPlan && <div className="border-t border-white/5 p-5"><div className="grid gap-3 md:grid-cols-3">{(['push','pull','leg'] as const).map((day) => <div key={day} className="rounded-2xl border border-white/5 bg-black/20 p-4"><p className="mb-3 font-bold uppercase tracking-wider text-purple-300">{day}</p><div className="space-y-2">{plan.filter((e) => e.day === day).map((e) => <div key={e.name} className="rounded-xl bg-white/[.03] p-3"><p className="text-sm font-medium text-white">{e.name}</p><p className="mt-1 text-[11px] text-ink-400">{e.sets} sets · {e.reps}</p></div>)}</div></div>)}</div><div className="mt-5 flex flex-col gap-3 sm:flex-row"><button onClick={useWorkoutPlan} className="btn-primary"><Dumbbell size={16} /> Use This Plan in Workout <ArrowRight size={15} /></button><p className="text-xs text-ink-500 sm:py-2">You can edit the exercises later from Workout.</p></div></div>}</div>
      <div className="card-premium p-5"><h2 className="section-title mb-3 flex items-center gap-2"><Utensils size={18} className="text-gold-400" /> Nutrition Guidance</h2><p className="text-sm leading-6 text-ink-300">Focus on regular balanced meals: protein foods, grains or other carbohydrate sources, vegetables and fruit, healthy fats, and enough water. For a growing body, avoid aggressive dieting or calorie restriction. If you have a medical condition, food allergy, or a specific nutrition concern, ask a parent/guardian and a qualified health professional.</p></div></>}
  </div>;
}
