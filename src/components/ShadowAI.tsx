import { useMemo, useState } from 'react';
import { Brain, Dumbbell, Apple, Moon, ShieldCheck, Sparkles, ChevronRight, RotateCcw } from 'lucide-react';

type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'extreme';
type Goal = 'strength' | 'fitness' | 'mobility' | 'sports';

const difficultyMeta: Record<Difficulty, { label: string; note: string }> = {
  beginner: { label: 'Beginner', note: 'Foundation and technique' },
  intermediate: { label: 'Intermediate', note: 'More volume and challenge' },
  advanced: { label: 'Advanced', note: 'High-skill progression' },
  extreme: { label: 'Extreme', note: 'Only for experienced users' },
};

const goalMeta: Record<Goal, string> = { strength: 'Strength', fitness: 'Fitness', mobility: 'Mobility', sports: 'Sports performance' };

export function ShadowAI() {
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [goal, setGoal] = useState<Goal>('fitness');
  const [days, setDays] = useState(3);
  const [minutes, setMinutes] = useState(45);
  const [equipment, setEquipment] = useState('bodyweight');
  const [age, setAge] = useState('');
  const [preferences, setPreferences] = useState('');
  const [generated, setGenerated] = useState(false);

  const plan = useMemo(() => {
    const baseSets = difficulty === 'beginner' ? 2 : difficulty === 'intermediate' ? 3 : 3;
    const repRange = difficulty === 'beginner' ? '8–12' : difficulty === 'intermediate' ? '8–15' : '6–12';
    const daysText = days === 1 ? 'Full body' : days === 2 ? 'Full body A / B' : `${days}-day split`;
    return { baseSets, repRange, daysText };
  }, [difficulty, days]);

  const generate = () => setGenerated(true);
  const reset = () => { setGenerated(false); setDifficulty('beginner'); setGoal('fitness'); setDays(3); setMinutes(45); setEquipment('bodyweight'); setAge(''); setPreferences(''); };

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-ember-500/20 bg-gradient-to-br from-ember-500/10 via-black/30 to-transparent p-5 sm:p-7">
        <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-ember-500/10 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="rounded-2xl border border-ember-500/30 bg-ember-500/10 p-3 text-ember-400"><Brain size={28} /></div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><h1 className="section-title">Shadow AI</h1><span className="chip border border-ember-500/20 bg-ember-500/10 text-ember-300"><Sparkles size={13} /> Personal Fitness</span></div>
            <p className="mt-1 text-sm text-ink-300">Build a gradual training and nutrition routine around your level, goal and schedule.</p>
          </div>
        </div>
      </header>

      <section className="card p-4 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="font-display text-lg font-bold">1. Choose your difficulty</h2><p className="text-xs text-ink-400">You control the starting level.</p></div><ShieldCheck className="text-emerald2-400" size={20} /></div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {(Object.keys(difficultyMeta) as Difficulty[]).map((id) => <button key={id} onClick={() => setDifficulty(id)} className={`rounded-xl border p-3 text-left transition ${difficulty === id ? 'border-ember-500/50 bg-ember-500/10' : 'border-white/5 bg-ink-950/40 hover:border-white/15'}`}><p className="font-semibold text-sm">{difficultyMeta[id].label}</p><p className="mt-1 text-[11px] text-ink-400">{difficultyMeta[id].note}</p></button>)}
        </div>
      </section>

      <section className="card p-4 sm:p-6">
        <div className="mb-5 flex items-center gap-2"><Dumbbell size={19} className="text-ember-400" /><h2 className="font-display text-lg font-bold">2. Personal setup</h2></div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-ink-300">Age (optional)<input value={age} onChange={e => setAge(e.target.value.replace(/\D/g, '').slice(0, 3))} inputMode="numeric" placeholder="Age" className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none focus:border-ember-500/50" /></label>
          <label className="text-sm text-ink-300">Goal<select value={goal} onChange={e => setGoal(e.target.value as Goal)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none"><option value="strength">Strength</option><option value="fitness">Fitness</option><option value="mobility">Mobility</option><option value="sports">Sports performance</option></select></label>
          <label className="text-sm text-ink-300">Training days: <b className="text-white">{days}</b><input type="range" min="1" max="6" value={days} onChange={e => setDays(Number(e.target.value))} className="mt-2 w-full accent-orange-500" /></label>
          <label className="text-sm text-ink-300">Session time: <b className="text-white">{minutes} min</b><input type="range" min="20" max="90" step="5" value={minutes} onChange={e => setMinutes(Number(e.target.value))} className="mt-2 w-full accent-orange-500" /></label>
          <label className="text-sm text-ink-300">Equipment<select value={equipment} onChange={e => setEquipment(e.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none"><option value="bodyweight">Bodyweight</option><option value="home">Home equipment</option><option value="gym">Gym</option></select></label>
          <label className="text-sm text-ink-300">Food preferences / allergies (optional)<input value={preferences} onChange={e => setPreferences(e.target.value)} placeholder="e.g. vegetarian, foods to avoid" className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none focus:border-ember-500/50" /></label>
        </div>
        <button onClick={generate} className="btn-primary mt-5 w-full justify-center sm:w-auto"><Sparkles size={17} /> Generate my plan <ChevronRight size={17} /></button>
      </section>

      {generated && <>
        <section className="card p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="font-display text-lg font-bold">Your gradual training plan</h2><p className="text-xs text-ink-400">{difficultyMeta[difficulty].label} · {goalMeta[goal]} · {plan.daysText} · {minutes} min</p></div><Dumbbell className="text-ember-400" size={21} /></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[['Warm-up', '5–10 min', 'Easy movement + mobility'], ['Main training', `${plan.baseSets} sets × ${plan.repRange}`, equipment === 'bodyweight' ? 'Controlled bodyweight movements' : 'Choose a suitable resistance'], ['Cool-down', '5–10 min', 'Easy movement + relaxed stretching']].map(([title, dose, note]) => <div key={title} className="rounded-xl border border-white/5 bg-ink-950/40 p-4"><p className="font-semibold">{title}</p><p className="mt-1 text-ember-400 text-sm font-medium">{dose}</p><p className="mt-1 text-xs text-ink-400">{note}</p></div>)}
          </div>
          <div className="mt-4 rounded-xl border border-white/5 bg-black/20 p-4 text-sm text-ink-300"><b className="text-white">Progression:</b> keep the same level until the current workload feels controlled, then increase difficulty gradually. If it feels too hard, reduce volume or use an easier variation.</div>
        </section>

        <section className="card p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-2"><Apple size={19} className="text-emerald2-400" /><h2 className="font-display text-lg font-bold">Nutrition guidance</h2></div>
          <div className="grid gap-3 md:grid-cols-3"><div className="rounded-xl border border-white/5 bg-ink-950/40 p-4"><b>Balanced meals</b><p className="mt-1 text-xs text-ink-400">Include a protein source, grains/starches, vegetables or fruit, and healthy fats across the day.</p></div><div className="rounded-xl border border-white/5 bg-ink-950/40 p-4"><b>Hydration</b><p className="mt-1 text-xs text-ink-400">Drink regularly and increase fluids around activity and hot weather.</p></div><div className="rounded-xl border border-white/5 bg-ink-950/40 p-4"><b>Recovery</b><p className="mt-1 text-xs text-ink-400">Regular meals, enough sleep and rest days support training and growth.</p></div></div>
          {preferences && <p className="mt-3 text-xs text-ink-400">Preferences saved for this plan: <span className="text-ink-200">{preferences}</span></p>}
        </section>

        <section className="card border-amber-500/10 bg-amber-500/[0.03] p-4 sm:p-5">
          <div className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-amber-400" size={19} /><p className="text-xs leading-5 text-ink-300">Shadow AI is a planning tool, not a doctor or dietitian. Training should stay comfortable and age-appropriate. Stop if you feel pain, and for an injury, medical condition, or special dietary need, ask a parent/guardian and a qualified professional.</p></div>
        </section>

        <div className="flex justify-end"><button onClick={reset} className="btn-ghost"><RotateCcw size={16} /> Start over</button></div>
      </>}

      <div className="flex items-center gap-2 text-xs text-ink-500"><Moon size={14} /> Plans can be adjusted as your experience and schedule change.</div>
    </div>
  );
}
