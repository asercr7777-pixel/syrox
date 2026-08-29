import { useMemo, useState } from 'react';
import { Brain, Check, Dumbbell, Flame, RefreshCw, Sparkles, Target, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { CustomWorkoutDay, ExerciseEntry } from '../store/types';

type Goal = 'strength' | 'muscle' | 'fitness' | 'vertical' | 'athletic';
type Level = 'beginner' | 'intermediate' | 'advanced';
type Equipment = 'bodyweight' | 'home' | 'gym';

const BANK: Record<string, Array<{ name: string; reps: string }>> = {
  push: [{name:'Push-up',reps:'8–15'},{name:'Diamond Push-up',reps:'6–12'},{name:'Pike Push-up',reps:'6–12'},{name:'Wide Push-up',reps:'8–15'}],
  pull: [{name:'Backpack Row',reps:'8–15'},{name:'Towel Row Isometric',reps:'20–30s'},{name:'Prone Y-T Raise',reps:'10–15'},{name:'Reverse Snow Angel',reps:'10–15'}],
  legs: [{name:'Bodyweight Squat',reps:'12–20'},{name:'Reverse Lunge',reps:'8–12/side'},{name:'Bulgarian Split Squat',reps:'8–12/side'},{name:'Glute Bridge',reps:'12–20'},{name:'Single-Leg Calf Raise',reps:'12–20/side'}],
  core: [{name:'Dead Bug',reps:'8–12/side'},{name:'Front Plank',reps:'30–60s'},{name:'Side Plank',reps:'20–45s/side'},{name:'Hollow Hold',reps:'20–40s'}],
  mobility: [{name:'World’s Greatest Stretch',reps:'3–5/side'},{name:'Ankle Mobility',reps:'10/side'},{name:'Hip 90/90 Flow',reps:'6–10/side'}],
  plyo: [{name:'Pogo Hops',reps:'3 × 15s'},{name:'Snap-down',reps:'3 × 5'},{name:'Squat Jump',reps:'3 × 5'},{name:'Lateral Bound',reps:'3 × 5/side'},{name:'Broad Jump',reps:'3 × 4'}],
};
const emojis = ['🔥','⚡','🦾','🗡️','👑','💀'];
const uid = () => crypto.randomUUID();
function makeExercise(pool: string, index: number, sets: number, section: ExerciseEntry['section']): ExerciseEntry { const e=BANK[pool][index%BANK[pool].length]; return {id:uid(),name:e.name,sets,reps:e.reps,section,completed:false}; }

function buildPlan(goal: Goal, level: Level, days: number): CustomWorkoutDay[] {
  const sets=level==='beginner'?2:level==='intermediate'?3:4;
  const profiles: string[][] = goal==='vertical'
    ? [['legs','core'],['push','core'],['legs','core'],['pull','core'],['legs','core'],['mobility','core']]
    : goal==='athletic'
    ? [['push','core'],['legs','plyo'],['pull','core'],['legs','plyo'],['push','pull'],['legs','core']]
    : goal==='strength'||goal==='muscle'
    ? [['push','core'],['pull','core'],['legs','core'],['push','pull'],['legs','core'],['pull','push']]
    : [['push','core'],['legs','core'],['pull','core'],['push','pull'],['legs','plyo'],['mobility','core']];
  const titles = goal==='vertical' ? ['Jump Force','Upper Strength','Explosive Legs','Back + Core','Power Legs','Recovery']
    : goal==='athletic' ? ['Upper Power','Lower Power','Pull + Core','Explosive Legs','Upper Hybrid','Athletic Base']
    : goal==='strength' ? ['Press Strength','Pull Strength','Leg Strength','Upper Strength','Lower Strength','Full Strength']
    : goal==='muscle' ? ['Chest + Triceps','Back + Biceps','Legs','Upper Body','Lower Body','Full Body']
    : ['Upper Engine','Lower Engine','Back + Core','Full Body','Conditioning','Mobility'];
  return profiles.slice(0,days).map((profile,dayIndex)=>{
    const main: ExerciseEntry[]=[];
    profile.forEach((p,j)=>{ if(p==='push'||p==='pull'||p==='legs') main.push(makeExercise(p,dayIndex+j,sets,'main'),makeExercise(p,dayIndex+j+1,sets,'main')); else if(p==='core') main.push(makeExercise('core',dayIndex+j,sets,'main')); else if(p==='plyo') main.push(makeExercise('plyo',dayIndex+j,2,'plyometric')); else if(p==='mobility') main.push(makeExercise('mobility',dayIndex+j,1,'stretching')); });
    const stretching=main.some(e=>e.section==='stretching')?[]:[makeExercise('mobility',dayIndex,1,'stretching')];
    const plyo=(goal==='vertical'||goal==='athletic'||dayIndex===4)&&!main.some(e=>e.section==='plyometric')?[makeExercise('plyo',dayIndex,2,'plyometric')]:[];
    return {id:`day${dayIndex+1}`,name:titles[dayIndex],emoji:emojis[dayIndex],exercises:[...stretching,...main,...plyo]};
  });
}

export function ShadowAI() {
  const { state, setNote }=useStore();
  const [goal,setGoal]=useState<Goal>('strength');
  const [level,setLevel]=useState<Level>('intermediate');
  const [equipment,setEquipment]=useState<Equipment>('bodyweight');
  const [days,setDays]=useState(6);
  const [plan,setPlan]=useState<CustomWorkoutDay[]|null>(null);
  const [locked,setLocked]=useState<Record<string,boolean>>({});
  const recommendation=useMemo(()=>goal==='vertical'?'Power, landing quality and recovery are prioritized.':goal==='athletic'?'Strength, speed, coordination and plyometrics are balanced.':goal==='muscle'?'Volume is distributed across major movement patterns.':goal==='fitness'?'Balanced strength, conditioning and mobility.':'Strength-focused volume with controlled progression.',[goal]);
  const generate=()=>setPlan(buildPlan(goal,level,days));
  const apply=()=>{ if(!plan)return; const next=plan.map((d,i)=>locked[d.id]&&state.customWorkoutDays[i]?state.customWorkoutDays[i]:d); setNote('__six_day_workout_config__',JSON.stringify(next)); setPlan(next); };
  const regenerateDay=(i:number)=>{ if(!plan||locked[plan[i].id])return; const fresh=buildPlan(goal,level,days)[i]; setPlan(plan.map((d,j)=>j===i?fresh:d)); };
  return <div className="space-y-6">
    <header className="relative overflow-hidden rounded-2xl border border-ember-500/20 bg-gradient-to-br from-ember-500/10 via-black/30 to-transparent p-5 sm:p-7"><div className="flex items-start gap-4"><div className="rounded-2xl border border-ember-500/30 bg-ember-500/10 p-3 text-ember-400"><Brain size={28}/></div><div><div className="flex flex-wrap items-center gap-2"><h1 className="section-title">Shadow AI</h1><span className="chip"><Sparkles size={13}/> AI Workout Builder</span></div><p className="mt-1 text-sm text-ink-300">Build a personalized 6-day program, preview it, lock days, regenerate individual days, then apply it directly to Workout.</p></div></div></header>
    <section className="card p-4 sm:p-6 space-y-5">
      <div><div className="flex items-center gap-2 mb-3"><Target size={18} className="text-ember-400"/><h2 className="font-display text-lg font-bold">What are you training for?</h2></div><div className="grid grid-cols-2 md:grid-cols-5 gap-2">{([['strength','Strength'],['muscle','Muscle'],['fitness','Fitness'],['vertical','Vertical Jump'],['athletic','Athletic']] as const).map(([v,l])=><button key={v} onClick={()=>setGoal(v)} className={`rounded-xl border p-3 text-sm font-bold ${goal===v?'border-ember-500/60 bg-ember-500/10 text-ember-300':'border-white/5 bg-black/20'}`}>{l}</button>)}</div></div>
      <div><p className="mb-2 text-sm text-ink-300">Experience</p><div className="grid grid-cols-3 gap-2">{(['beginner','intermediate','advanced'] as Level[]).map(v=><button key={v} onClick={()=>setLevel(v)} className={`rounded-xl border p-3 text-sm font-bold capitalize ${level===v?'border-ember-500/60 bg-ember-500/10 text-ember-300':'border-white/5 bg-black/20'}`}>{v}</button>)}</div></div>
      <div><p className="mb-2 text-sm text-ink-300">Equipment</p><div className="grid grid-cols-3 gap-2">{([['bodyweight','No equipment'],['home','Home'],['gym','Gym']] as const).map(([v,l])=><button key={v} onClick={()=>setEquipment(v)} className={`rounded-xl border p-3 text-sm font-bold ${equipment===v?'border-ember-500/60 bg-ember-500/10 text-ember-300':'border-white/5 bg-black/20'}`}>{l}</button>)}</div></div>
      <div><div className="flex justify-between text-sm text-ink-300"><span>Training days</span><b className="text-white">{days}</b></div><input type="range" min="1" max="6" value={days} onChange={e=>setDays(+e.target.value)} className="mt-2 w-full"/></div>
      <div className="rounded-xl border border-ember-500/20 bg-ember-500/5 p-3 text-sm text-ink-300"><Zap size={15} className="inline mr-2 text-ember-400"/>{recommendation}</div>
      <button onClick={generate} className="btn-primary w-full sm:w-auto"><Sparkles size={17}/> Generate AI Program</button>
    </section>
    {plan&&<>
      <section className="card p-4 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-xl font-bold">Your 6-Day Blueprint</h2><p className="text-xs text-ink-400 mt-1">{level} · {goal} · {equipment} · generated by Shadow AI</p></div><button onClick={apply} className="btn-primary"><Check size={16}/> Apply to Workout</button></div></section>
      <div className="grid gap-4 md:grid-cols-2">{plan.map((day,i)=><section key={day.id} className="card p-4"><div className="flex items-center justify-between gap-2 mb-3"><div><span className="text-xs text-ember-400">DAY {i+1}</span><h3 className="font-display text-lg font-bold">{day.emoji} {day.name}</h3></div><div className="flex gap-1"><button onClick={()=>setLocked(p=>({...p,[day.id]:!p[day.id]}))} className="btn-ghost px-2 py-2" title="Lock day">{locked[day.id]?<Check size={15}/>:<Dumbbell size={15}/>}</button><button onClick={()=>regenerateDay(i)} className="btn-ghost px-2 py-2" title="Regenerate day"><RefreshCw size={15}/></button></div></div><div className="space-y-2">{day.exercises.map(e=><div key={e.id} className="flex items-center gap-2 rounded-lg border border-white/5 bg-black/20 p-2.5"><span className="h-2 w-2 rounded-full bg-ember-500"/><div className="min-w-0 flex-1"><b className="text-sm">{e.name}</b><p className="text-[11px] text-ink-500 capitalize">{e.section} · {e.sets} sets × {e.reps}</p></div></div>)}</div></section>)}</div>
      <section className="card p-4"><div className="flex items-center gap-2 mb-2"><Flame size={18} className="text-ember-400"/><h3 className="font-display font-bold">How Shadow AI built it</h3></div><p className="text-sm text-ink-400">The builder distributes movement patterns across the week, adds mobility every day, uses plyometrics when your goal benefits from power, and scales sets with experience. Locked days stay protected when you regenerate.</p></section>
    </>}
  </div>;
}
