import type { AppState } from '../store/types';
import { getRankByXp } from '../data/ranks';

interface CoachContext {
  username: string;
  rank: string;
  level: number;
  streak: number;
  xp: number;
  workoutsCompletedToday: number;
  totalWorkoutSeconds: number;
  workoutSessions: { type: string; durationSeconds: number; completedAt: number }[];
  dungeonsCleared: number;
  mainTasks: { id: string; label: string; enabled: boolean }[];
  coreCompleted: Record<string, boolean>;
  history: { date: string; disciplineScore: number; workoutCompleted: boolean; allMainDone: boolean; xpGained: number }[];
}

function buildContext(state: AppState): CoachContext {
  const rank = getRankByXp(state.xp);
  return {
    username: state.username,
    rank: rank.name,
    level: state.level,
    streak: state.streak,
    xp: state.xp,
    workoutsCompletedToday: state.workoutsCompletedToday,
    totalWorkoutSeconds: state.totalWorkoutSeconds,
    workoutSessions: state.workoutSessions,
    dungeonsCleared: state.dungeonsCleared,
    mainTasks: state.mainTasks,
    coreCompleted: state.coreCompleted,
    history: state.history,
  };
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function contains(text: string, words: string[]): boolean {
  const lower = text.toLowerCase();
  return words.some((w) => lower.includes(w));
}

function calculateCalories(text: string): string {
  const lower = text.toLowerCase();
  const weightMatch = lower.match(/(\d+)\s*(?:kg|kgs|kilograms?)/);
  const heightMatch = lower.match(/(\d+)\s*(?:cm|cms|centimeters?)/);
  const ageMatch = lower.match(/(\d+)\s*(?:years?|yrs?|yo|y\/o)/);
  const genderMale = contains(lower, ['male', 'man', 'guy', 'boy', 'm ']);
  const genderFemale = contains(lower, ['female', 'woman', 'girl', 'f ']);

  if (!weightMatch || !heightMatch || !ageMatch) {
    return "I can calculate your daily calories and protein! Just tell me your **weight** (in kg), **height** (in cm), **age**, and whether you're **male or female**. For example:\n\n*I'm 80kg, 180cm, 25 years old, male, and I want to build muscle.*";
  }

  const weight = parseInt(weightMatch[1], 10);
  const height = parseInt(heightMatch[1], 10);
  const age = parseInt(ageMatch[1], 10);
  const isMale = genderMale || !genderFemale;

  let bmr: number;
  if (isMale) {
    bmr = Math.round(10 * weight + 6.25 * height - 5 * age + 5);
  } else {
    bmr = Math.round(10 * weight + 6.25 * height - 5 * age - 161);
  }

  const goal = contains(lower, ['lose', 'cut', 'deficit', 'fat loss']) ? 'lose'
    : contains(lower, ['gain', 'build', 'muscle', 'bulk', 'surplus']) ? 'gain'
    : 'maintain';

  let tdee = bmr;
  if (contains(lower, ['sedentary', 'no exercise', 'desk job', 'inactive'])) tdee = Math.round(bmr * 1.2);
  else if (contains(lower, ['lightly active', '1-3', 'light exercise'])) tdee = Math.round(bmr * 1.375);
  else if (contains(lower, ['moderate', '3-5', 'moderate exercise'])) tdee = Math.round(bmr * 1.55);
  else if (contains(lower, ['very active', '6-7', 'hard exercise'])) tdee = Math.round(bmr * 1.725);
  else if (contains(lower, ['extra active', 'athlete', '2x day', 'twice'])) tdee = Math.round(bmr * 1.9);
  else tdee = Math.round(bmr * 1.375);

  let targetCalories: number;
  let goalLabel: string;
  if (goal === 'lose') {
    targetCalories = tdee - 500;
    goalLabel = 'Fat Loss';
  } else if (goal === 'gain') {
    targetCalories = tdee + 400;
    goalLabel = 'Muscle Building';
  } else {
    targetCalories = tdee;
    goalLabel = 'Maintenance';
  }

  const proteinPerKg = goal === 'gain' ? 2.0 : goal === 'lose' ? 2.2 : 1.6;
  const proteinGrams = Math.round(weight * proteinPerKg);
  const proteinCals = proteinGrams * 4;
  const remainingCals = targetCalories - proteinCals;
  const fatCals = Math.round(remainingCals * 0.3);
  const fatGrams = Math.round(fatCals / 9);
  const carbCals = targetCalories - proteinCals - fatCals;
  const carbGrams = Math.round(carbCals / 4);

  return `## Your Nutrition Plan\n\nBased on your stats (**${weight}kg, ${height}cm, ${age} years old, ${isMale ? 'male' : 'female'}**):\n\n| Metric | Value |\n|---|---|\n| **BMR** | ${bmr} cal/day |\n| **TDEE** (est. lightly active) | ${tdee} cal/day |\n| **Goal** | ${goalLabel} |\n| **Daily Calories** | ${targetCalories} cal |\n\n### Macro Breakdown\n\n| Macro | Grams | Calories |\n|---|---|---|\n| **Protein** | ${proteinGrams}g | ${proteinCals} cal |\n| **Carbs** | ${carbGrams}g | ${carbCals} cal |\n| **Fats** | ${fatGrams}g | ${fatCals} cal |\n\n> **Protein target:** ${proteinGrams}g/day (~${proteinPerKg}g per kg bodyweight). This ${goal === 'lose' ? 'preserves muscle while cutting' : goal === 'gain' ? 'supports muscle growth' : 'maintains your physique'}.\n\nSpread protein across 3–4 meals (${Math.round(proteinGrams / 4)}g–${Math.round(proteinGrams / 3)}g per meal) for best absorption.`;
}

const PPL_ROUTINES = {
  push: `## Push Day Workout\n\n**Warm-up:** 5 min light cardio + arm circles, band pull-aparts (2x15)\n\n| Exercise | Sets | Reps | Rest |\n|---|---|---|---|\n| Bench Press | 4 | 6-8 | 2 min |\n| Overhead Press | 3 | 8-10 | 90s |\n| Incline Dumbbell Press | 3 | 10-12 | 90s |\n| Dips | 3 | 8-12 | 90s |\n| Tricep Pushdowns | 3 | 12-15 | 60s |\n| Lateral Raises | 3 | 15-20 | 60s |\n\n**Focus:** Control the negative (lower over 2-3 seconds). Don't flare elbows on pressing movements — keep them at about 45 degrees from your torso.`,
  pull: `## Pull Day Workout\n\n**Warm-up:** 5 min light cardio + dead hangs (30s x 2), band dislocates\n\n| Exercise | Sets | Reps | Rest |\n|---|---|---|---|\n| Deadlifts | 3 | 5-6 | 3 min |\n| Pull-ups / Lat Pulldown | 4 | 8-10 | 90s |\n| Barbell Row | 3 | 8-10 | 90s |\n| Face Pulls | 3 | 15-20 | 60s |\n| Barbell Curl | 3 | 10-12 | 60s |\n| Hammer Curl | 3 | 12-15 | 60s |\n\n**Focus:** Squeeze your shoulder blades together on every row. Lead with your elbows on pulling movements, not your hands.`,
  legs: `## Leg Day Workout\n\n**Warm-up:** 5 min cycling + bodyweight squats (2x10), hip mobility drills\n\n| Exercise | Sets | Reps | Rest |\n|---|---|---|---|\n| Squats | 4 | 6-8 | 2-3 min |\n| Romanian Deadlift | 3 | 8-10 | 2 min |\n| Leg Press | 3 | 10-12 | 90s |\n| Walking Lunges | 3 | 12/leg | 90s |\n| Leg Curls | 3 | 12-15 | 60s |\n| Calf Raises | 4 | 15-20 | 60s |\n\n**Focus:** Hit depth on squats — aim for at least parallel. Drive through your heels, not your toes. Brace your core before every rep.`,
};

const FULL_BODY_BEGINNER = `## Full-Body Beginner Routine (3x/week)\n\nPerfect if you're just starting out. Do this Monday, Wednesday, and Friday with rest days in between.\n\n| Exercise | Sets | Reps | Rest |\n|---|---|---|---|\n| Squats (bodyweight or goblet) | 3 | 10-12 | 90s |\n| Push-ups (or knee push-ups) | 3 | 8-12 | 90s |\n| Dumbbell Rows | 3 | 10-12 | 90s |\n| Lat Pulldown or Band Pull-down | 3 | 10-12 | 90s |\n| Plank | 3 | 20-30s | 60s |\n| Glute Bridges | 3 | 12-15 | 60s |\n\n**Tips for beginners:**\n- Focus on **form over weight** — learn the movement pattern first\n- Rest at least 48 hours between sessions\n- Add weight only when you can complete all sets and reps with good form\n- Don't train to failure — leave 1-2 reps in reserve`;

const UPPER_LOWER = `## Upper/Lower Split (4x/week)\n\nA great intermediate progression from full-body. Do Upper, Lower, rest, Upper, Lower, rest, rest.\n\n### Upper Day\n| Exercise | Sets | Reps |\n|---|---|---|\n| Bench Press | 4 | 6-8 |\n| Pull-ups | 4 | 8-10 |\n| Overhead Press | 3 | 8-10 |\n| Barbell Row | 3 | 8-10 |\n| Tricep Pushdowns | 3 | 12-15 |\n| Barbell Curl | 3 | 10-12 |\n\n### Lower Day\n| Exercise | Sets | Reps |\n|---|---|---|\n| Squats | 4 | 6-8 |\n| Romanian Deadlift | 3 | 8-10 |\n| Leg Press | 3 | 10-12 |\n| Leg Curls | 3 | 12-15 |\n| Calf Raises | 4 | 15-20 |`;

function getFormGuide(text: string): string | null {
  const lower = text.toLowerCase();
  if (contains(lower, ['squat form', 'how to squat', 'proper squat', 'squat technique'])) {
    return `## How to Squat with Proper Form\n\n1. **Stance:** Feet shoulder-width apart, toes slightly pointed out (15-30°)\n2. **Setup:** Bar on your upper traps, not your neck. Brace your core hard — think about pushing your abs out\n3. **Descent:** Break at the hips and knees simultaneously. Knees track over toes. Go to at least parallel (hip crease below knee)\n4. **Depth:** Aim for below parallel if mobility allows. Don't let your lower back round\n5. **Ascent:** Drive through your heels. Squeeze your glutes at the top. Exhale on the way up\n\n**Common mistakes:**\n- Knees caving inward — actively push them out\n- Heels lifting — work on ankle mobility or elevate heels slightly\n- Looking up — keep neck neutral, look straight ahead or slightly down\n\n> Start light, film yourself from the side, and compare your form to reference videos.`;
  }
  if (contains(lower, ['bench press form', 'how to bench', 'proper bench', 'bench technique'])) {
    return `## How to Bench Press with Proper Form\n\n1. **Setup:** Lie flat, eyes under the bar. Plant feet firmly on the floor. Retract your shoulder blades — pinch them together and down\n2. **Grip:** Hands slightly wider than shoulder-width. Wrap thumbs around the bar\n3. **Unrack:** Have a spotter help, or pull the bar straight over your shoulders\n4. **Descent:** Lower the bar to your lower chest/sternum. Elbows at about 45° from your torso — not flared out 90°\n5. **Touch:** Bar lightly touches your chest. Don't bounce it\n6. **Press:** Drive the bar up and slightly back over your shoulders. Keep your wrists straight\n\n**Common mistakes:**\n- Bouncing the bar off your chest — pause for 1 second at the bottom\n- Lifting your butt off the bench — keep it planted\n- Flaring elbows 90° — causes shoulder impingement over time`;
  }
  if (contains(lower, ['deadlift form', 'how to deadlift', 'proper deadlift', 'deadlift technique'])) {
    return `## How to Deadlift with Proper Form\n\n1. **Setup:** Bar over mid-foot. Stance hip-width apart. Shins close to the bar but not touching yet\n2. **Grip:** Bend at hips, grab the bar just outside your knees. Mixed grip or double overhand (use chalk if available)\n3. **Brace:** Pull slack out of the bar. Take a deep breath, brace your core hard. Drop your hips until shins touch the bar\n4. **Pull:** Drive through the floor with your legs first, then extend your hips. Keep the bar close to your body the entire time\n5. **Lockout:** Stand tall, squeeze your glutes. Don't hyperextend your lower back\n6. **Lower:** Lower the bar under control — hips back, then bend knees once the bar passes them\n\n**Common mistakes:**\n- Rounding your lower back — keep your spine neutral. If you can't, the weight is too heavy\n- Bar drifting away from your body — it should drag up your shins and thighs\n- Jerking the bar off the floor — smooth and controlled from the start`;
  }
  if (contains(lower, ['pull-up form', 'how to do pull', 'proper pull-up', 'pull up technique'])) {
    return `## How to Do Pull-ups with Proper Form\n\n1. **Grip:** Hands slightly wider than shoulder-width, palms facing away (overhand)\n2. **Start:** Dead hang with straight arms. Engage your lats — think about pulling your shoulders down and back\n3. **Pull:** Lead with your chest. Pull your chin above the bar by driving your elbows down toward your ribs\n4. **Control:** Lower yourself slowly over 2-3 seconds. Don't just drop\n5. **Full range:** Go from a full dead hang to chin above bar every rep\n\n**Can't do one yet?**\n- Use a resistance band for assistance\n- Do negative pull-ups: jump to the top, lower yourself over 5 seconds\n- Build up with lat pulldowns at the gym\n\n> Aim for 3 sets to 1-2 reps from failure. Quality over quantity — 5 perfect reps beats 10 sloppy ones.`;
  }
  return null;
}

function getWarmupGuide(text: string): string {
  const lower = text.toLowerCase();
  if (contains(lower, ['pre-workout', 'before workout', 'pre workout'])) {
    return `## Pre-Workout Warm-up Routine\n\nA proper warm-up takes 8-12 minutes and has three phases:\n\n### 1. General Warm-up (3-5 min)\nLight cardio to raise your heart rate and body temperature:\n- Jogging, cycling, or jumping jacks\n- You should break a light sweat\n\n### 2. Mobility & Activation (3-5 min)\nDynamic movements targeting the muscles you'll train:\n- **Arm circles** — 10 forward, 10 backward\n- **Band pull-aparts** — 2x15\n- **Hip openers / leg swings** — 10 each side\n- **Bodyweight squats** — 2x10\n- **Cat-cow stretch** — 10 reps\n\n### 3. Exercise-Specific Prep (2-3 min)\nWarm up with the exercise you're about to do, using lighter weight:\n- First set at 50% of working weight for 8-10 reps\n- Second set at 70% for 5-6 reps\n- Then start your working sets\n\n> **Why warm up?** It increases blood flow, primes your nervous system, improves mobility, and significantly reduces injury risk. Skipping it is a false economy.`;
  }
  return `## Post-Workout Stretching Routine\n\nAfter your training session, spend 5-10 minutes stretching while your muscles are warm. Hold each stretch for 30-45 seconds.\n\n### Upper Body\n- **Chest stretch** — doorway or wall, 30s each side\n- **Lat stretch** — hanging from a bar or overhead reach, 30s\n- **Shoulder cross-body** — pull arm across chest, 30s each side\n- **Bicep wall stretch** — palm against wall, turn away, 30s each side\n- **Tricep stretch** — overhead, pull elbow behind head, 30s each side\n\n### Lower Body\n- **Hamstring stretch** — seated or standing, 30-45s each leg\n- **Quad stretch** — pull heel to glute, 30s each leg\n- **Hip flexor stretch** — kneeling lunge, 30s each side\n- **Pigeon pose** — 30-45s each side for glutes\n- **Calf stretch** — against a wall, 30s each leg\n\n> **Don't bounce** — static stretches should be smooth and held. Bouncing triggers the stretch reflex and can cause tightness. Save intense stretching for after your workout, not before.`;
}

function getRecoveryAdvice(text: string): string {
  const lower = text.toLowerCase();
  if (contains(lower, ['doms', 'sore', 'soreness', 'muscle pain'])) {
    return `## Dealing with Muscle Soreness (DOMS)\n\n**DOMS** (Delayed Onset Muscle Soreness) peaks 24-72 hours after exercise. It's normal — especially when you start a new program or increase volume.\n\n**What helps:**\n- **Active recovery:** Light walking, cycling, or swimming at low intensity. Movement increases blood flow and speeds recovery\n- **Sleep:** 7-9 hours. This is when your body repairs muscle tissue — sleep is the #1 recovery tool\n- **Protein:** Eat enough protein (1.6-2.2g per kg bodyweight) to fuel muscle repair\n- **Hydration:** Drink plenty of water. Dehydration makes soreness worse\n- **Heat/cold:** A warm bath or shower can relax tight muscles. Some people use ice baths after intense sessions\n- **Light stretching:** Gentle, not aggressive. Don't force range of motion\n\n**When to worry:**\n- Sharp pain during exercise is not DOMS — it's an injury. Stop immediately\n- If soreness lasts more than 5 days or is accompanied by dark urine, see a doctor (rhabdomyolysis)\n\n> Soreness decreases as your body adapts. After 2-3 weeks of consistent training, DOMS becomes much milder.`;
  }
  if (contains(lower, ['rest day', 'rest days', 'how often rest', 'recovery day'])) {
    return `## Rest Days & Recovery\n\nRest days aren't laziness — they're when your body actually builds muscle and adapts. Here's how to structure them:\n\n**How many rest days?**\n- **Beginner (3x/week full-body):** 4 rest days — plenty of recovery built in\n- **Intermediate (4-5x/week split):** 2-3 rest days\n- **Advanced (5-6x/week):** 1-2 rest days, but programming must be carefully managed\n\n**Active vs. Passive Rest:**\n- **Active rest** (recommended): Light walking, yoga, mobility work, easy cycling. Keeps blood flowing without taxing your muscles\n- **Passive rest:** Complete rest. Fine occasionally, but active recovery is better for most people\n\n**Signs you need more rest:**\n- Performance declining across multiple sessions\n- Persistent fatigue or poor sleep\n- Nagging aches that don't improve\n- Loss of motivation / feeling burned out\n- Elevated resting heart rate\n\n> **Deload week:** Every 4-8 weeks, reduce your training volume by 40-50% for a week. This allows accumulated fatigue to dissipate and comes back stronger.`;
  }
  return `## Recovery Essentials\n\nRecovery is where growth happens. Here are the foundations:\n\n### 1. Sleep (The Foundation)\n- **7-9 hours per night** — non-negotiable for muscle repair and hormone regulation\n- Growth hormone is released primarily during deep sleep\n- Poor sleep = higher cortisol, lower testosterone, worse performance\n\n### 2. Nutrition\n- Eat enough **protein** (1.6-2.2g per kg bodyweight)\n- Don't under-eat — recovery requires calories\n- Stay hydrated: 3-4 liters of water per day\n\n### 3. Active Recovery\n- Light movement on rest days: walking, cycling, swimming\n- Promotes blood flow to muscles without adding training stress\n\n### 4. Stress Management\n- Chronic stress elevates cortisol, which impairs recovery\n- Consider meditation, breathing exercises, or simply managing workload\n\n### 5. Deload Weeks\n- Every 4-8 weeks, cut training volume by ~40%\n- Lets your body fully recover and supercompensate\n\n> The strongest athletes aren't the ones who train the hardest — they're the ones who recover the hardest. You don't grow in the gym; you grow when you rest.`;
}

function getMuscleBuildingAdvice(text: string): string {
  const lower = text.toLowerCase();
  if (contains(lower, ['beginner', 'just starting', 'new to', 'first time', 'noob', 'starter'])) {
    return `## Muscle Building for Beginners\n\nWelcome — building muscle is one of the best things you can do for your health, confidence, and longevity. Here's what you need to know:\n\n### The Three Pillars\n\n**1. Training**\n- Train each muscle group 2x per week\n- Start with a full-body routine 3x per week (Mon/Wed/Fri)\n- Focus on compound exercises: squats, bench press, deadlifts, rows, overhead press, pull-ups\n- **Progressive overload:** Add weight or reps over time. This is the #1 driver of muscle growth\n\n**2. Nutrition**\n- Eat in a slight caloric surplus (+200-400 cal above maintenance)\n- Protein: 1.6-2.0g per kg bodyweight per day\n- Don't overthink supplements — food comes first\n\n**3. Recovery**\n- Sleep 7-9 hours\n- Rest at least 48 hours before training the same muscle group again\n- Don't train to failure every set — leave 1-2 reps in reserve\n\n> **Realistic expectations:** A beginner can build 0.5-1kg of muscle per month in the first year. It slows down after that. Consistency beats intensity — showing up for 6 months beats going all-out for 3 weeks.`;
  }
  if (contains(lower, ['plateau', 'stuck', 'no progress', 'not growing', 'stopped'])) {
    return `## Breaking Through a Muscle Building Plateau\n\nHitting a plateau is frustrating but normal. Here's a systematic approach to break through:\n\n### 1. Check Your Training Volume\n- Are you doing 10-20 working sets per muscle group per week?\n- If you're doing less, add 2-3 sets per exercise\n- If you're doing more, you might be overtraining — try a deload week\n\n### 2. Are You Progressively Overloading?\n- Track your lifts. If your weights haven't increased in 4+ weeks, that's the problem\n- Try adding just 1kg or 1 rep per session\n\n### 3. Check Your Nutrition\n- Are you eating in a surplus? You need extra calories to build muscle\n- Are you hitting your protein target every day?\n- Under-eating is the #1 reason people plateau\n\n### 4. Check Recovery\n- Sleeping 7+ hours?\n- Taking rest days?\n- High stress? Cortisol kills muscle growth\n\n### 5. Try New Stimulus\n- Change exercise variation (e.g., barbell to dumbbell)\n- Change rep range (if you've been doing 5s, try 10-12s)\n- Add intensity techniques: drop sets, rest-pause, supersets\n\n> Plateaus usually mean one of: not enough food, not enough progressive overload, or not enough recovery. Fix whichever one you're neglecting.`;
  }
  return `## Building Muscle: The Complete Guide\n\n### Training Principles\n\n**Progressive overload** is the key driver. You must challenge your muscles with more stimulus over time — more weight, more reps, or more sets.\n\n**Volume:** 10-20 working sets per muscle group per week. Start at 10 and add over time.\n\n**Frequency:** Train each muscle group 2x per week. This gives a better signal than 1x per week with more sets.\n\n**Rep ranges:** 6-15 reps for hypertrophy. Don't get hung up on exact numbers — proximity to failure matters more than rep count. Leave 1-3 reps in reserve on most sets.\n\n### Best Exercises by Muscle Group\n\n| Muscle | Primary Exercises |\n|---|---|\n| Chest | Bench Press, Incline Press, Dips, Push-ups |\n| Back | Deadlifts, Pull-ups, Rows, Lat Pulldown |\n| Shoulders | Overhead Press, Lateral Raises, Face Pulls |\n| Legs | Squats, Leg Press, Romanian Deadlift, Lunges |\n| Arms | Close-grip Bench, Curls, Skull Crushers, Push-downs |\n| Core | Planks, Hanging Leg Raises, Cable Crunches |\n\n### Nutrition for Muscle Growth\n\n- **Caloric surplus:** +200-400 cal above maintenance\n- **Protein:** 1.6-2.0g per kg bodyweight\n- **Carbs:** Fuel your training — don't go low-carb if you want to build muscle\n- **Meal timing:** Spread protein across 3-4 meals (30-40g each)\n\n> The formula is simple but not easy: train hard, eat enough, sleep enough, repeat for months. Consistency over intensity every time.`;
}

function getFatLossAdvice(text: string): string {
  const lower = text.toLowerCase();
  if (contains(lower, ['belly fat', 'spot reduce', 'lose belly', 'abs'])) {
    return `## The Truth About Belly Fat\n\nYou cannot spot-reduce fat. Doing 1,000 crunches won't burn belly fat — your body loses fat from all areas based on genetics, not which muscles you train.\n\n### How to Actually Lose Belly Fat\n\n1. **Caloric deficit:** Eat 300-500 calories below your TDEE. This is the only way to lose fat — there are no shortcuts\n2. **Keep protein high:** 2.0-2.2g per kg bodyweight to preserve muscle while losing fat\n3. **Lift weights:** Resistance training tells your body to keep muscle and burn fat. Without it, you'll lose muscle along with fat\n4. **Cardio as a tool:** Add 150-300 min of moderate cardio per week if your deficit stalls. Walking is underrated\n5. **Be patient:** Belly fat is often the last to go for men (and hip/thigh fat for women). Your body has a "first on, last off" pattern\n\n### To See Your Abs\n\nFor most men, abs become visible at **10-15% body fat**. For women, **18-22%**. Everyone is different.\n\n- Don't try to lose weight too fast — 0.5-1% of bodyweight per week is ideal\n- Crash diets cause muscle loss and rebound weight gain\n- Track your progress with photos and waist measurements, not just the scale\n\n> Abs are made in the kitchen. You can have strong abdominal muscles, but if there's a layer of fat over them, you won't see them. Fix your nutrition first.`;
  }
  return `## Fat Loss: The Complete Guide\n\n### The Fundamental Rule\n\nFat loss requires a **caloric deficit** — eating fewer calories than you burn. There's no way around this. No specific food, supplement, or workout can override it.\n\n### Setting Your Deficit\n\n1. Calculate your TDEE (I can do this for you — just tell me your weight, height, age, and gender)\n2. Subtract 300-500 calories for a sustainable deficit\n3. Aim to lose **0.5-1% of bodyweight per week** (0.5-1kg for most people)\n\n### The Three Tools\n\n**1. Diet (Most Important)**\n- High protein (2.0-2.2g per kg) to preserve muscle\n- Eat filling foods: lean proteins, vegetables, whole grains, fruits\n- Liquid calories count — cut sugary drinks and alcohol\n- Track your food intake, at least initially\n\n**2. Resistance Training (Critical)**\n- Lift weights 3-4x per week\n- This preserves (and can build) muscle while you lose fat\n- Without lifting, you'll lose muscle too — resulting in a "skinny fat" look\n- Keep training intensity high even in a deficit\n\n**3. Cardio (Optional but Helpful)**\n- Start with 8,000-10,000 steps per day (walking)\n- Add 2-3 sessions of moderate cardio (20-30 min) if weight loss stalls\n- HIIT is time-efficient but taxing — don't overdo it in a deficit\n\n### Common Mistakes\n\n- **Too aggressive a deficit** — causes muscle loss, hunger, and rebound\n- **Cutting protein** — protein is your insurance against muscle loss\n- **Skipping weight training** — cardio alone makes you a smaller version of yourself, not a leaner one\n- **Not tracking** — you think you're in a deficit but you're not\n\n> The best diet is the one you can stick to. Consistency for 12 weeks beats perfection for 2 weeks. Focus on sustainability.`;
}

function getNutritionPlan(text: string): string {
  const lower = text.toLowerCase();
  if (contains(lower, ['meal', 'eat', 'food', 'what should i eat', 'meal plan', 'diet plan'])) {
    if (contains(lower, ['lose', 'cut', 'deficit', 'fat loss'])) {
      return `## Fat Loss Meal Plan (Example Day)\n\nA sample day designed for fat loss with high protein to preserve muscle. Adjust portions to fit your calorie target.\n\n### Breakfast (350-400 cal)\n- 3 scrambled eggs + 1 slice whole-grain toast\n- 1 cup black coffee or tea\n- 1/2 grapefruit or handful of berries\n\n### Lunch (450-500 cal)\n- 150g grilled chicken breast\n- Large salad with mixed greens, cucumber, tomato\n- 1 tbsp olive oil + lemon dressing\n- 1/2 cup brown rice\n\n### Snack (150-200 cal)\n- 150g Greek yogurt (plain, 0% fat)\n- 1 small apple\n- Dash of cinnamon\n\n### Dinner (450-550 cal)\n- 150g baked salmon or white fish\n- 1 cup roasted vegetables (broccoli, bell peppers, zucchini)\n- 1/2 cup sweet potato\n\n### Evening (100 cal)\n- 1 scoop protein shake in water\n\n**Daily total:** ~1,500-1,650 cal | ~140g protein\n\n> Swap any protein source for one you prefer (turkey, lean beef, tofu, legumes). The key is high protein + portion control + vegetables at every meal.`;
    }
    if (contains(lower, ['gain', 'build', 'muscle', 'bulk', 'surplus'])) {
      return `## Muscle Building Meal Plan (Example Day)\n\nA sample day designed for muscle growth with extra calories and protein. Adjust portions to hit your surplus.\n\n### Breakfast (500-600 cal)\n- 4 scrambled eggs + 2 slices whole-grain toast with avocado\n- 1 bowl of oatmeal with banana and honey\n- 1 glass of milk\n\n### Lunch (600-700 cal)\n- 200g grilled chicken or beef\n- 1 cup jasmine rice\n- 1 cup stir-fried vegetables with olive oil\n\n### Pre-Workout (200-250 cal)\n- 1 banana + 1 scoop protein shake with milk\n- 30 min before training\n\n### Post-Workout Dinner (600-700 cal)\n- 200g salmon or steak\n- 1.5 cups roasted potatoes\n- Large portion of vegetables\n\n### Before Bed (200-300 cal)\n- 150g Greek yogurt with honey and granola\n- Or 1 scoop casein protein\n\n**Daily total:** ~2,100-2,550 cal | ~180g protein\n\n> Building muscle requires eating more than you're used to. If you struggle to eat enough, add calorie-dense foods: nuts, avocados, olive oil, whole milk, smoothies.`;
    }
    return `## Healthy Nutrition: The Foundations\n\n### Core Principles\n\n1. **Eat enough protein:** 1.6-2.2g per kg bodyweight. Sources: chicken, fish, eggs, lean beef, Greek yogurt, tofu, legumes\n2. **Eat your vegetables:** 2-3 servings per meal. They provide fiber, vitamins, and keep you full\n3. **Choose whole carbs:** Rice, potatoes, oats, whole grains, fruits over processed options\n4. **Don't fear fats:** Healthy fats from olive oil, avocados, nuts, fatty fish are essential for hormones\n5. **Hydrate:** 3-4 liters of water per day. Thirst is often mistaken for hunger\n\n### A Simple Plate Method\n\nFill your plate at every meal:\n- **1/2 plate** vegetables\n- **1/4 plate** protein (palm-sized portion)\n- **1/4 plate** complex carbs (fist-sized portion)\n- **Thumb-sized** healthy fats\n\n### Foods to Limit\n\n- Ultra-processed foods (chips, cookies, instant noodles)\n- Sugary drinks (soda, fruit juice, sweetened coffee)\n- Fried foods\n- Alcohol (empty calories + impairs recovery)\n\n> You don't need to eat perfectly 100% of the time. The 80/20 rule works well: 80% whole, nutritious foods, 20% flexibility for treats and social occasions.\n\nTell me your goal (lose fat, build muscle, or maintain) and I'll give you a specific meal plan!`;
  }
  return getNutritionPlan('meal plan');
}

function getSupplementAdvice(text: string): string {
  const lower = text.toLowerCase();
  if (contains(lower, ['protein powder', 'whey', 'protein shake', 'protein supplement'])) {
    return `## Protein Powder (Whey)\n\n**What it is:** A convenient source of protein extracted from milk during cheese production.\n\n**Does it work?** Yes. Protein powder is just food — it has the same amino acids as chicken or eggs. Studies consistently show it supports muscle growth and recovery when used to hit daily protein targets.\n\n**When to use it:**\n- Post-workout: 1 scoop (20-30g) within 1-2 hours of training\n- Anytime you need to hit your protein target\n- It's a supplement, not a replacement — prioritize whole food protein sources\n\n**What to look for:**\n- Whey isolate (lower in lactose, higher protein %)\n- Minimal additives — avoid brands with lots of fillers or artificial sweeteners if you're sensitive\n- 20-30g protein per serving\n\n**Is it necessary?** No. If you hit your protein target with food, you don't need it. But it's one of the most convenient and cost-effective protein sources available.\n\n> A tub of whey costs about the same per gram of protein as chicken breast, and it's far more convenient. There's nothing magical about it — it's just easy protein.`;
  }
  if (contains(lower, ['creatine', 'creatin'])) {
    return `## Creatine Monohydrate\n\n**What it is:** A compound found naturally in meat and fish. Your muscles store it and use it for short bursts of energy.\n\n**Does it work?** Yes — creatine is the **most researched and effective supplement** for increasing strength and muscle mass. Hundreds of studies confirm it works. Typical gains: 5-15% improvement in high-intensity exercise performance.\n\n**How to take it:**\n- **3-5g per day**, every day (timing doesn't matter much)\n- No need to load — just take 5g daily. Loading (20g for 5 days) saturates faster but isn't necessary\n- Take it with food or a carb drink for slightly better absorption\n\n**Is it safe?**\n- Yes. Long-term studies (up to 5 years) show no adverse health effects in healthy individuals\n- The only consistent side effect is mild water weight gain (1-2kg) — this is intramuscular water, which actually makes muscles look fuller\n- Drink plenty of water when taking it\n\n**What type?** Creatine monohydrate. Don't overpay for "enhanced" versions — monohydrate is the cheapest and most proven form.\n\n> If you were to take only one supplement, creatine would be the one. It's cheap, effective, safe, and backed by decades of research.`;
  }
  if (contains(lower, ['pre-workout', 'preworkout', 'pre workout supplement'])) {
    return `## Pre-Workout Supplements\n\n**What they are:** Powdered drinks taken 20-30 minutes before training, typically containing caffeine, amino acids, and other performance enhancers.\n\n**The effective ingredients:**\n- **Caffeine (150-300mg):** The most proven performance enhancer. Improves focus, strength, and endurance. A cup of coffee works just as well\n- **Beta-alanine (3-6g):** Reduces muscle fatigue during high-rep sets. Causes a harmless tingling sensation\n- **Citrulline (6-8g):** Improves blood flow and reduces fatigue\n\n**What to watch out for:**\n- Proprietary blends hide ingredient doses — look for products with transparent labeling\n- Many pre-workouts are underdosed in the good stuff and overdosed in stimulants\n- Building caffeine tolerance is real — cycle off every few weeks\n\n**DIY Alternative (cheaper and more effective):**\n- 1 cup strong coffee (or 200mg caffeine pill)\n- Optional: 6g citrulline, 3g beta-alanine\n\n> You don't need a pre-workout supplement. A cup of coffee 30 minutes before training gives you 80% of the benefit at 5% of the cost.`;
  }
  if (contains(lower, ['bcaa', 'amino acid', 'essential amino'])) {
    return `## BCAAs (Branched-Chain Amino Acids)\n\n**What they are:** Three amino acids (leucine, isoleucine, valine) that are "branched-chain" in structure.\n\n**Do you need them?** Probably not. Here's why:\n\n- BCAAs are found in all complete protein sources (meat, eggs, dairy, whey)\n- If you eat enough protein (1.6g+ per kg), you already get plenty of BCAAs\n- Studies show BCAAs alone don't increase muscle protein synthesis as effectively as complete protein\n- They were popularized when "fasted training" was trendy, but even then, whey protein is superior\n\n**When they might help:**\n- If you train fasted and can't stomach food before training\n- If you're in a severe caloric deficit and struggling to hit protein targets\n\n**Bottom line:** Save your money. Spend it on whey protein or creatine instead — both have far more evidence behind them.\n\n> The supplement industry markets BCAAs aggressively, but the science is clear: complete protein beats isolated BCAAs every time. Whey protein contains BCAAs plus all the other amino acids your muscles need.`;
  }
  if (contains(lower, ['vitamin', 'mineral', 'multivitamin', 'zinc', 'magnesium', 'vitamin d'])) {
    return `## Vitamins & Minerals\n\n### What You Actually Need\n\n**Vitamin D3:**\n- Most people are deficient, especially in winter or if you work indoors\n- 1,000-4,000 IU per day is safe and beneficial\n- Supports bone health, immune function, testosterone, and mood\n- Get a blood test to know your levels — then supplement accordingly\n\n**Magnesium:**\n- Commonly deficient. Supports sleep, muscle recovery, and 300+ enzymatic reactions\n- 200-400mg before bed can improve sleep quality\n- Choose magnesium glycinate or citrate — avoid oxide (poorly absorbed)\n\n**Zinc:**\n- Important for testosterone and immune function\n- 10-15mg per day if you don't eat much red meat or oysters\n- Don't overdo it — excess zinc can cause copper deficiency\n\n**Omega-3 (Fish Oil):**\n- If you don't eat fatty fish 2x per week, supplement with 1-2g EPA+DHA daily\n- Supports heart health, brain function, and reduces inflammation\n\n### Multivitamins?\n\nA multivitamin is insurance, not a replacement for a good diet. If you eat a varied diet with lots of vegetables, fruits, and protein, you may not need one. If your diet has gaps, a basic multi is a reasonable safety net.\n\n> Get blood work done if possible. Supplementing blindly is guesswork. Know what you're actually deficient in before spending money.`;
  }
  return `## Supplements: An Evidence-Based Guide\n\nThe supplement industry is full of hype. Here's what actually works, ranked by evidence:\n\n### Tier 1 — Strong Evidence\n\n| Supplement | Effect | Dose |\n|---|---|---|\n| **Creatine monohydrate** | +5-15% strength/power | 5g/day |\n| **Whey protein** | Convenient protein source | 1-2 scoops/day |\n| **Caffeine** | Focus, strength, endurance | 100-300mg pre-workout |\n| **Vitamin D3** | Overall health, testosterone | 1,000-4,000 IU/day |\n\n### Tier 2 — Moderate Evidence\n\n| Supplement | Effect | Dose |\n|---|---|---|\n| **Omega-3 fish oil** | Reduces inflammation | 1-2g EPA+DHA |\n| **Magnesium** | Sleep, recovery | 200-400mg before bed |\n| **Beta-alanine** | Reduces fatigue (higher reps) | 3-6g/day |\n| **Citrulline** | Blood flow, endurance | 6-8g pre-workout |\n\n### Tier 3 — Weak Evidence (Save Your Money)\n\nBCAAs, testosterone boosters, fat burners, detox teas, most "mass gainers"\n\n> **The hierarchy:** Food > Training > Sleep > Creatine > Protein powder > Everything else. No supplement can fix a bad diet or poor sleep. Get the fundamentals right first.\n\nAsk me about any specific supplement and I'll give you a detailed breakdown.`;
}

function getMotivation(ctx: CoachContext, text: string): string {
  const lower = text.toLowerCase();
  const recentHistory = ctx.history.slice(-7);
  const recentAvg = recentHistory.length > 0
    ? Math.round(recentHistory.reduce((a, h) => a + h.disciplineScore, 0) / recentHistory.length)
    : 0;
  const perfectDays = ctx.history.filter((h) => h.allMainDone).length;

  const motivations = [
    `Listen, ${ctx.username}. You're sitting at ${ctx.rank} rank with a ${ctx.streak}-day streak. That's not nothing — that's proof you can do hard things. The question isn't whether you can train. You already know the answer. The question is whether you'll choose to, today. Go do it.`,
    `Your recent discipline score is ${recentAvg}%. ${recentAvg >= 70 ? "Solid — you're in the zone. Don't let comfort pull you out." : recentAvg >= 40 ? "Decent, but you and I both know there's another gear. Find it today." : "Below where you want to be. But that's not a verdict — it's a starting line. Today is a new day."} ${perfectDays > 0 ? "You've had " + perfectDays + " perfect days. You know what that feels like. Chase it." : "Your first perfect day is waiting. Make it today."}`,
    `Here's the truth nobody tells you: motivation is garbage. It shows up when things are easy and disappears when they're not. What you need is **discipline** — doing it whether you feel like it or not. And discipline is just a habit you've repeated enough times. You're at ${ctx.streak} days. Add one more. That's all you have to do today. One more.`,
    `${ctx.username}, I've seen your data. ${ctx.workoutSessions.length > 0 ? "You've trained " + ctx.workoutSessions.length + " times. That's " + Math.round(ctx.totalWorkoutSeconds / 60) + " minutes of choosing to be stronger." : "You haven't logged a workout yet. That changes today."} The gap between who you are and who you want to be is bridged by one thing: showing up. Not perfectly. Not heroically. Just showing up. Go.`,
  ];

  if (contains(lower, ['not feeling', 'don\'t want', 'tired', 'lazy', 'unmotivated', 'give up', 'quit'])) {
    return `${ctx.username}, I hear you. Some days the fire isn't there. That's normal. But here's what I know: the days you don't want to train are the days that matter most. Anyone can train when they feel great. It takes real discipline to train when you don't.\n\nYou don't have to do a perfect workout. Just do **something**. 10 push-ups. A 15-minute walk. One set of squats. Momentum starts with one rep. You're at a ${ctx.streak}-day streak — don't let it die because of one bad day. Do the minimum. Then see how you feel.`;
  }

  return pick(motivations);
}

export function getGreeting(state: AppState): string {
  const ctx = buildContext(state);
  return getGreetingInternal(ctx);
}

function getGreetingInternal(ctx: CoachContext): string {
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const incomplete = ctx.mainTasks.filter((t) => t.enabled && !ctx.coreCompleted[t.id]);
  const workoutDone = ctx.workoutsCompletedToday > 0;

  let statusNote = '';
  if (incomplete.length > 0 && !workoutDone) {
    statusNote = `You've got ${incomplete.length} task${incomplete.length > 1 ? 's' : ''} left today and haven't trained yet. Let's get to work.`;
  } else if (incomplete.length > 0) {
    statusNote = `Workout done — nice. ${incomplete.length} task${incomplete.length > 1 ? 's' : ''} remaining. Finish strong.`;
  } else if (workoutDone) {
    statusNote = "All tasks done and workout logged. You're on top of it today. What can I help you with?";
  } else {
    statusNote = "Everything's checked off for today. Rest well — recovery is part of the process.";
  }

  return `${timeGreeting}, ${ctx.username}. ${statusNote}\n\nI'm your AI Coach. I can help you with:\n- **Workout routines** (Push/Pull/Legs, full-body, upper/lower)\n- **Exercise form** and technique\n- **Nutrition** — calories, macros, meal plans\n- **Fat loss** and **muscle building** strategies\n- **Recovery**, sleep, and supplements\n- **Motivation** when you need a push\n\nAsk me anything fitness-related — or tell me your stats and I'll calculate your daily calories and protein.`;
}

export function generateCoachResponse(state: AppState, userText: string): string {
  const ctx = buildContext(state);
  const lower = userText.toLowerCase();

  if (!userText.trim()) return "I'm here. What do you need help with?";

  if (contains(lower, ['calorie', 'calories', 'how many cal', 'tdee', 'bmr', 'macro', 'macros', 'protein need', 'how much protein'])) {
    return calculateCalories(userText);
  }
  if (contains(lower, ['push pull leg', 'ppl', 'push/pull', 'split routine', 'workout split', 'training split'])) {
    if (contains(lower, ['push']) && !contains(lower, ['pull']) && !contains(lower, ['leg'])) return PPL_ROUTINES.push;
    if (contains(lower, ['pull']) && !contains(lower, ['push']) && !contains(lower, ['leg'])) return PPL_ROUTINES.pull;
    if (contains(lower, ['leg']) && !contains(lower, ['push']) && !contains(lower, ['pull'])) return PPL_ROUTINES.legs;
    return `## Push / Pull / Legs (PPL) Split\n\nThe PPL split is one of the most popular and effective training splits. You can run it 3 or 6 days per week:\n\n**3-day version:** Push → Pull → Legs → Rest → Repeat\n**6-day version:** Push → Pull → Legs → Push → Pull → Legs → Rest\n\n${PPL_ROUTINES.push}\n\n---\n\n${PPL_ROUTINES.pull}\n\n---\n\n${PPL_ROUTINES.legs}\n\n> Want me to focus on just one day? Ask for "push day", "pull day", or "leg day" specifically.`;
  }
  const formGuide = getFormGuide(userText);
  if (formGuide) return formGuide;
  if (contains(lower, ['warm', 'warmup', 'warm up', 'pre-workout', 'before workout', 'stretch', 'stretching', 'cool down', 'post-workout'])) {
    return getWarmupGuide(userText);
  }
  if (contains(lower, ['recover', 'rest day', 'rest days', 'overtraining', 'doms', 'sore', 'soreness', 'sleep', 'fatigue', 'burnout'])) {
    return getRecoveryAdvice(userText);
  }
  if (contains(lower, ['build muscle', 'muscle build', 'hypertrophy', 'gain muscle', 'get bigger', 'muscle growth', 'mass', 'get strong', 'strength', 'beginner', 'just starting', 'new to', 'plateau', 'stuck'])) {
    return getMuscleBuildingAdvice(userText);
  }
  if (contains(lower, ['lose fat', 'fat loss', 'lose weight', 'weight loss', 'cutting', 'cut', 'deficit', 'belly fat', 'lean', 'abs', 'get shredded', 'get lean'])) {
    return getFatLossAdvice(userText);
  }
  if (contains(lower, ['meal', 'eat', 'food', 'nutrition', 'diet', 'what should i eat', 'meal plan', 'healthy'])) {
    return getNutritionPlan(userText);
  }
  if (contains(lower, ['supplement', 'creatine', 'protein powder', 'whey', 'pre-workout', 'preworkout', 'bcaa', 'vitamin', 'mineral', 'magnesium', 'zinc', 'fish oil', 'omega'])) {
    return getSupplementAdvice(userText);
  }
  if (contains(lower, ['beginner', 'start', 'new to', 'first time', 'how do i begin', 'where do i start', 'never trained', 'noob', 'starter']) && !contains(lower, ['muscle'])) {
    return FULL_BODY_BEGINNER;
  }
  if (contains(lower, ['upper lower', 'upper/lower', '4 day split', 'four day'])) {
    return UPPER_LOWER;
  }
  if (contains(lower, ['exercise', 'workout', 'train', 'training', 'routine', 'what should i do', 'workout plan', 'program'])) {
    if (contains(lower, ['beginner', 'start', 'new'])) return FULL_BODY_BEGINNER;
    if (contains(lower, ['upper lower', '4 day', 'four day'])) return UPPER_LOWER;
    return `## Which Workout Split Is Right for You?\n\nHere are the main options, from beginner to advanced:\n\n### 1. Full-Body (3x/week) — Best for Beginners\nTrain every muscle group each session. Simple, effective, and gives plenty of recovery.\n\n### 2. Upper/Lower (4x/week) — Best for Intermediates\nSplit between upper and lower body. More volume per muscle group while still recovering well.\n\n### 3. Push/Pull/Legs (3-6x/week) — Best for Advanced\nEach day targets specific movement patterns. Maximum volume and customization.\n\nAsk me for any of these and I'll give you a complete routine with sets, reps, and rest times.\n\n> Not sure which to pick? Tell me how many days per week you can train and your experience level, and I'll recommend the best option.`;
  }
  if (contains(lower, ['motivat', 'push me', 'encourage', 'inspire', 'i can\'t', 'i cant', 'give up', 'quit', 'tired', 'lazy', 'not feeling', 'don\'t want'])) {
    return getMotivation(ctx, userText);
  }
  if (contains(lower, ['hello', 'hi', 'hey', 'greetings', 'sup', 'yo']) && userText.length < 20) {
    return getGreetingInternal(ctx);
  }
  if (contains(lower, ['thank', 'thanks', 'appreciate'])) {
    return pick([
      `Anytime, ${ctx.username}. That's what I'm here for. Go train.`,
      `You're welcome. Now go put it into practice — knowledge is useless without action.`,
      `Glad I could help. Remember: the best plan is the one you actually execute. Get after it.`,
    ]);
  }
  if (contains(lower, ['who are you', 'what are you', 'your name', 'what can you do', 'help me', 'what do you do'])) {
    return getGreetingInternal(ctx);
  }

  if (contains(lower, ['task', 'my progress', 'my stats', 'how am i doing', 'streak', 'rank', 'level', 'xp'])) {
    const rank = getRankByXp(ctx.xp);
    const incomplete = ctx.mainTasks.filter((t) => t.enabled && !ctx.coreCompleted[t.id]);
    const recentAvg = ctx.history.slice(-7).length > 0
      ? Math.round(ctx.history.slice(-7).reduce((a, h) => a + h.disciplineScore, 0) / Math.max(ctx.history.slice(-7).length, 1))
      : 0;
    return `## Your Progress\n\n| Metric | Value |\n|---|---|\n| **Rank** | ${rank.name} ${rank.emoji} |\n| **Level** | ${ctx.level} |\n| **XP** | ${ctx.xp.toLocaleString()} |\n| **Streak** | ${ctx.streak} days |\n| **7-day Discipline** | ${recentAvg}% |\n| **Workouts Logged** | ${ctx.workoutSessions.length} |\n| **Dungeons Cleared** | ${ctx.dungeonsCleared} |\n\n${incomplete.length > 0 ? `**Remaining today:** ${incomplete.map((t) => t.label).join(', ')}` : '**All core tasks complete today.**'}\n\n> Want fitness advice? Ask me about workouts, nutrition, form, recovery, or supplements!`;
  }

  const fitnessKeywords = ['fitness', 'health', 'gym', 'lift', 'weight', 'body', 'muscle', 'cardio', 'run', 'running', 'diet', 'calorie', 'protein', 'strong', 'fit', 'exercise', 'flexibility', 'mobility', 'injury', 'pain'];
  const isFitnessRelated = contains(lower, fitnessKeywords);

  if (isFitnessRelated) {
    return `That's a great question. Let me break it down for you.\n\nCould you give me a bit more detail about what specifically you'd like to know? I can help with:\n\n- **Workout routines** and exercise selection\n- **Proper form** for specific lifts\n- **Nutrition** — calories, macros, meal plans\n- **Fat loss** or **muscle building** strategies\n- **Recovery** — sleep, soreness, rest days\n- **Supplements** — what works and what doesn't\n\nJust ask me directly about any of these topics!`;
  }

  return `I'm your fitness and nutrition coach, ${ctx.username}. I specialize in:\n\n- **Workouts** — routines, form, exercise selection\n- **Nutrition** — calories, macros, meal plans\n- **Fat loss** and **muscle building**\n- **Recovery** — sleep, soreness, rest days\n- **Supplements** — evidence-based advice\n- **Motivation** — when you need a push\n\nTry asking me something like:\n- *"Give me a push day workout"*\n- *"How do I squat with proper form?"*\n- *"I'm 80kg, 180cm, 25, male — calculate my calories"*\n- *"What should I eat to lose fat?"*\n- *"How do I deal with muscle soreness?"*\n- *"Should I take creatine?"*\n\nI can answer other questions too, but my specialty is helping you become the strongest version of yourself.`;
}

export { calculateCalories };
