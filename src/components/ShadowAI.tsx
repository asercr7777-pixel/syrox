import { useMemo, useState } from 'react';
import { Apple, Brain, Check, ChevronRight, Clock3, Dumbbell, Moon, Play, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';

type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'extreme';
type Goal = 'strength' | 'fitness' | 'mobility' | 'sports';
type Gender = 'male' | 'female';
type Equipment = 'bodyweight' | 'home' | 'gym';

type Exercise = {
  name: string;
  target: string;
  beginner: string;
  intermediate: string;
  advanced: string;
  equipment: Equipment[];
  rest: string;
  cue: string;
};

const difficultyMeta: Record<Difficulty, { label: string; note: string }> = {
  beginner: { label: 'Beginner', note: 'Foundation + technique' },
  intermediate: { label: 'Intermediate', note: 'More challenge + volume' },
  advanced: { label: 'Advanced', note: 'Higher skill + control' },
  extreme: { label: 'Extreme', note: 'Experienced users only' },
};

const goalMeta: Record<Goal, string> = {
  strength: 'Strength',
  fitness: 'Fitness',
  mobility: 'Mobility',
  sports: 'Sports performance',
};

const exercises: Exercise[] = [
  { name: 'Bodyweight Squat', target: 'Legs', beginner: '2 × 8–10', intermediate: '3 × 10–12', advanced: '3 × 12–15', equipment: ['bodyweight', 'home', 'gym'], rest: '60–90 sec', cue: 'Keep the movement controlled and knees tracking comfortably.' },
  { name: 'Reverse Lunge', target: 'Legs + balance', beginner: '2 × 6/side', intermediate: '3 × 8/side', advanced: '3 × 10/side', equipment: ['bodyweight', 'home', 'gym'], rest: '60–90 sec', cue: 'Step back under control and keep your torso stable.' },
  { name: 'Glute Bridge', target: 'Hips + posterior chain', beginner: '2 × 10', intermediate: '3 × 12', advanced: '3 × 15', equipment: ['bodyweight', 'home', 'gym'], rest: '60 sec', cue: 'Move smoothly; do not force the range of motion.' },
  { name: 'Incline Push-up', target: 'Chest + arms', beginner: '2 × 6–10', intermediate: '3 × 8–12', advanced: '3 × 10–15', equipment: ['bodyweight', 'home', 'gym'], rest: '60–90 sec', cue: 'Use a stable surface and keep your body aligned.' },
  { name: 'Push-up', target: 'Chest + arms', beginner: '2 × 5–8', intermediate: '3 × 8–12', advanced: '3 × 10–15', equipment: ['bodyweight', 'home', 'gym'], rest: '60–90 sec', cue: 'Use a range you can control without pain.' },
  { name: 'Backpack Row', target: 'Back + arms', beginner: '2 × 8–10', intermediate: '3 × 10–12', advanced: '3 × 12–15', equipment: ['home'], rest: '60–90 sec', cue: 'Keep the load light enough to maintain control.' },
  { name: 'Resistance Row', target: 'Back + arms', beginner: '2 × 8–10', intermediate: '3 × 10–12', advanced: '3 × 12–15', equipment: ['gym'], rest: '60–90 sec', cue: 'Pull smoothly and avoid jerking the weight.' },
  { name: 'Dead Bug', target: 'Core control', beginner: '2 × 6/side', intermediate: '3 × 8/side', advanced: '3 × 10/side', equipment: ['bodyweight', 'home', 'gym'], rest: '45–60 sec', cue: 'Move slowly while keeping your lower back comfortable.' },
  { name: 'Front Plank', target: 'Core', beginner: '2 × 15–25 sec', intermediate: '3 × 25–40 sec', advanced: '3 × 40–60 sec', equipment: ['bodyweight', 'home', 'gym'], rest: '45–60 sec', cue: 'Stop the set when you can no longer keep good form.' },
  { name: 'Calf Raise', target: 'Calves', beginner: '2 × 10', intermediate: '3 × 12', advanced: '3 × 15', equipment: ['bodyweight', 'home', 'gym'], rest: '45–60 sec', cue: 'Use a comfortable range and steady tempo.' },
  { name: 'March in Place', target: 'Low-impact conditioning', beginner: '3 × 45 sec', intermediate: '3 × 60 sec', advanced: '4 × 60 sec', equipment: ['bodyweight', 'home', 'gym'], rest: '45 sec', cue: 'Keep the pace controlled and breathing steady.' },
  { name: 'Mobility Flow', target: 'Mobility', beginner: '6 min', intermediate: '8 min', advanced: '10 min', equipment: ['bodyweight', 'home', 'gym'], rest: 'As needed', cue: 'Stay in comfortable ranges; never force a stretch.' },
];

const choose = (target: string, equipment: Equipment, difficulty: Difficulty) => {
  const pool = exercises.filter((e) => e.target.toLowerCase().includes(target.toLowerCase()) && e.equipment.includes(equipment));
  const fallback = exercises.filter((e) => e.equipment.includes(equipment));
  const picked = pool[0] ?? fallback[0];
  return picked;
};

const dose = (exercise: Exercise, difficulty: Difficulty) => difficulty === 'beginner' ? exercise.beginner : difficulty === 'intermediate' ? exercise.intermediate : exercise.advanced;

export function ShadowAI() {
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [gender, setGender] = useState<Gender | ''>('');
  const [goal, setGoal] = useState<Goal>('fitness');
  const [days, setDays] = useState(3);
  const [minutes, setMinutes] = useState(45);
  const [equipment, setEquipment] = useState<Equipment>('bodyweight');
  const [age, setAge] = useState('');
  const [preferences, setPreferences] = useState('');
  const [generated, setGenerated] = useState(false);
  const [activeDay, setActiveDay] = useState(1);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  const week = useMemo(() => {
    const templates = days === 1
      ? ['Full Body']
      : days === 2
        ? ['Full Body A', 'Full Body B']
        : days === 3
          ? ['Full Body', 'Mobility + Core', 'Full Body']
          : ['Upper Body', 'Lower Body', 'Mobility + Core', 'Upper Body', 'Lower Body', 'Conditioning'];

    return templates.slice(0, days).map((title, index) => {
      const isMobility = title.includes('Mobility');
      const isUpper = title.includes('Upper');
      const isLower = title.includes('Lower');
      const targets = isMobility
        ? ['Mobility', 'Core', 'Core']
        : isUpper
          ? ['Chest', 'Back', 'Core']
          : isLower
            ? ['Legs', 'Hips', 'Calves']
            : index % 2 === 0
              ? ['Legs', 'Chest', 'Core']
              : ['Back', 'Legs', 'Core'];
      const items = targets.map((target) => choose(target, equipment, difficulty));
      return { day: index + 1, title, items };
    });
  }, [days, equipment, difficulty]);

  const current = week.find((day) => day.day === activeDay) ?? week[0];
  const currentCompleted = current?.items.every((exercise) => completed[`${current.day}-${exercise.name}`]);

  const generate = () => {
    setGenerated(true);
    setActiveDay(1);
    setCompleted({});
  };

  const reset = () => {
    setGenerated(false);
    setDifficulty('beginner');
    setGender('');
    setGoal('fitness');
    setDays(3);
    setMinutes(45);
    setEquipment('bodyweight');
    setAge('');
    setPreferences('');
    setCompleted({});
  };

  const toggleComplete = (key: string) => setCompleted((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-ember-500/20 bg-gradient-to-br from-ember-500/10 via-black/30 to-transparent p-5 sm:p-7">
        <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-ember-500/10 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="rounded-2xl border border-ember-500/30 bg-ember-500/10 p-3 text-ember-400"><Brain size={28} /></div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><h1 className="section-title">Shadow AI</h1><span className="chip border border-ember-500/20 bg-ember-500/10 text-ember-300"><Sparkles size={13} /> Workout Planner</span></div>
            <p className="mt-1 text-sm text-ink-300">Build a complete, gradual workout plan around your level, goal, schedule and equipment.</p>
          </div>
        </div>
      </header>

      <section className="card p-4 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="font-display text-lg font-bold">1. Difficulty</h2><p className="text-xs text-ink-400">You choose where the progression starts.</p></div><ShieldCheck className="text-emerald2-400" size={20} /></div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {(Object.keys(difficultyMeta) as Difficulty[]).map((id) => <button key={id} onClick={() => setDifficulty(id)} className={`rounded-xl border p-3 text-left transition ${difficulty === id ? 'border-ember-500/50 bg-ember-500/10' : 'border-white/5 bg-ink-950/40 hover:border-white/15'}`}><p className="text-sm font-semibold">{difficultyMeta[id].label}</p><p className="mt-1 text-[11px] text-ink-400">{difficultyMeta[id].note}</p></button>)}
        </div>
      </section>

      <section className="card p-4 sm:p-6">
        <div className="mb-5 flex items-center gap-2"><Dumbbell size={19} className="text-ember-400" /><h2 className="font-display text-lg font-bold">2. Personal setup</h2></div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-ink-300">Gender<select value={gender} onChange={(e) => setGender(e.target.value as Gender | '')} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none"><option value="">Select gender</option><option value="male">Male</option><option value="female">Female</option></select></label>
          <label className="text-sm text-ink-300">Age (optional)<input value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, '').slice(0, 3))} inputMode="numeric" placeholder="Age" className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none" /></label>
          <label className="text-sm text-ink-300">Goal<select value={goal} onChange={(e) => setGoal(e.target.value as Goal)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none"><option value="strength">Strength</option><option value="fitness">Fitness</option><option value="mobility">Mobility</option><option value="sports">Sports performance</option></select></label>
          <label className="text-sm text-ink-300">Training days: <b className="text-white">{days}</b><input type="range" min="1" max="6" value={days} onChange={(e) => setDays(Number(e.target.value))} className="mt-2 w-full accent-orange-500" /></label>
          <label className="text-sm text-ink-300">Session time: <b className="text-white">{minutes} min</b><input type="range" min="20" max="90" step="5" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="mt-2 w-full accent-orange-500" /></label>
          <label className="text-sm text-ink-300">Equipment<select value={equipment} onChange={(e) => setEquipment(e.target.value as Equipment)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none"><option value="bodyweight">Bodyweight</option><option value="home">Home equipment</option><option value="gym">Gym</option></select></label>
          <label className="text-sm text-ink-300 md:col-span-2">Food preferences / allergies (optional)<input value={preferences} onChange={(e) => setPreferences(e.target.value)} placeholder="e.g. vegetarian, foods to avoid" className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none" /></label>
        </div>
        <button onClick={generate} disabled={!gender} className="btn-primary mt-5 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"><Sparkles size={17} /> Generate complete plan <ChevronRight size={17} /></button>
      </section>

      {generated && current && <>
        <section className="card p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-lg font-bold">Weekly workout planner</h2><p className="text-xs text-ink-400">{goalMeta[goal]} · {difficultyMeta[difficulty].label} · {days} training day{days > 1 ? 's' : ''} · {minutes} min/session</p></div><Clock3 className="text-ember-400" size={21} /></div>
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
            {week.map((day) => <button key={day.day} onClick={() => setActiveDay(day.day)} className={`min-w-[110px] rounded-xl border px-3 py-2 text-left ${activeDay === day.day ? 'border-ember-500/50 bg-ember-500/10' : 'border-white/5 bg-black/20'}`}><span className="text-[11px] text-ink-400">DAY {day.day}</span><p className="text-sm font-semibold">{day.title}</p></button>)}
          </div>
          <div className="mb-4 flex items-center justify-between"><div><h3 className="font-display text-xl font-bold">Day {current.day}: {current.title}</h3><p className="text-xs text-ink-400">Warm-up 5–10 min · Main workout · Cool-down 5–10 min</p></div>{currentCompleted && <span className="chip border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"><Check size={13} /> Complete</span>}</div>
          <div className="space-y-3">
            {current.items.map((exercise, index) => {
              const key = `${current.day}-${exercise.name}`;
              const done = !!completed[key];
              return <div key={`${exercise.name}-${index}`} className={`rounded-2xl border p-4 transition ${done ? 'border-emerald-500/20 bg-emerald-500/[0.04]' : 'border-white/5 bg-ink-950/40'}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ember-500/10 text-sm font-bold text-ember-300">{index + 1}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold">{exercise.name}</h4><span className="text-[11px] text-ink-500">{exercise.target}</span></div><p className="mt-1 text-sm font-medium text-ember-400">{dose(exercise, difficulty)}</p><p className="mt-1 text-xs text-ink-400">Rest: {exercise.rest} · {exercise.cue}</p></div></div><button onClick={() => toggleComplete(key)} className={done ? 'btn-primary shrink-0 justify-center' : 'btn-ghost shrink-0 justify-center'}>{done ? <Check size={16} /> : <Play size={15} />} {done ? 'Completed' : 'Start'}</button></div>
              </div>;
            })}
          </div>
          <div className="mt-5 rounded-xl border border-white/5 bg-black/20 p-4 text-sm text-ink-300"><b className="text-white">Progression:</b> keep the selected difficulty until the exercises feel controlled and comfortable. Then progress gradually by using a harder variation, a small increase in reps, or slightly more time—not all at once.</div>
        </section>

        <section className="card p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-2"><Apple size={19} className="text-emerald2-400" /><h2 className="font-display text-lg font-bold">Nutrition & recovery</h2></div>
          <div className="grid gap-3 md:grid-cols-3"><div className="rounded-xl border border-white/5 bg-ink-950/40 p-4"><b>Balanced meals</b><p className="mt-1 text-xs text-ink-400">Use regular balanced meals with protein foods, grains or other starches, fruit/vegetables and healthy fats.</p></div><div className="rounded-xl border border-white/5 bg-ink-950/40 p-4"><b>Hydration</b><p className="mt-1 text-xs text-ink-400">Drink regularly through the day and around activity, especially in hot weather.</p></div><div className="rounded-xl border border-white/5 bg-ink-950/40 p-4"><b>Recovery</b><p className="mt-1 text-xs text-ink-400">Rest days, enough sleep and regular meals support performance, recovery and healthy growth.</p></div></div>
          {preferences && <p className="mt-3 text-xs text-ink-400">Food preferences noted: <span className="text-ink-200">{preferences}</span></p>}
        </section>

        <section className="card border-amber-500/10 bg-amber-500/[0.03] p-4 sm:p-5">
          <div className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-amber-400" size={19} /><p className="text-xs leading-5 text-ink-300">Shadow AI is a planning tool, not a doctor or dietitian. Keep training age-appropriate and comfortable. Stop if you feel pain; for an injury, medical condition, or special dietary need, ask a parent/guardian and a qualified professional.</p></div>
        </section>

        <div className="flex flex-wrap justify-end gap-2"><button onClick={() => setCompleted({})} className="btn-ghost"><RotateCcw size={16} /> Reset workout</button><button onClick={reset} className="btn-ghost">Start over</button></div>
      </>}

      <div className="flex items-center gap-2 text-xs text-ink-500"><Moon size={14} /> Shadow AI adapts the planner to your selected level, schedule and equipment.</div>
    </div>
  );
}
