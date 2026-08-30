export type ShadowGoal = 'strength' | 'fitness' | 'mobility' | 'sports';
export type ShadowDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ShadowEquipment = 'bodyweight' | 'home' | 'gym';
export type ShadowGroup = 'push' | 'pull' | 'legs' | 'core' | 'plyometric' | 'mobility' | 'conditioning';
export type ShadowSlot = 'warmup' | 'main' | 'accessory' | 'finisher';

export type ShadowExercise = {
  id: string;
  name: string;
  group: ShadowGroup;
  target: string;
  pattern: string;
  equipment: ShadowEquipment[];
  goals: ShadowGoal[];
  difficulty: ShadowDifficulty;
  slot: ShadowSlot;
  reps: string;
  rest: number;
  fatigue: 1 | 2 | 3 | 4 | 5;
  cue: string;
};

export type ShadowDay = {
  day: number;
  title: string;
  focus: ShadowGroup[];
  exercises: ShadowExercise[];
  estimatedMinutes: number;
};

export type ShadowPlan = {
  weeks: ShadowDay[][];
  validation: { valid: boolean; issues: string[]; warnings: string[] };
};

const E = (id: string, name: string, group: ShadowGroup, target: string, pattern: string, equipment: ShadowEquipment[], goals: ShadowGoal[], difficulty: ShadowDifficulty, slot: ShadowSlot, reps: string, rest: number, fatigue: 1|2|3|4|5, cue: string): ShadowExercise => ({ id, name, group, target, pattern, equipment, goals, difficulty, slot, reps, rest, fatigue, cue });

