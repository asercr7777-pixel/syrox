import type { CustomWorkoutDay, ExerciseEntry } from '../store/types';

type Goal = 'strength' | 'muscle' | 'fitness' | 'vertical' | 'athletic';
type Level = 'beginner' | 'intermediate' | 'advanced';
type Equipment = 'bodyweight' | 'home' | 'gym';

export type CoachProfile = { goal: Goal; level: Level; equipment: Equipment; days: 6; sessionMinutes?: number };
export type CoachCommand = { kind: 'generate' | 'regenerate_day' | 'replace_exercise' | 'increase' | 'decrease' | 'focus'; dayIndex?: number; text: string };

const BANK: Record<string, Array<{ name: string; reps: string }>> = {
  push: [{name:'Push-up',reps:'8–15'},{name:'Diamond Push-up',reps:'6–12'},{name:'Pike Push-up',reps:'6–12'},{name:'Wide Push-up',reps:'8–15'}],
  pull: [{name:'Backpack Row',reps:'8–15'},{name:'Towel Row Isometric',reps:'20–30s'},{name:'Prone Y-T Raise',reps:'10–15'},{name:'Reverse Snow Angel',reps:'10–15'}],
  legs: [{name:'Bodyweight Squat',reps:'12–20'},{name:'Reverse Lunge',reps:'8–12/side'},{name:'Bulgarian Split Squat',reps:'8–12/side'},{name:'Glute Bridge',reps:'12–20'},{name:'Single-Leg Calf Raise',reps:'12–20/side'}],
  core: [{name:'Dead Bug',reps:'8–12/side'},{name:'Front Plank',reps:'30–60s'},{name:'Side Plank',reps:'20–45s/side'},{name:'Hollow Hold',reps:'20–40s'}],
  mobility: [{name:'World’s Greatest Stretch',reps:'3–5/side'},{name:'Ankle Mobility',reps:'10/side'},{name:'Hip 90/90 Flow',reps:'6–10/side'}],
  plyo: [{name:'Pogo Hops',reps:'3 × 15s'},{name:'Snap-down',reps:'3 × 5'},{name:'Squat Jump',reps:'3 × 5'},{name:'Lateral Bound',reps:'3 × 5/side'},{name:'Broad Jump',reps:'3 × 4'}],
};

const titles: Record<Goal,string[]> = {
  strength:['Press Strength','Pull Strength','Leg Strength','Upper Strength','Lower Strength','Full Strength'],
  muscle:['Chest + Triceps','Back + Biceps','Legs','Upper Body','Lower Body','Full Body'],
  fitness:['Upper Engine','Lower Engine','Back + Core','Full Body','Conditioning','Mobility'],
  vertical:['Jump Force','Upper Strength','Explosive Legs','Back + Core','Power Legs','Recovery'],
  athletic:['Upper Power','Lower Power','Pull + Core','Explosive Legs','Upper Hybrid','Athletic Base'],
};

const profiles: Record<Goal,string[][]> = {
  strength:[['push','core'],['pull','core'],['legs','core'],['push','pull'],['legs','core'],['pull','push']],
  muscle:[['push','core'],['pull','core'],['legs','core'],['push','pull'],['legs','core'],['pull','push']],
  fitness:[['push','core'],['legs','core'],['pull','core'],['push','pull'],['legs','plyo'],['mobility','core']],
  vertical:[['legs','core'],['push','core'],['legs','core'],['pull','core'],['legs','core'],['mobility','core']],
  athletic:[['push','core'],['legs','plyo'],['pull','core'],['legs','plyo'],['push','pull'],['legs','core']],
};

const uid = () => crypto.randomUUID();
function ex(pool:string,index:number,sets:number,section:ExerciseEntry['section']):ExerciseEntry { const item=BANK[pool][index%BANK[pool].length]; return {id:uid(),name:item.name,sets,reps:item.reps,section,completed:false}; }

export function generateCoachPlan(p:CoachProfile):CustomWorkoutDay[] {
  const sets=p.level==='beginner'?2:p.level==='intermediate'?3:4;
  return profiles[p.goal].map((pattern,i)=>{
    const main:ExerciseEntry[]=[];
    pattern.forEach((pool,j)=>{
      if(pool==='plyo') main.push(ex('plyo',i+j,2,'plyometric'));
      else if(pool==='mobility') main.push(ex('mobility',i+j,1,'stretching'));
      else main.push(ex(pool,i+j,sets,'main'),ex(pool,i+j+1,sets,'main'));
    });
    const stretching=main.some(x=>x.section==='stretching')?[]:[ex('mobility',i,1,'stretching')];
    const plyo=(p.goal==='vertical'||p.goal==='athletic'||i===4)&&!main.some(x=>x.section==='plyometric')?[ex('plyo',i,2,'plyometric')]:[];
    return {id:`day${i+1}`,name:titles[p.goal][i],emoji:['🔥','⚡','🦾','🗡️','👑','💀'][i],exercises:[...stretching,...main,...plyo]};
  });
}

export function understandCommand(text:string):CoachCommand {
  const t=text.toLowerCase();
  if(/بدل|غيّر|غير|replace|swap/.test(t)) return {kind:'replace_exercise',text};
  if(/زود|أصعب|اصعب|harder|increase/.test(t)) return {kind:'increase',text};
  if(/خف|أسهل|اسهل|easier|decrease/.test(t)) return {kind:'decrease',text};
  if(/ركز|focus|تركيز/.test(t)) return {kind:'focus',text};
  if(/يوم|day/.test(t)) return {kind:'regenerate_day',text};
  return {kind:'generate',text};
}

export function applyCoachAdjustment(plan:CustomWorkoutDay[], command:CoachCommand, locked:Set<string>):CustomWorkoutDay[] {
  if(command.kind==='regenerate_day' && command.dayIndex!=null && !locked.has(plan[command.dayIndex]?.id)) {
    const d=plan[command.dayIndex]; return plan.map((x,i)=>i===command.dayIndex?{...x,exercises:x.exercises.map(e=>({...e,id:uid(),completed:false}))}:x);
  }
  return plan.map(day=>{
    if(locked.has(day.id)) return day;
    let exercises=day.exercises;
    if(command.kind==='increase') exercises=exercises.map(e=>e.section==='main'?{...e,sets:Math.min(5,e.sets+1)}:e);
    if(command.kind==='decrease') exercises=exercises.map(e=>e.section==='main'?{...e,sets:Math.max(1,e.sets-1)}:e);
    if(command.kind==='replace_exercise' && exercises.some(e=>e.section==='main')) {
      const idx=exercises.findIndex(e=>e.section==='main'); const old=exercises[idx];
      const pool=old.name.toLowerCase().includes('squat')||old.name.toLowerCase().includes('lunge')?'legs':old.name.toLowerCase().includes('push')?'push':old.name.toLowerCase().includes('row')?'pull':'core';
      const replacement=ex(pool,idx+1,old.sets,'main'); exercises=exercises.map((e,i)=>i===idx?replacement:e);
    }
    return {...day,exercises};
  });
}
