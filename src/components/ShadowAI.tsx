import { useMemo, useState } from 'react';
import { Apple, ArrowRight, Brain, Check, Dumbbell, Flame, RotateCcw, ShieldCheck, Sparkles, Trophy } from 'lucide-react';

type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'extreme';
type Goal = 'strength' | 'fitness' | 'mobility' | 'sports';
type Gender = 'male' | 'female';
type Equipment = 'bodyweight' | 'home' | 'gym';
type Mode = 'standard' | 'basketball';
type Group = 'push' | 'pull' | 'leg' | 'core' | 'conditioning' | 'mobility' | 'plyometric';

type Exercise = { name: string; group: Group; target: string; equipment: Equipment[]; reps: string; rest: string; cue: string; };

const difficultyMeta: Record<Difficulty, { label: string; volume: number }> = {
  beginner: { label: 'Beginner', volume: 1 }, intermediate: { label: 'Intermediate', volume: 2 }, advanced: { label: 'Advanced', volume: 3 }, extreme: { label: 'Extreme', volume: 3 },
};

const exercises: Exercise[] = [
  { name: 'Incline Push-up', group: 'push', target: 'Chest + arms', equipment: ['bodyweight','home','gym'], reps: '8–12', rest: '60–90s', cue: 'Keep the body aligned and use a stable surface.' },
  { name: 'Push-up', group: 'push', target: 'Chest + arms', equipment: ['bodyweight','home','gym'], reps: '6–15', rest: '60–90s', cue: 'Use a controlled range and stop before form breaks.' },
  { name: 'Pike Push-up', group: 'push', target: 'Shoulders + arms', equipment: ['bodyweight','home','gym'], reps: '5–12', rest: '75–120s', cue: 'Move under control and keep the neck relaxed.' },
  { name: 'Backpack Floor Press', group: 'push', target: 'Chest + triceps', equipment: ['home'], reps: '8–15', rest: '75–120s', cue: 'Only use a secure, manageable load.' },
  { name: 'Backpack Row', group: 'pull', target: 'Back + arms', equipment: ['home'], reps: '8–15', rest: '60–90s', cue: 'Keep the back stable and pull smoothly.' },
  { name: 'Band Row', group: 'pull', target: 'Back + arms', equipment: ['home'], reps: '10–15', rest: '60–90s', cue: 'Avoid jerking or swinging.' },
  { name: 'Assisted Pull-up', group: 'pull', target: 'Back + arms', equipment: ['gym'], reps: '5–10', rest: '90–120s', cue: 'Use enough assistance to keep control.' },
  { name: 'Lat Pulldown', group: 'pull', target: 'Back', equipment: ['gym'], reps: '8–12', rest: '75–120s', cue: 'Pull smoothly without leaning back excessively.' },
  { name: 'Bodyweight Squat', group: 'leg', target: 'Quads + glutes', equipment: ['bodyweight','home','gym'], reps: '8–20', rest: '60–90s', cue: 'Use a comfortable range and controlled tempo.' },
  { name: 'Reverse Lunge', group: 'leg', target: 'Legs + balance', equipment: ['bodyweight','home','gym'], reps: '6–12/side', rest: '60–90s', cue: 'Step back under control and stay balanced.' },
  { name: 'Split Squat', group: 'leg', target: 'Quads + glutes', equipment: ['bodyweight','home','gym'], reps: '6–12/side', rest: '75–120s', cue: 'Use support if balance is limiting.' },
  { name: 'Step-up', group: 'leg', target: 'Legs + balance', equipment: ['home','gym'], reps: '6–12/side', rest: '60–90s', cue: 'Use a stable, low step and control the descent.' },
  { name: 'Glute Bridge', group: 'leg', target: 'Glutes + hips', equipment: ['bodyweight','home','gym'], reps: '10–20', rest: '60s', cue: 'Move smoothly without forcing the range.' },
  { name: 'Calf Raise', group: 'leg', target: 'Calves', equipment: ['bodyweight','home','gym'], reps: '10–20', rest: '45–60s', cue: 'Use a steady tempo.' },
  { name: 'Hip Hinge', group: 'leg', target: 'Posterior chain', equipment: ['bodyweight','home','gym'], reps: '8–15', rest: '60–90s', cue: 'Hinge at the hips without rounding.' },
  { name: 'Dead Bug', group: 'core', target: 'Core control', equipment: ['bodyweight','home','gym'], reps: '6–12/side', rest: '45–60s', cue: 'Move slowly and avoid twisting.' },
  { name: 'Front Plank', group: 'core', target: 'Core', equipment: ['bodyweight','home','gym'], reps: '20–60s', rest: '45–60s', cue: 'Stop when you cannot maintain good form.' },
  { name: 'Side Plank', group: 'core', target: 'Lateral stability', equipment: ['bodyweight','home','gym'], reps: '15–45s/side', rest: '45–60s', cue: 'Keep the body long and steady.' },
  { name: 'Bird Dog', group: 'core', target: 'Core + coordination', equipment: ['bodyweight','home','gym'], reps: '6–12/side', rest: '45–60s', cue: 'Move slowly and keep the hips level.' },
  { name: 'March in Place', group: 'conditioning', target: 'Aerobic fitness', equipment: ['bodyweight','home','gym'], reps: '45–90s', rest: '45s', cue: 'Keep breathing steady.' },
  { name: 'Mountain Climber', group: 'conditioning', target: 'Conditioning + core', equipment: ['bodyweight','home','gym'], reps: '20–45s', rest: '45–60s', cue: 'Choose a pace you can control.' },
  { name: 'Jumping Jack', group: 'conditioning', target: 'Conditioning', equipment: ['bodyweight','home','gym'], reps: '20–45s', rest: '45–60s', cue: 'Use a step version if impact is uncomfortable.' },
  { name: 'Mobility Flow', group: 'mobility', target: 'Full-body mobility', equipment: ['bodyweight','home','gym'], reps: '6–10 min', rest: 'As needed', cue: 'Never force a stretch.' },
  { name: 'World’s Greatest Stretch', group: 'mobility', target: 'Hips + upper body', equipment: ['bodyweight','home','gym'], reps: '3–5/side', rest: '30–45s', cue: 'Move slowly and breathe normally.' },
  { name: 'Ankle Mobility', group: 'mobility', target: 'Ankles', equipment: ['bodyweight','home','gym'], reps: '8–12/side', rest: '30s', cue: 'Stay in a comfortable range.' },
  { name: 'Pogo Hops', group: 'plyometric', target: 'Elasticity + landing control', equipment: ['bodyweight','home','gym'], reps: '2–4 × 10–20s', rest: '60–90s', cue: 'Soft, quiet landings; stop if pain appears.' },
  { name: 'Snap-down', group: 'plyometric', target: 'Landing mechanics', equipment: ['bodyweight','home','gym'], reps: '2–4 × 4–6', rest: '60–90s', cue: 'Practice a controlled athletic landing.' },
  { name: 'Squat Jump', group: 'plyometric', target: 'Power', equipment: ['bodyweight','home','gym'], reps: '2–4 × 4–8', rest: '90–120s', cue: 'Prioritize landing quality over height.' },
  { name: 'Lateral Bound', group: 'plyometric', target: 'Lateral power', equipment: ['bodyweight','home','gym'], reps: '2–4 × 4–8/side', rest: '90–120s', cue: 'Use controlled side-to-side landings.' },
  { name: 'Skater Step', group: 'plyometric', target: 'Agility + balance', equipment: ['bodyweight','home','gym'], reps: '3 × 20–40s', rest: '60s', cue: 'Use a lower-impact step if needed.' },
];