export const SHADOW_EXERCISES: ShadowExercise[] = [
  E('pushup','Push-up','push','Chest + triceps','horizontal-push',['bodyweight','home','gym'],['strength','fitness'], 'beginner','main','6–15',75,3,'Brace the core and keep one line.'),
  E('pike-pushup','Pike Push-up','push','Shoulders + triceps','vertical-push',['bodyweight','home','gym'],['strength','fitness','sports'],'intermediate','main','5–12',90,3,'Lower under control.'),
  E('close-pushup','Close-grip Push-up','push','Triceps + chest','horizontal-push',['bodyweight','home','gym'],['strength','fitness'],'intermediate','accessory','6–12',75,3,'Keep elbows controlled.'),
  E('floor-press','Backpack Floor Press','push','Chest + triceps','horizontal-push',['home'],['strength'],'intermediate','main','8–15',90,4,'Use only a secure load.'),
  E('row','Backpack Row','pull','Back + biceps','horizontal-pull',['home'],['strength','fitness'],'beginner','main','8–15',75,3,'Pull toward the ribs.'),
  E('band-row','Band Row','pull','Upper back','horizontal-pull',['home'],['strength','fitness'],'beginner','accessory','10–15',75,2,'Do not swing.'),
  E('pullup','Assisted Pull-up','pull','Lats + arms','vertical-pull',['gym'],['strength','sports'],'intermediate','main','5–10',105,4,'Lower slowly.'),
  E('pulldown','Lat Pulldown','pull','Lats','vertical-pull',['gym'],['strength','fitness'],'beginner','main','8–12',90,3,'Pull to upper chest.'),
  E('squat','Bodyweight Squat','legs','Quads + glutes','squat',['bodyweight','home','gym'],['strength','fitness'],'beginner','main','8–20',75,3,'Keep the feet stable and knees tracking naturally.'),
  E('reverse-lunge','Reverse Lunge','legs','Quads + glutes','unilateral-knee',['bodyweight','home','gym'],['strength','fitness','sports'],'beginner','main','6–12/side',75,3,'Stay balanced.'),
  E('split-squat','Split Squat','legs','Quads + glutes','unilateral-knee',['bodyweight','home','gym'],['strength','fitness'],'intermediate','main','6–12/side',90,4,'Use support if needed.'),
  E('stepup','Step-up','legs','Legs + balance','unilateral-knee',['home','gym'],['fitness','sports'],'beginner','accessory','6–12/side',75,3,'Use a stable step.'),
  E('bridge','Glute Bridge','legs','Glutes + hips','hip-extension',['bodyweight','home','gym'],['strength','fitness','sports'],'beginner','accessory','10–20',60,2,'Pause at the top.'),
  E('calf','Calf Raise','legs','Calves','plantar-flexion',['bodyweight','home','gym'],['strength','sports'],'beginner','accessory','10–20',50,2,'Use a steady tempo.'),
  E('deadbug','Dead Bug','core','Core control','anti-extension',['bodyweight','home','gym'],['strength','fitness','sports'],'beginner','accessory','6–12/side',50,2,'Keep the lower back controlled.'),
  E('plank','Front Plank','core','Core','anti-extension',['bodyweight','home','gym'],['strength','fitness'],'beginner','accessory','20–60s',50,2,'Breathe normally.'),
  E('side-plank','Side Plank','core','Lateral stability','anti-lateral-flexion',['bodyweight','home','gym'],['strength','sports'],'beginner','accessory','15–45s/side',50,2,'Stack the hips.'),
  E('arm-circles','Arm Circles','mobility','Shoulders','shoulder-mobility',['bodyweight','home','gym'],['mobility','fitness','sports'],'beginner','warmup','30s',20,1,'Smooth controlled circles.'),
  E('greatest-stretch','World’s Greatest Stretch','mobility','Hips + T-spine','multi-joint-mobility',['bodyweight','home','gym'],['mobility','fitness','sports'],'beginner','warmup','4/side',20,1,'Never force the range.'),
  E('ankle-rocks','Ankle Rocks','mobility','Ankles','ankle-mobility',['bodyweight','home','gym'],['mobility','sports'],'beginner','warmup','10/side',20,1,'Keep the heel grounded.'),
  E('pogo','Pogo Hops','plyometric','Elasticity + landing','ankle-pogo',['bodyweight','home','gym'],['sports','fitness'],'intermediate','finisher','3×10–20s',75,3,'Quiet landings.'),
  E('snapdown','Snap-down','plyometric','Landing mechanics','landing',['bodyweight','home','gym'],['sports','fitness'],'beginner','main','3×4–6',75,2,'Own every landing.'),
  E('squat-jump','Squat Jump','plyometric','Vertical power','vertical-jump',['bodyweight','home','gym'],['sports'],'intermediate','main','3×4–8',105,4,'Quality over height.'),
  E('lateral-bound','Lateral Bound','plyometric','Lateral power','lateral-jump',['bodyweight','home','gym'],['sports'],'advanced','main','3×4–8/side',105,4,'Stabilize each landing.'),
  E('mountain','Mountain Climber','conditioning','Conditioning + core','locomotion',['bodyweight','home','gym'],['fitness','sports'],'beginner','finisher','20–45s',50,3,'Choose a sustainable pace.'),
  E('jacks','Jumping Jack','conditioning','Conditioning','locomotion',['bodyweight','home','gym'],['fitness','sports'],'beginner','finisher','30–60s',45,2,'Step instead of jump if needed.'),
];

const difficultyRank: Record<ShadowDifficulty, number> = { beginner: 1, intermediate: 2, advanced: 3 };
const groupTitle: Record<ShadowGroup, string> = { push:'Push', pull:'Pull', legs:'Legs', core:'Core', plyometric:'Power', mobility:'Mobility', conditioning:'Conditioning' };

function candidates(group: ShadowGroup, equipment: ShadowEquipment, goal: ShadowGoal, difficulty: ShadowDifficulty, used: Set<string>, week: number) {
  return SHADOW_EXERCISES.filter(x => x.group === group && x.equipment.includes(equipment) && x.goals.includes(goal) && difficultyRank[x.difficulty] <= difficultyRank[difficulty] && !used.has(x.id))
    .sort((a,b) => (b.goals.includes(goal) ? 1 : 0) - (a.goals.includes(goal) ? 1 : 0) || a.fatigue - b.fatigue || ((a.id.length + week) % 3) - ((b.id.length + week) % 3));
}

