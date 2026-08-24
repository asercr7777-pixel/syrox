import { useMemo, useState } from 'react';
import { Apple, Brain, Check, ChevronRight, Clock3, Dumbbell, Moon, Play, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';

type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'extreme';
type Goal = 'strength' | 'fitness' | 'mobility' | 'sports';
type Gender = 'male' | 'female';
type Equipment = 'bodyweight' | 'home' | 'gym';

type Exercise = {
  name: string;
  group: 'push' | 'pull' | 'legs' | 'core' | 'conditioning' | 'mobility';
  target: string;
  equipment: Equipment[];
  beginner: string;
  intermediate: string;
  advanced: string;
  rest: string;
  cue: string;
};

const difficultyMeta: Record<Difficulty, { label: string; note: string }> = {
  beginner: { label: 'Beginner', note: 'Foundation + technique' },
  intermediate: { label: 'Intermediate', note: 'More volume + challenge' },
  advanced: { label: 'Advanced', note: 'Higher skill + control' },
  extreme: { label: 'Extreme', note: 'Highest available challenge' },
};

const goalMeta: Record<Goal, string> = { strength: 'Strength', fitness: 'Fitness', mobility: 'Mobility', sports: 'Sports performance' };

const exercises: Exercise[] = [
  { name: 'Incline Push-up', group: 'push', target: 'Chest + arms', equipment: ['bodyweight','home','gym'], beginner: '2 × 6–10', intermediate: '3 × 8–12', advanced: '4 × 10–15', rest: '60–90 sec', cue: 'Keep your body aligned and use a stable surface.' },
  { name: 'Push-up', group: 'push', target: 'Chest + arms', equipment: ['bodyweight','home','gym'], beginner: '2 × 5–8', intermediate: '3 × 8–12', advanced: '4 × 10–15', rest: '60–90 sec', cue: 'Use a controlled range you can maintain comfortably.' },
  { name: 'Pike Push-up', group: 'push', target: 'Shoulders + arms', equipment: ['bodyweight','home','gym'], beginner: '2 × 5–8', intermediate: '3 × 6–10', advanced: '4 × 8–12', rest: '75–120 sec', cue: 'Move slowly and keep the neck relaxed.' },
  { name: 'Knee Push-up', group: 'push', target: 'Chest + arms', equipment: ['bodyweight','home','gym'], beginner: '2 × 6–10', intermediate: '3 × 8–12', advanced: '3 × 12–15', rest: '60 sec', cue: 'Keep hips and shoulders moving together.' },
  { name: 'Backpack Floor Press', group: 'push', target: 'Chest + triceps', equipment: ['home'], beginner: '2 × 8–10', intermediate: '3 × 10–12', advanced: '4 × 10–15', rest: '75–120 sec', cue: 'Use a light, secure backpack and controlled reps.' },
  { name: 'Bench Dip', group: 'push', target: 'Triceps', equipment: ['home','gym'], beginner: '2 × 6–8', intermediate: '3 × 8–10', advanced: '3 × 10–12', rest: '60–90 sec', cue: 'Use a stable surface and stop before shoulder discomfort.' },

  { name: 'Backpack Row', group: 'pull', target: 'Back + arms', equipment: ['home'], beginner: '2 × 8–10', intermediate: '3 × 10–12', advanced: '4 × 10–15', rest: '60–90 sec', cue: 'Keep the load light enough to stay controlled.' },
  { name: 'Resistance Row', group: 'pull', target: 'Back + arms', equipment: ['gym'], beginner: '2 × 8–10', intermediate: '3 × 10–12', advanced: '4 × 10–15', rest: '75–120 sec', cue: 'Pull smoothly without jerking.' },
  { name: 'Assisted Pull-up', group: 'pull', target: 'Back + arms', equipment: ['gym'], beginner: '2 × 5–8', intermediate: '3 × 6–10', advanced: '4 × 6–10', rest: '90–120 sec', cue: 'Use assistance that lets you keep good control.' },
  { name: 'Lat Pulldown', group: 'pull', target: 'Back', equipment: ['gym'], beginner: '2 × 8–10', intermediate: '3 × 10–12', advanced: '4 × 8–12', rest: '75–120 sec', cue: 'Pull smoothly and avoid swinging.' },
  { name: 'Band Pull-apart', group: 'pull', target: 'Upper back + shoulders', equipment: ['home'], beginner: '2 × 10', intermediate: '3 × 12–15', advanced: '3 × 15–20', rest: '45–60 sec', cue: 'Keep ribs relaxed and move with control.' },
  { name: 'Reverse Snow Angel', group: 'pull', target: 'Upper back + posture', equipment: ['bodyweight','home','gym'], beginner: '2 × 6–8', intermediate: '3 × 8–12', advanced: '3 × 12–15', rest: '45–60 sec', cue: 'Move slowly through a comfortable range.' },

  { name: 'Bodyweight Squat', group: 'legs', target: 'Quads + glutes', equipment: ['bodyweight','home','gym'], beginner: '2 × 8–10', intermediate: '3 × 10–15', advanced: '4 × 12–20', rest: '60–90 sec', cue: 'Keep the movement controlled and comfortable.' },
  { name: 'Reverse Lunge', group: 'legs', target: 'Legs + balance', equipment: ['bodyweight','home','gym'], beginner: '2 × 6/side', intermediate: '3 × 8/side', advanced: '4 × 10/side', rest: '60–90 sec', cue: 'Step back under control and stay balanced.' },
  { name: 'Split Squat', group: 'legs', target: 'Quads + glutes', equipment: ['bodyweight','home','gym'], beginner: '2 × 6/side', intermediate: '3 × 8/side', advanced: '4 × 10/side', rest: '75–120 sec', cue: 'Use support if balance is limiting you.' },
  { name: 'Glute Bridge', group: 'legs', target: 'Glutes + hips', equipment: ['bodyweight','home','gym'], beginner: '2 × 10', intermediate: '3 × 12–15', advanced: '4 × 15–20', rest: '60 sec', cue: 'Move smoothly and do not force the range.' },
  { name: 'Calf Raise', group: 'legs', target: 'Calves', equipment: ['bodyweight','home','gym'], beginner: '2 × 10', intermediate: '3 × 12–15', advanced: '4 × 15–20', rest: '45–60 sec', cue: 'Use a steady tempo and comfortable range.' },
  { name: 'Step-up', group: 'legs', target: 'Legs + balance', equipment: ['home','gym'], beginner: '2 × 6/side', intermediate: '3 × 8/side', advanced: '4 × 10/side', rest: '60–90 sec', cue: 'Use a stable, low step and control the descent.' },
  { name: 'Backpack Squat', group: 'legs', target: 'Legs', equipment: ['home'], beginner: '2 × 8', intermediate: '3 × 10–12', advanced: '4 × 10–15', rest: '75–120 sec', cue: 'Keep the load light and secure.' },
  { name: 'Hip Hinge', group: 'legs', target: 'Hips + posterior chain', equipment: ['bodyweight','home','gym'], beginner: '2 × 8–10', intermediate: '3 × 10–12', advanced: '4 × 10–15', rest: '60–90 sec', cue: 'Practice a controlled hip hinge without rounding.' },

  { name: 'Dead Bug', group: 'core', target: 'Core control', equipment: ['bodyweight','home','gym'], beginner: '2 × 6/side', intermediate: '3 × 8/side', advanced: '3 × 10/side', rest: '45–60 sec', cue: 'Move slowly while keeping a comfortable back position.' },
  { name: 'Front Plank', group: 'core', target: 'Core', equipment: ['bodyweight','home','gym'], beginner: '2 × 15–25 sec', intermediate: '3 × 25–40 sec', advanced: '4 × 40–60 sec', rest: '45–60 sec', cue: 'Stop when you cannot maintain good form.' },
  { name: 'Side Plank', group: 'core', target: 'Core + lateral stability', equipment: ['bodyweight','home','gym'], beginner: '2 × 15 sec/side', intermediate: '3 × 20–30 sec/side', advanced: '3 × 30–45 sec/side', rest: '45–60 sec', cue: 'Keep the body long and steady.' },
  { name: 'Bird Dog', group: 'core', target: 'Core + coordination', equipment: ['bodyweight','home','gym'], beginner: '2 × 6/side', intermediate: '3 × 8/side', advanced: '3 × 10/side', rest: '45–60 sec', cue: 'Move slowly and avoid twisting.' },
  { name: 'Mountain Climber', group: 'conditioning', target: 'Core + conditioning', equipment: ['bodyweight','home','gym'], beginner: '3 × 20 sec', intermediate: '3 × 30 sec', advanced: '4 × 40 sec', rest: '45–60 sec', cue: 'Choose a pace you can control.' },
  { name: 'March in Place', group: 'conditioning', target: 'Low-impact conditioning', equipment: ['bodyweight','home','gym'], beginner: '3 × 45 sec', intermediate: '3 × 60 sec', advanced: '4 × 60 sec', rest: '45 sec', cue: 'Keep breathing steady and posture relaxed.' },
  { name: 'Jumping Jack', group: 'conditioning', target: 'Conditioning', equipment: ['bodyweight','home','gym'], beginner: '2 × 20 sec', intermediate: '3 × 30 sec', advanced: '4 × 40 sec', rest: '45–60 sec', cue: 'Use a low-impact step version if needed.' },

  { name: 'Mobility Flow', group: 'mobility', target: 'Full-body mobility', equipment: ['bodyweight','home','gym'], beginner: '6 min', intermediate: '8 min', advanced: '10 min', rest: 'As needed', cue: 'Stay in comfortable ranges; never force a stretch.' },
  { name: 'World’s Greatest Stretch', group: 'mobility', target: 'Hips + upper body', equipment: ['bodyweight','home','gym'], beginner: '2 × 3/side', intermediate: '2 × 4/side', advanced: '3 × 5/side', rest: '30–45 sec', cue: 'Move slowly and breathe normally.' },
  { name: 'Cat-Cow', group: 'mobility', target: 'Spine mobility', equipment: ['bodyweight','home','gym'], beginner: '2 × 6', intermediate: '2 × 8', advanced: '3 × 10', rest: '30 sec', cue: 'Move gently through a comfortable range.' },
];

const dose = (e: Exercise, d: Difficulty) => d === 'beginner' ? e.beginner : d === 'intermediate' ? e.intermediate : e.advanced;
const available = (group: Exercise['group'], equipment: Equipment) => exercises.filter(e => e.group === group && e.equipment.includes(equipment));

function pickMany(group: Exercise['group'], equipment: Equipment, count: number, offset: number) {
  const pool = available(group, equipment);
  const fallback = exercises.filter(e => e.equipment.includes(equipment));
  const source = pool.length >= count ? pool : [...pool, ...fallback.filter(e => !pool.includes(e))];
  return Array.from({ length: Math.min(count, source.length) }, (_, i) => source[(offset + i) % source.length]);
}

export function ShadowAI() {
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [gender, setGender] = useState<Gender | ''>('');
  const [goal, setGoal] = useState<Goal>('fitness');
  const [days, setDays] = useState(4);
  const [minutes, setMinutes] = useState(50);
  const [equipment, setEquipment] = useState<Equipment>('bodyweight');
  const [age, setAge] = useState('');
  const [preferences, setPreferences] = useState('');
  const [generated, setGenerated] = useState(false);
  const [activeDay, setActiveDay] = useState(1);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  const effectiveDifficulty: Difficulty = Number(age) > 0 && Number(age) < 18 && difficulty === 'extreme' ? 'advanced' : difficulty;

  const week = useMemo(() => {
    const templates = days === 1 ? ['Full Body']
      : days === 2 ? ['Full Body A', 'Full Body B']
      : days === 3 ? ['Full Body', 'Mobility + Core', 'Full Body']
      : days === 4 ? ['Upper Body', 'Lower Body', 'Mobility + Core', 'Full Body']
      : days === 5 ? ['Push', 'Pull', 'Legs', 'Upper + Core', 'Conditioning']
      : ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Conditioning'];

    return templates.slice(0, days).map((title, index) => {
      let groups: Exercise['group'][];
      if (title === 'Push') groups = ['push','push','push','core'];
      else if (title === 'Pull') groups = ['pull','pull','pull','core'];
      else if (title === 'Legs' || title === 'Lower Body') groups = ['legs','legs','legs','core'];
      else if (title === 'Upper Body' || title === 'Upper + Core' || title === 'Upper') groups = ['push','pull','push','pull','core'];
      else if (title === 'Mobility + Core') groups = ['mobility','core','mobility','core'];
      else if (title === 'Conditioning') groups = ['conditioning','conditioning','core','mobility'];
      else groups = ['legs','push','pull','core','mobility'];

      const items = groups.flatMap((group, groupIndex) => pickMany(group, equipment, group === 'core' || group === 'mobility' ? 1 : 1, index + groupIndex));
      return { day: index + 1, title, items: items.slice(0, minutes < 35 ? 5 : minutes < 55 ? 7 : 9) };
    });
  }, [days, equipment, minutes]);

  const current = week.find(d => d.day === activeDay) ?? week[0];
  const currentCompleted = current?.items.every(e => completed[`${current.day}-${e.name}`]);

  const generate = () => { setGenerated(true); setActiveDay(1); setCompleted({}); };
  const reset = () => { setGenerated(false); setDifficulty('beginner'); setGender(''); setGoal('fitness'); setDays(4); setMinutes(50); setEquipment('bodyweight'); setAge(''); setPreferences(''); setCompleted({}); };
  const toggle = (key: string) => setCompleted(p => ({ ...p, [key]: !p[key] }));

  return <div className="space-y-6">
    <header className="relative overflow-hidden rounded-2xl border border-ember-500/20 bg-gradient-to-br from-ember-500/10 via-black/30 to-transparent p-5 sm:p-7">
      <div className="relative flex items-start gap-4"><div className="rounded-2xl border border-ember-500/30 bg-ember-500/10 p-3 text-ember-400"><Brain size={28}/></div><div><div className="flex flex-wrap items-center gap-2"><h1 className="section-title">Shadow AI</h1><span className="chip border border-ember-500/20 bg-ember-500/10 text-ember-300"><Sparkles size={13}/> Complete Workout Planner</span></div><p className="mt-1 text-sm text-ink-300">A full weekly training system with exercises, progression, tracking and recovery guidance.</p></div></div>
    </header>

    <section className="card p-4 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-display text-lg font-bold">1. Difficulty</h2><p className="text-xs text-ink-400">You choose the starting challenge.</p></div><ShieldCheck className="text-emerald2-400" size={20}/></div><div className="grid grid-cols-2 gap-2 md:grid-cols-4">{(Object.keys(difficultyMeta) as Difficulty[]).map(id => <button key={id} onClick={() => setDifficulty(id)} className={`rounded-xl border p-3 text-left transition ${difficulty === id ? 'border-ember-500/50 bg-ember-500/10' : 'border-white/5 bg-ink-950/40'}`}><p className="text-sm font-semibold">{difficultyMeta[id].label}</p><p className="mt-1 text-[11px] text-ink-400">{difficultyMeta[id].note}</p></button>)}</div></section>

    <section className="card p-4 sm:p-6"><div className="mb-5 flex items-center gap-2"><Dumbbell size={19} className="text-ember-400"/><h2 className="font-display text-lg font-bold">2. Build your profile</h2></div><div className="grid gap-4 md:grid-cols-2">
      <label className="text-sm text-ink-300">Gender<select value={gender} onChange={e => setGender(e.target.value as Gender | '')} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white"><option value="">Select gender</option><option value="male">Male</option><option value="female">Female</option></select></label>
      <label className="text-sm text-ink-300">Age (optional)<input value={age} onChange={e => setAge(e.target.value.replace(/\D/g,'').slice(0,3))} inputMode="numeric" placeholder="Age" className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white"/></label>
      <label className="text-sm text-ink-300">Goal<select value={goal} onChange={e => setGoal(e.target.value as Goal)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white"><option value="strength">Strength</option><option value="fitness">Fitness</option><option value="mobility">Mobility</option><option value="sports">Sports performance</option></select></label>
      <label className="text-sm text-ink-300">Training days: <b className="text-white">{days}</b><input type="range" min="1" max="6" value={days} onChange={e => setDays(Number(e.target.value))} className="mt-2 w-full accent-orange-500"/></label>
      <label className="text-sm text-ink-300">Session time: <b className="text-white">{minutes} min</b><input type="range" min="25" max="90" step="5" value={minutes} onChange={e => setMinutes(Number(e.target.value))} className="mt-2 w-full accent-orange-500"/></label>
      <label className="text-sm text-ink-300">Equipment<select value={equipment} onChange={e => setEquipment(e.target.value as Equipment)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white"><option value="bodyweight">Bodyweight</option><option value="home">Home equipment</option><option value="gym">Gym</option></select></label>
      <label className="text-sm text-ink-300 md:col-span-2">Food preferences / allergies (optional)<input value={preferences} onChange={e => setPreferences(e.target.value)} placeholder="e.g. vegetarian, foods to avoid" className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white"/></label>
    </div><button onClick={generate} disabled={!gender} className="btn-primary mt-5 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"><Sparkles size={17}/> Generate full program <ChevronRight size={17}/></button></section>

    {generated && current && <>
      <section className="card p-4 sm:p-6"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-lg font-bold">Weekly program</h2><p className="text-xs text-ink-400">{goalMeta[goal]} · {difficultyMeta[difficulty].label} · {days} training days · {minutes} min/session</p></div><Clock3 className="text-ember-400" size={21}/></div>
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">{week.map(day => <button key={day.day} onClick={() => setActiveDay(day.day)} className={`min-w-[112px] rounded-xl border px-3 py-2 text-left ${activeDay === day.day ? 'border-ember-500/50 bg-ember-500/10' : 'border-white/5 bg-black/20'}`}><span className="text-[11px] text-ink-400">DAY {day.day}</span><p className="text-sm font-semibold">{day.title}</p></button>)}</div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-display text-xl font-bold">Day {current.day}: {current.title}</h3><p className="text-xs text-ink-400">Warm-up 5–10 min · Main work · Cool-down 5–10 min</p></div>{currentCompleted && <span className="chip border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"><Check size={13}/> Complete</span>}</div>
        <div className="space-y-3">{current.items.map((e,i) => { const key=`${current.day}-${e.name}`; const done=!!completed[key]; return <div key={`${e.name}-${i}`} className={`rounded-2xl border p-4 ${done ? 'border-emerald-500/20 bg-emerald-500/[0.04]' : 'border-white/5 bg-ink-950/40'}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="flex-1"><div className="flex items-center gap-2"><span className="text-xs text-ink-500">{i+1}</span><h4 className="font-semibold">{e.name}</h4></div><p className="mt-1 text-xs text-ink-400">{e.target} · Rest {e.rest}</p><p className="mt-2 text-sm font-medium text-ember-400">{dose(e,effectiveDifficulty)}</p><p className="mt-1 text-xs text-ink-400">{e.cue}</p></div><button onClick={() => toggle(key)} className={done ? 'btn-ghost text-emerald-300' : 'btn-primary'}>{done ? <><Check size={16}/> Completed</> : <><Play size={16}/> Complete</>}</button></div></div>})}</div>
        <div className="mt-5 rounded-xl border border-white/5 bg-black/20 p-4"><p className="text-sm"><b>Progression:</b> once you can complete the current workload with controlled technique, progress gradually by adding a small amount of work or moving to a harder variation. If the session feels too difficult, use the easier variation or reduce volume.</p></div>
      </section>

      <section className="card p-4 sm:p-6"><div className="mb-4 flex items-center gap-2"><Apple size={19} className="text-emerald2-400"/><h2 className="font-display text-lg font-bold">Nutrition & recovery</h2></div><div className="grid gap-3 md:grid-cols-3"><div className="rounded-xl border border-white/5 bg-ink-950/40 p-4"><b>Balanced meals</b><p className="mt-1 text-xs text-ink-400">Build meals around protein foods, grains or other energy foods, fruit/vegetables and healthy fats.</p></div><div className="rounded-xl border border-white/5 bg-ink-950/40 p-4"><b>Hydration</b><p className="mt-1 text-xs text-ink-400">Drink regularly and pay attention to thirst and hot-weather/activity needs.</p></div><div className="rounded-xl border border-white/5 bg-ink-950/40 p-4"><b>Recovery</b><p className="mt-1 text-xs text-ink-400">Sleep, regular meals and rest days are part of the program—not optional extras.</p></div></div>{preferences && <p className="mt-3 text-xs text-ink-400">Food notes: <span className="text-ink-200">{preferences}</span></p>}</section>

      <section className="card border-amber-500/10 bg-amber-500/[0.03] p-4"><div className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-amber-400" size={19}/><p className="text-xs leading-5 text-ink-300">Shadow AI is a planning tool, not a doctor or dietitian. Training should stay comfortable and age-appropriate. For pain, injury, medical conditions or special dietary needs, involve a parent/guardian and a qualified professional.</p></div></section>
      <div className="flex justify-end"><button onClick={reset} className="btn-ghost"><RotateCcw size={16}/> Start over</button></div>
    </>}

    <div className="flex items-center gap-2 text-xs text-ink-500"><Moon size={14}/> The program is designed to progress gradually rather than forcing harder sessions every day.</div>
  </div>;
}
