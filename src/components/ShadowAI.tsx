import { useMemo, useState } from 'react';
import { Brain, Check, Lock, MessageCircle, RefreshCw, Sparkles, Target, Unlock, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { CustomWorkoutDay } from '../store/types';
import { applyCoachAdjustment, generateCoachPlan, understandCommand, type CoachProfile } from '../lib/shadowCoach';

type Goal = CoachProfile['goal'];
type Level = CoachProfile['level'];
type Equipment = CoachProfile['equipment'];

const goals: Array<[Goal,string]> = [['strength','Strength'],['muscle','Muscle'],['fitness','Fitness'],['vertical','Vertical Jump'],['athletic','Athletic']];
const levels: Level[] = ['beginner','intermediate','advanced'];
const equipment: Array<[Equipment,string]> = [['bodyweight','No equipment'],['home','Home'],['gym','Gym']];

function cloneWithFreshIds(days: CustomWorkoutDay[]) {
  return days.map((d) => ({ ...d, exercises: d.exercises.map((e) => ({ ...e, completed: false })) }));
}

export function ShadowAI() {
  const { state, setNote } = useStore();
  const [goal, setGoal] = useState<Goal>('strength');
  const [level, setLevel] = useState<Level>('intermediate');
  const [equipmentType, setEquipmentType] = useState<Equipment>('bodyweight');
  const [plan, setPlan] = useState<CustomWorkoutDay[] | null>(null);
  const [locked, setLocked] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [coachReply, setCoachReply] = useState('Tell me what you want to change and I’ll adjust the plan.');
  const [busy, setBusy] = useState(false);

  const profile = useMemo<CoachProfile>(() => ({ goal, level, equipment: equipmentType, days: 6 }), [goal, level, equipmentType]);

  const generate = () => {
    setBusy(true);
    requestAnimationFrame(() => {
      setPlan(generateCoachPlan(profile));
      setLocked(new Set());
      setCoachReply('Your 6-day blueprint is ready. Lock any day you want to protect, then ask me for changes.');
      setBusy(false);
    });
  };

  const apply = () => {
    if (!plan) return;
    setNote('__six_day_workout_config__', JSON.stringify(plan));
    setCoachReply('Applied. Your Workout section now uses this 6-day blueprint.');
  };

  const regenerateDay = (index: number) => {
    if (!plan || locked.has(plan[index].id)) return;
    const fresh = generateCoachPlan(profile)[index];
    setPlan(plan.map((day, i) => i === index ? fresh : day));
    setCoachReply(`Day ${index + 1} regenerated while protected days stayed untouched.`);
  };

  const sendCommand = () => {
    const text = message.trim();
    if (!text || !plan) return;
    const command = understandCommand(text);
    const dayMatch = text.match(/(?:day|يوم)\s*([1-6])/i);
    const commandWithDay = dayMatch ? { ...command, dayIndex: Number(dayMatch[1]) - 1 } : command;
    const next = applyCoachAdjustment(plan, commandWithDay, locked);
    setPlan(cloneWithFreshIds(next));
    setMessage('');
    setCoachReply(command.kind === 'generate'
      ? 'I understood the request. Generate a fresh blueprint if you want a complete rebuild.'
      : 'Done. I adjusted the unlocked part of your plan.');
  };

  const toggleLock = (id: string) => {
    setLocked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-ember-500/20 bg-gradient-to-br from-ember-500/10 via-black/30 to-transparent p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl border border-ember-500/30 bg-ember-500/10 p-3 text-ember-400"><Brain size={28}/></div>
          <div><div className="flex flex-wrap items-center gap-2"><h1 className="section-title">Shadow AI</h1><span className="chip"><Sparkles size={13}/> AI Workout Coach</span></div><p className="mt-1 text-sm text-ink-300">Build, edit and apply a personalized 6-day workout without leaving Forged.</p></div>
        </div>
      </header>

      <section className="card p-4 sm:p-6 space-y-5">
        <div><div className="mb-3 flex items-center gap-2"><Target size={18} className="text-ember-400"/><h2 className="font-display text-lg font-bold">Goal</h2></div><div className="grid grid-cols-2 gap-2 md:grid-cols-5">{goals.map(([value,label]) => <button key={value} onClick={() => setGoal(value)} className={`rounded-xl border p-3 text-sm font-bold ${goal===value?'border-ember-500/60 bg-ember-500/10 text-ember-300':'border-white/5 bg-black/20'}`}>{label}</button>)}</div></div>
        <div><p className="mb-2 text-sm text-ink-300">Experience</p><div className="grid grid-cols-3 gap-2">{levels.map(value => <button key={value} onClick={() => setLevel(value)} className={`rounded-xl border p-3 text-sm font-bold capitalize ${level===value?'border-ember-500/60 bg-ember-500/10 text-ember-300':'border-white/5 bg-black/20'}`}>{value}</button>)}</div></div>
        <div><p className="mb-2 text-sm text-ink-300">Equipment</p><div className="grid grid-cols-3 gap-2">{equipment.map(([value,label]) => <button key={value} onClick={() => setEquipmentType(value)} className={`rounded-xl border p-3 text-sm font-bold ${equipmentType===value?'border-ember-500/60 bg-ember-500/10 text-ember-300':'border-white/5 bg-black/20'}`}>{label}</button>)}</div></div>
        <button onClick={generate} disabled={busy} className="btn-primary w-full sm:w-auto disabled:opacity-60"><Sparkles size={17}/>{busy ? 'Building...' : 'Generate 6-Day Program'}</button>
      </section>

      <section className="card p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2"><MessageCircle size={18} className="text-ember-400"/><h2 className="font-display font-bold">Talk to Shadow</h2></div>
        <p className="mb-3 text-sm text-ink-400">Try: “زود الصعوبة” · “خليه أسهل” · “بدل التمرين” · “غير يوم 3”</p>
        <div className="flex gap-2"><input value={message} onChange={(e)=>setMessage(e.target.value)} onKeyDown={(e)=>{if(e.key==='Enter')sendCommand();}} placeholder="Tell Shadow what you want..." className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-ember-500/50"/><button onClick={sendCommand} disabled={!plan||!message.trim()} className="btn-primary px-4 disabled:opacity-50">Send</button></div>
        <div className="mt-3 rounded-xl border border-ember-500/15 bg-ember-500/5 p-3 text-sm text-ink-300"><Zap size={15} className="mr-2 inline text-ember-400"/>{coachReply}</div>
      </section>

      {plan && <>
        <section className="card p-4 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-xl font-bold">Your 6-Day Blueprint</h2><p className="mt-1 text-xs text-ink-400">{level} · {goal} · {equipmentType} · Shadow Coach</p></div><button onClick={apply} className="btn-primary"><Check size={16}/> Apply to Workout</button></div></section>
        <div className="grid gap-4 md:grid-cols-2">{plan.map((day,index) => { const isLocked=locked.has(day.id); return <section key={day.id} className="card p-4"><div className="mb-3 flex items-center justify-between gap-2"><div><span className="text-xs text-ember-400">DAY {index+1}</span><h3 className="font-display text-lg font-bold">{day.emoji} {day.name}</h3></div><div className="flex gap-1"><button onClick={()=>toggleLock(day.id)} className="btn-ghost px-2 py-2" title={isLocked?'Unlock day':'Lock day'}>{isLocked?<Lock size={15}/>:<Unlock size={15}/>}</button><button onClick={()=>regenerateDay(index)} disabled={isLocked} className="btn-ghost px-2 py-2 disabled:opacity-30" title="Regenerate day"><RefreshCw size={15}/></button></div></div><div className="space-y-2">{day.exercises.map(ex => <div key={ex.id} className="flex items-center gap-2 rounded-lg border border-white/5 bg-black/20 p-2.5"><span className="h-2 w-2 shrink-0 rounded-full bg-ember-500"/><div className="min-w-0 flex-1"><b className="text-sm">{ex.name}</b><p className="text-[11px] text-ink-500 capitalize">{ex.section} · {ex.sets} sets × {ex.reps}</p></div></div>)}</div></section>; })}</div>
      </>}
    </div>
  );
}