function pick(group: ShadowGroup, equipment: ShadowEquipment, goal: ShadowGoal, difficulty: ShadowDifficulty, used: Set<string>, week: number): ShadowExercise | null {
  const list = candidates(group,equipment,goal,difficulty,used,week);
  const item = list[0] ?? SHADOW_EXERCISES.find(x => x.group === group && x.equipment.includes(equipment) && !used.has(x.id)) ?? null;
  if (item) used.add(item.id);
  return item;
}

function dayBlueprint(days: number, goal: ShadowGoal): { title: string; focus: ShadowGroup[] }[] {
  if (goal === 'mobility') return Array.from({length: days}, (_,i) => ({ title: `Mobility ${i+1}`, focus:['mobility','core'] }));
  if (goal === 'sports') {
    const six = [
      {title:'Push + Power',focus:['push','core','mobility'] as ShadowGroup[]},
      {title:'Pull + Core',focus:['pull','core','mobility'] as ShadowGroup[]},
      {title:'Legs + Vertical Power',focus:['legs','plyometric','mobility'] as ShadowGroup[]},
      {title:'Upper Strength',focus:['push','pull','core'] as ShadowGroup[]},
      {title:'Lower Power',focus:['legs','plyometric','core'] as ShadowGroup[]},
      {title:'Conditioning + Mobility',focus:['conditioning','mobility','core'] as ShadowGroup[]},
    ];
    return six.slice(0,days);
  }
  if (days === 6) return [
    {title:'Push',focus:['push','core']},{title:'Pull',focus:['pull','core']},{title:'Legs',focus:['legs','core']},
    {title:'Upper',focus:['push','pull','core']},{title:'Lower',focus:['legs','core']},{title:'Conditioning + Mobility',focus:['conditioning','mobility','core']},
  ];
  if (days === 5) return [
    {title:'Push',focus:['push','core']},{title:'Pull',focus:['pull','core']},{title:'Legs',focus:['legs','core']},{title:'Upper',focus:['push','pull','core']},{title:'Conditioning',focus:['conditioning','mobility','core']},
  ];
  if (days === 4) return [
    {title:'Upper Push',focus:['push','core']},{title:'Lower',focus:['legs','core']},{title:'Upper Pull',focus:['pull','core']},{title:'Full Body',focus:['push','pull','legs','core']},
  ];
  return Array.from({length:days}, (_,i) => ({title:`Full Body ${String.fromCharCode(65+i)}`,focus:['push','pull','legs','core']}));
}

export function validateShadowDay(day: ShadowDay): { valid: boolean; issues: string[]; warnings: string[] } {
  const issues: string[] = [];
  const warnings: string[] = [];
  const ids = new Set<string>();
  const patterns = new Set<string>();
  for (const x of day.exercises) {
    if (ids.has(x.id)) issues.push(`Duplicate exercise: ${x.name}`);
    ids.add(x.id);
    if (patterns.has(x.pattern) && x.slot === 'main') warnings.push(`Repeated movement pattern: ${x.pattern}`);
    patterns.add(x.pattern);
  }
  if (day.exercises.filter(x=>x.slot==='main').length < 2 && day.focus.some(g=>g==='push'||g==='pull'||g==='legs')) warnings.push('Low main-exercise variety for this session.');
  const highFatigue = day.exercises.reduce((n,x)=>n+x.fatigue,0);
  if (highFatigue > 22) warnings.push('High session fatigue; consider reducing accessories.');
  if (day.exercises.some(x=>x.group==='plyometric') && !day.exercises.some(x=>x.group==='mobility')) warnings.push('Power session should include a mobility/landing preparation element.');
  return { valid: issues.length === 0, issues, warnings };
}

export function validateShadowPlan(weeks: ShadowDay[][]) {
  const issues: string[] = [];
  const warnings: string[] = [];
  weeks.forEach((week,wi) => week.forEach(day => { const result=validateShadowDay(day); result.issues.forEach(x=>issues.push(`W${wi+1} D${day.day}: ${x}`)); result.warnings.forEach(x=>warnings.push(`W${wi+1} D${day.day}: ${x}`)); }));
  return {valid:issues.length===0,issues,warnings};
}