const pool = (groups: Group[], equipment: Equipment) => exercises.filter(e => groups.includes(e.group) && e.equipment.includes(equipment));
const pick = (groups: Group[], equipment: Equipment, count: number, offset: number) => { const p = pool(groups, equipment); return Array.from({ length: Math.min(count, p.length) }, (_, i) => p[(i + offset) % p.length]); };

const phaseForWeek = (week: number) => week <= 4 ? { name: 'Foundation', focus: 'Technique, movement quality and consistency', mult: 1 } : week <= 8 ? { name: 'Development', focus: 'Progressive strength, fitness and skill', mult: 1.15 } : { name: 'Performance', focus: 'Power, conditioning and sport-specific performance', mult: 1.25 };

export function ShadowAI() {
  const [mode, setMode] = useState<Mode>('standard');
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [gender, setGender] = useState<Gender | ''>('');
  const [age, setAge] = useState('');
  const [goal, setGoal] = useState<Goal>('fitness');
  const [days, setDays] = useState(4);
  const [minutes, setMinutes] = useState(50);
  const [equipment, setEquipment] = useState<Equipment>('bodyweight');
  const [week, setWeek] = useState(1);
  const [generated, setGenerated] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>({});

  const safeDifficulty = Number(age) > 0 && Number(age) < 18 && difficulty === 'extreme' ? 'advanced' : difficulty;
  const phase = phaseForWeek(week);

  const schedule = useMemo(() => {
    const titles = days === 1 ? ['Full Body'] : days === 2 ? ['Full Body A','Full Body B'] : days === 3 ? ['Full Body','Mobility + Core','Full Body'] : days === 4 ? ['Upper Strength','Lower Strength','Recovery + Core','Full Body'] : days === 5 ? ['Push','Pull','Legs','Upper + Core','Conditioning'] : ['Push','Pull','Legs','Upper','Lower','Conditioning'];
    return titles.slice(0, days).map((title, i) => {
      let groups: Group[];
      if (mode === 'basketball') {
        if (title === 'Push') groups = ['push','core'];
        else if (title === 'Pull') groups = ['pull','core'];
        else if (title === 'Legs' || title === 'Lower') groups = ['leg','plyometric','mobility'];
        else if (title.includes('Conditioning')) groups = ['conditioning','plyometric','core'];
        else if (title.includes('Recovery')) groups = ['mobility','core'];
        else groups = ['leg','push','pull','core'];
      } else if (title === 'Push') groups = ['push','push','push','core'];
      else if (title === 'Pull') groups = ['pull','pull','pull','core'];
      else if (title === 'Legs' || title === 'Lower Strength' || title === 'Lower') groups = ['leg','leg','leg','core'];
      else if (title.includes('Upper')) groups = ['push','pull','push','pull','core'];
      else if (title.includes('Recovery')) groups = ['mobility','core','mobility'];
      else groups = ['leg','push','pull','core','mobility'];
      const count = minutes < 35 ? 5 : minutes < 55 ? 6 : 8;
      const items = groups.flatMap((g, gi) => pick([g], equipment, 1, i + gi + week));
      return { day: i + 1, title, items: items.slice(0, count) };
    });
  }, [days, equipment, minutes, mode, week]);

  const current = schedule[0];
  const sets = safeDifficulty === 'beginner' ? 2 : safeDifficulty === 'intermediate' ? 3 : 4;
  const transferToWorkout = () => {
    const planned = schedule.flatMap((d) => d.items.map((e) => ({ day: e.group === 'push' ? 'push' : e.group === 'pull' ? 'pull' : 'leg', name: e.name, sets, reps: e.reps, section: e.group === 'plyometric' ? 'plyometric' : e.group === 'mobility' ? 'stretching' : 'main' })));
    localStorage.setItem('forged-shadow-ai-workout-plan', JSON.stringify({ id: `shadow-${mode}-${week}-${Date.now()}`, week, mode, exercises: planned }));
    localStorage.removeItem('forged-shadow-ai-applied');
    const url = new URL(window.location.href); url.searchParams.set('view', 'workout'); window.history.pushState({}, '', url); window.dispatchEvent(new PopStateEvent('popstate'));
  };
  const toggle = (key: string) => setDone(p => ({ ...p, [key]: !p[key] }));
  const reset = () => { setGenerated(false); setWeek(1); setMode('standard'); setDifficulty('beginner'); setGender(''); setAge(''); setGoal('fitness'); setDays(4); setMinutes(50); setEquipment('bodyweight'); setDone({}); };

  return <div className="space-y-6">
    <header className="relative overflow-hidden rounded-2xl border border-ember-500/20 bg-gradient-to-br from-ember-500/10 via-black/30 to-transparent p-5 sm:p-7">
      <div className="flex items-start gap-4"><div className="rounded-2xl border border-ember-500/30 bg-ember-500/10 p-3 text-ember-400"><Brain size={28}/></div><div><div className="flex flex-wrap items-center gap-2"><h1 className="section-title">Shadow AI</h1><span className="chip"><Sparkles size={13}/> 12-Week Planner</span></div><p className="mt-1 text-sm text-ink-300">A complete progressive training planner built around your level, schedule and goal.</p></div></div>
    </header>

    <section className="card p-4 sm:p-6">
      <div className="grid grid-cols-2 gap-2"><button onClick={() => setMode('standard')} className={`rounded-xl border p-4 text-left ${mode === 'standard' ? 'border-ember-500/50 bg-ember-500/10' : 'border-white/5'}`}><Dumbbell className="mb-2 text-ember-400" size={20}/><b>Shadow AI Fitness</b><p className="mt-1 text-xs text-ink-400">Strength, fitness, mobility and conditioning.</p></button><button onClick={() => { setMode('basketball'); setGoal('sports'); }} className={`rounded-xl border p-4 text-left ${mode === 'basketball' ? 'border-amber-400/60 bg-amber-400/10' : 'border-white/5'}`}><Trophy className="mb-2 text-amber-400" size={20}/><b>Basketball Legend</b><p className="mt-1 text-xs text-ink-400">Jumping, agility, conditioning, strength and mobility.</p></button></div>
    </section>

    <section className="card p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-2"><Sparkles size={18} className="text-ember-400"/><h2 className="font-display text-lg font-bold">Build your program</h2></div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2"><p className="mb-2 text-sm text-ink-300">Starting difficulty</p><div className="grid grid-cols-2 gap-2 md:grid-cols-4">{(Object.keys(difficultyMeta) as Difficulty[]).map(d => <button key={d} onClick={() => setDifficulty(d)} className={`rounded-xl border p-3 text-left ${difficulty === d ? 'border-ember-500/50 bg-ember-500/10' : 'border-white/5'}`}><b className="text-sm">{difficultyMeta[d].label}</b><p className="text-[11px] text-ink-500">Level {difficultyMeta[d].volume}</p></button>)}</div></div>
        <label className="text-sm text-ink-300">Gender<select value={gender} onChange={e => setGender(e.target.value as Gender | '')} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white"><option value="">Select</option><option value="male">Male</option><option value="female">Female</option></select></label>
        <label className="text-sm text-ink-300">Age (optional)<input value={age} onChange={e => setAge(e.target.value.replace(/\D/g,'').slice(0,3))} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white" placeholder="Age" inputMode="numeric"/></label>
        <label className="text-sm text-ink-300">Goal<select value={goal} onChange={e => setGoal(e.target.value as Goal)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white"><option value="strength">Strength</option><option value="fitness">Fitness</option><option value="mobility">Mobility</option><option value="sports">Sports performance</option></select></label>
        <label className="text-sm text-ink-300">Equipment<select value={equipment} onChange={e => setEquipment(e.target.value as Equipment)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white"><option value="bodyweight">Bodyweight</option><option value="home">Home equipment</option><option value="gym">Gym</option></select></label>
        <label className="text-sm text-ink-300">Training days: <b className="text-white">{days}</b><input type="range" min="1" max="6" value={days} onChange={e => setDays(+e.target.value)} className="mt-2 w-full accent-orange-500"/></label>
        <label className="text-sm text-ink-300">Session: <b className="text-white">{minutes} min</b><input type="range" min="25" max="90" step="5" value={minutes} onChange={e => setMinutes(+e.target.value)} className="mt-2 w-full accent-orange-500"/></label>
      </div>
      <button disabled={!gender} onClick={() => setGenerated(true)} className="btn-primary mt-5 w-full justify-center disabled:opacity-50 sm:w-auto"><Sparkles size={17}/> Generate 12-week program <ArrowRight size={17}/></button>
    </section>

    {generated && <>
      <section className="card p-4 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><Flame className="text-ember-400" size={20}/><h2 className="font-display text-lg font-bold">{mode === 'basketball' ? 'Basketball Legend' : 'Shadow AI'} — 12 Weeks</h2></div><p className="mt-1 text-xs text-ink-400">{phase.name}: {phase.focus}</p></div><button onClick={transferToWorkout} className="btn-primary"><ArrowRight size={16}/> Add Week {week} to Workout</button></div><div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-12">{Array.from({length:12},(_,i)=>i+1).map(w=><button key={w} onClick={()=>setWeek(w)} className={`rounded-lg border py-2 text-xs font-bold ${week===w ? 'border-ember-500/50 bg-ember-500/10 text-ember-300' : 'border-white/5 text-ink-400'}`}>W{w}</button>)}</div></section>

      <section className="card p-4 sm:p-6"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-display text-lg font-bold">Week {week} · {phase.name}</h2><p className="text-xs text-ink-500">{gender === 'male' ? 'Male' : 'Female'} · {difficultyMeta[safeDifficulty].label} · {days} training days</p></div><span className="chip">{sets} sets</span></div><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{schedule.map(day=><div key={day.day} className="rounded-xl border border-white/5 bg-black/20 p-4"><div className="mb-3 flex items-center justify-between"><b>Day {day.day}</b><span className="text-xs text-ember-400">{day.title}</span></div><div className="space-y-2">{day.items.map(e=>{const key=`${week}-${day.day}-${e.name}`; return <button key={e.name} onClick={()=>toggle(key)} className={`w-full rounded-lg border p-3 text-left transition ${done[key] ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 bg-ink-950/30'}`}><div className="flex items-start gap-2"><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${done[key] ? 'border-emerald-400 text-emerald-400' : 'border-white/15'}`}>{done[key] && <Check size={13}/>}</span><span><b className="text-sm">{e.name}</b><span className="mt-0.5 block text-[11px] text-ink-500">{e.target} · {sets} × {e.reps} · {e.rest}</span></span></div></button>})}</div></div>)}</div></section>

      {mode === 'basketball' && <section className="card border-amber-400/10 bg-amber-400/[0.03] p-4 sm:p-6"><div className="mb-4 flex items-center gap-2"><Trophy className="text-amber-400" size={20}/><h2 className="font-display text-lg font-bold">Basketball Legend specialization</h2></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-xl border border-white/5 p-4"><b>Jump & landing</b><p className="mt-1 text-xs text-ink-400">Pogo hops, snap-downs and controlled jumps with landing mechanics.</p></div><div className="rounded-xl border border-white/5 p-4"><b>Agility</b><p className="mt-1 text-xs text-ink-400">Lateral movement, balance and change-of-direction foundations.</p></div><div className="rounded-xl border border-white/5 p-4"><b>Fitness</b><p className="mt-1 text-xs text-ink-400">Progressive conditioning for repeated effort on court.</p></div><div className="rounded-xl border border-white/5 p-4"><b>Mobility</b><p className="mt-1 text-xs text-ink-400">Ankles, hips and full-body movement quality.</p></div></div></section>}

      <section className="card p-4 sm:p-6"><div className="flex items-center gap-2 mb-4"><Apple className="text-emerald-400" size={19}/><h2 className="font-display text-lg font-bold">Nutrition & recovery</h2></div><div className="grid gap-3 md:grid-cols-3"><div className="rounded-xl border border-white/5 p-4"><b>Balanced meals</b><p className="mt-1 text-xs text-ink-400">Regular meals with varied protein foods, grains/starches, fruit or vegetables and healthy fats.</p></div><div className="rounded-xl border border-white/5 p-4"><b>Hydration</b><p className="mt-1 text-xs text-ink-400">Drink regularly and pay extra attention to fluids around exercise and heat.</p></div><div className="rounded-xl border border-white/5 p-4"><b>Recovery</b><p className="mt-1 text-xs text-ink-400">Sleep, rest days and enough food support training, growth and performance.</p></div></div></section>

      <section className="card border-amber-500/10 bg-amber-500/[0.03] p-4"><div className="flex gap-3"><ShieldCheck className="shrink-0 text-amber-400" size={19}/><p className="text-xs leading-5 text-ink-300">Shadow AI is a training planner, not a medical service. Progress should be gradual and technique comes first. If exercise causes pain, stop and tell a parent/guardian or qualified professional. For minors, the plan avoids extreme dieting and is focused on health, movement and performance.</p></div></section>
      <div className="flex justify-end"><button onClick={reset} className="btn-ghost"><RotateCcw size={16}/> Start over</button></div>
    </>}
  </div>;
}