export function buildShadowPlan({ days=6, minutes=50, equipment='bodyweight' as ShadowEquipment, goal='strength' as ShadowGoal, difficulty='intermediate' as ShadowDifficulty, weeks=12 }: {days?:number; minutes?:number; equipment?:ShadowEquipment; goal?:ShadowGoal; difficulty?:ShadowDifficulty; weeks?:number}): ShadowPlan {
  const blueprints = dayBlueprint(Math.max(1,Math.min(6,days)),goal);
  const allWeeks: ShadowDay[][] = [];
  for (let week=1; week<=weeks; week++) {
    const phase = week<=4 ? 1 : week<=8 ? 1.1 : 1.2;
    const weekDays = blueprints.map((bp,index) => {
      const used = new Set<string>();
      const items: ShadowExercise[] = [];
      const warm = pick('mobility',equipment,goal,difficulty,used,week);
      if (warm && minutes >= 35) items.push(warm);
      const mainGroups = bp.focus.filter(g => g!=='core' && g!=='mobility' && g!=='conditioning');
      const mainCount = minutes < 35 ? 2 : minutes < 55 ? 3 : 4;
      for (let i=0;i<mainCount;i++) {
        const group = mainGroups[i % Math.max(1,mainGroups.length)];
        if (group) { const item=pick(group,equipment,goal,difficulty,used,week+index+i); if(item) items.push(item); }
      }
      if (bp.focus.includes('core')) {
        const core = pick('core',equipment,goal,difficulty,used,week+index+7); if(core) items.push(core);
      }
      if (bp.focus.includes('conditioning')) {
        const c = pick('conditioning',equipment,goal,difficulty,used,week+index+11); if(c) items.push(c);
      }
      if (bp.focus.includes('plyometric')) {
        const p = pick('plyometric',equipment,'sports',difficulty,used,week+index+13); if(p) items.splice(Math.min(2,items.length),0,p);
      }
      if (bp.focus.includes('mobility') && !items.some(x=>x.group==='mobility')) {
        const m=pick('mobility',equipment,'mobility',difficulty,used,week+index+17); if(m) items.push(m);
      }
      const scaled = items.map(x => ({...x, rest: Math.round(x.rest / phase), reps: x.reps}));
      return {day:index+1,title:bp.title,focus:bp.focus,exercises:scaled,estimatedMinutes:Math.min(minutes,Math.max(20,Math.round(scaled.reduce((n,x)=>n+(x.rest+45),0)/60)))};
    });
    allWeeks.push(weekDays);
  }
  return {weeks:allWeeks,validation:validateShadowPlan(allWeeks)};
}

export function explainExercise(exercise: ShadowExercise) {
  return `${exercise.name} targets ${exercise.target}. Movement pattern: ${exercise.pattern}. ${exercise.cue}`;
}

export function findSwap(exercise: ShadowExercise, equipment: ShadowEquipment, goal: ShadowGoal, difficulty: ShadowDifficulty, excluded: string[] = []) {
  return SHADOW_EXERCISES.filter(x => x.group===exercise.group && x.pattern===exercise.pattern && x.equipment.includes(equipment) && x.goals.includes(goal) && difficultyRank[x.difficulty] <= difficultyRank[difficulty] && x.id!==exercise.id && !excluded.includes(x.id)).sort((a,b)=>a.fatigue-b.fatigue)[0] ?? null;
}

export function summarizePlan(plan: ShadowPlan) {
  const week = plan.weeks[0] ?? [];
  const groups = week.map(d => `${d.day}. ${d.title}: ${d.exercises.map(x=>x.name).join(', ')}`).join('\n');
  return `Shadow generated ${plan.weeks.length} weeks with ${week.length} training days.\n${groups}\nValidation: ${plan.validation.valid ? 'passed' : 'needs review'}.`;
}
