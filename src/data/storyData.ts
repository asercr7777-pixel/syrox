export interface StoryChoice {
  id: string;
  text: string;
  response: string;
  rewardText?: string;
  relationshipChange?: number;
}

export interface StoryDialogue {
  id: string;
  speaker: string;
  speakerType: 'player' | 'npc' | 'narrator' | 'boss';
  text: string;
  choices?: StoryChoice[];
}

export interface StoryMission {
  id: string;
  label: string;
  description: string;
  habitId: string;
  targetCount: number;
}

export interface SideQuest {
  id: string;
  label: string;
  description: string;
  condition: string;
  rewardXp: number;
  rewardCoins: number;
}

export interface SecretQuest {
  id: string;
  label: string;
  description: string;
  unlockCondition: string;
  rewardXp: number;
  rewardCoins: number;
  rewardText: string;
}

export interface StoryBoss {
  id: string;
  name: string;
  title: string;
  emoji: string;
  description: string;
  phases: { name: string; hp: number; dialogue: string }[];
  introDialogue: string[];
  defeatDialogue: string[];
  arenaColor: string;
  arenaName: string;
  rewardXp: number;
  rewardCoins: number;
  rewardText: string;
}

export interface StoryReward {
  type: 'coins' | 'xp' | 'weapon' | 'shield' | 'aura' | 'title' | 'achievement' | 'secret';
  amount?: number;
  itemId?: string;
  label: string;
}

export interface StoryChapter {
  id: string;
  chapter: number;
  regionId: string;
  title: string;
  description: string;
  requiredXp: number;
  openingCinematic: string;
  storyIntro: string;
  dialogues: StoryDialogue[];
  mainMission: StoryMission;
  sideQuests: SideQuest[];
  secretQuest: SecretQuest;
  eliteEnemy: { name: string; emoji: string; description: string; hp: number };
  miniBoss: { name: string; emoji: string; description: string; hp: number };
  finalBoss: StoryBoss;
  treasureRoom: { description: string; rewards: StoryReward[] };
  endingCinematic: string;
  rewards: StoryReward[];
  emoji: string;
}

export interface StoryRegion {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  chapterRange: [number, number];
  backgroundEffect: string;
}

export const STORY_REGIONS: StoryRegion[] = [
  { id: 'forgotten_village', name: 'Forgotten Village', emoji: '🏚️', description: 'Where your journey begins, among ruins of a lost civilization.', color: '#64748b', chapterRange: [1, 3], backgroundEffect: 'ash' },
  { id: 'forest_discipline', name: 'Forest of Discipline', emoji: '🌲', description: 'Ancient trees whisper the first lessons of consistency.', color: '#10b981', chapterRange: [4, 6], backgroundEffect: 'leaves' },
  { id: 'temple_focus', name: 'Temple of Focus', emoji: '⛩️', description: 'A sacred place where the mind is sharpened like a blade.', color: '#fbbf24', chapterRange: [7, 9], backgroundEffect: 'golden' },
  { id: 'mountain_will', name: 'Mountain of Will', emoji: '⛰️', description: 'Climb the peak that tests the limits of your determination.', color: '#3b82f6', chapterRange: [10, 12], backgroundEffect: 'snow' },
  { id: 'kingdom_consistency', name: 'Kingdom of Consistency', emoji: '🏰', description: 'A realm that rewards those who never waver.', color: '#a855f7', chapterRange: [13, 15], backgroundEffect: 'purple' },
  { id: 'ocean_wisdom', name: 'Ocean of Wisdom', emoji: '🌊', description: 'Vast waters that hold the secrets of the ancients.', color: '#06b6d4', chapterRange: [16, 18], backgroundEffect: 'waves' },
  { id: 'desert_temptation', name: 'Desert of Temptation', emoji: '🏜️', description: 'Endless sands where distractions manifest as mirages.', color: '#f59e0b', chapterRange: [19, 21], backgroundEffect: 'sand' },
  { id: 'frozen_sanctuary', name: 'Frozen Sanctuary', emoji: '🧊', description: 'A cold haven where only the disciplined survive.', color: '#7dd3fc', chapterRange: [22, 24], backgroundEffect: 'frost' },
  { id: 'shadow_citadel', name: 'Shadow Citadel', emoji: '🌑', description: 'A dark fortress where shadow and discipline intertwine.', color: '#7c3aed', chapterRange: [25, 27], backgroundEffect: 'shadow' },
  { id: 'celestial_kingdom', name: 'Celestial Kingdom', emoji: '✨', description: 'A realm beyond mortal comprehension, bathed in starlight.', color: '#e0e7ff', chapterRange: [28, 30], backgroundEffect: 'stars' },
  { id: 'void_dimension', name: 'Void Dimension', emoji: '🕳️', description: 'Where reality dissolves and only willpower remains.', color: '#1e1b4b', chapterRange: [31, 33], backgroundEffect: 'void' },
  { id: 'infinite_throne', name: 'Infinite Throne', emoji: '🪔', description: 'The seat of ultimate power, earned through infinite effort.', color: '#fbbf24', chapterRange: [34, 36], backgroundEffect: 'golden' },
  { id: 'absolute_reality', name: 'Absolute Reality', emoji: '🔮', description: 'Where truth itself bends to the disciplined mind.', color: '#c084fc', chapterRange: [37, 39], backgroundEffect: 'prismatic' },
  { id: 'beyond_existence', name: 'Beyond Existence', emoji: '🌌', description: 'A plane that transcends all known boundaries of power.', color: '#818cf8', chapterRange: [40, 42], backgroundEffect: 'cosmic' },
  { id: 'omega_realm', name: 'Omega Realm', emoji: 'Ω', description: 'The final frontier where all disciplines converge into one.', color: '#f43f5e', chapterRange: [43, 45], backgroundEffect: 'omega' },
  { id: 'final_infinity', name: 'Final Infinity', emoji: '∞', description: 'The ultimate destination where limits cease to exist.', color: '#facc15', chapterRange: [46, 50], backgroundEffect: 'infinity' },
];

const BOSSES: Record<string, StoryBoss> = {
  laziness: {
    id: 'boss_laziness', name: 'The Sloth King', title: 'Lord of Inaction', emoji: '😴',
    description: 'A massive creature born from unchecked procrastination. It moves slowly but strikes with crushing weight.',
    phases: [
      { name: 'Slumber', hp: 100, dialogue: 'Why bother? Rest is easier...' },
      { name: 'Stirring', hp: 60, dialogue: 'You dare disturb my eternal rest?' },
      { name: 'Rampage', hp: 20, dialogue: 'NO! I will not let you take action!' },
    ],
    introDialogue: ['The Sloth King rises from a pile of unfinished tasks...', 'Its eyes, half-closed, radiate an aura of apathy.', 'You feel the urge to just... do it tomorrow.'],
    defeatDialogue: ['Impossible... someone who actually does things?', 'Perhaps... action is the true power...', 'The Sloth King crumbles into dust.'],
    arenaColor: '#475569', arenaName: 'The Bed of Procrastination',
    rewardXp: 500, rewardCoins: 300, rewardText: 'You have conquered laziness. Action flows through your veins.',
  },
  fear: {
    id: 'boss_fear', name: 'The Terror Wraith', title: 'Specter of Doubt', emoji: '😱',
    description: 'A shadowy figure that feeds on your deepest anxieties. It wears the faces of every failure you have ever feared.',
    phases: [
      { name: 'Whispers', hp: 120, dialogue: 'You will fail. Everyone will see...' },
      { name: 'Manifestation', hp: 70, dialogue: 'Remember every mistake? I do.' },
      { name: 'Desperation', hp: 25, dialogue: 'If you run now, nobody will blame you...' },
    ],
    introDialogue: ['The air grows cold. Shadows elongate into clawed hands.', 'The Terror Wraith emerges from your own shadow.', 'It speaks with your voice, but filled with fear.'],
    defeatDialogue: ['Fear is... not real?', 'You faced me... and did not run?', 'The wraith dissipates like morning fog.'],
    arenaColor: '#6366f1', arenaName: 'The Hall of Mirrors',
    rewardXp: 800, rewardCoins: 500, rewardText: 'Fear no longer controls you. You are the master of your mind.',
  },
  comfort: {
    id: 'boss_comfort', name: 'The Comfort Titan', title: 'Guardian of the Safe Zone', emoji: '🛋️',
    description: 'A giant made of pillows and blankets, offering warmth and safety at the cost of growth.',
    phases: [
      { name: 'Embrace', hp: 150, dialogue: 'Stay. It is warm here. No growth needed.' },
      { name: 'Resistance', hp: 90, dialogue: 'Why leave? The world is harsh and cold.' },
      { name: 'Cracking', hp: 30, dialogue: 'You are choosing suffering over comfort... why?' },
    ],
    introDialogue: ['A mountain of softness blocks your path.', 'The Comfort Titan opens its arms wide.', 'Every instinct tells you to just... stay.'],
    defeatDialogue: ['Growth requires discomfort... I understand now.', 'Go. The world needs those who leave comfort behind.', 'The titan dissolves into a warm breeze.'],
    arenaColor: '#f59e0b', arenaName: 'The Nest of Stagnation',
    rewardXp: 1000, rewardCoins: 700, rewardText: 'You have left the comfort zone. Growth is now your default state.',
  },
  distraction: {
    id: 'boss_distraction', name: 'The Noise Phoenix', title: 'Harbinger of Chaos', emoji: '🎰',
    description: 'A bird made of notifications, buzzing phones, and infinite scroll. It never stays still.',
    phases: [
      { name: 'Chatter', hp: 130, dialogue: 'Look here! No, here! Wait, look HERE!' },
      { name: 'Overload', hp: 75, dialogue: 'So many tabs open... can you focus on any?' },
      { name: 'Flicker', hp: 20, dialogue: 'I am fading... your focus is too strong...' },
    ],
    introDialogue: ['A thousand sounds crash at once. The Noise Phoenix takes flight.', 'It moves in twenty directions simultaneously.', 'You cannot look away. You cannot look AT it.'],
    defeatDialogue: ['Silence... I have never known silence...', 'You found focus in the chaos. Remarkable.', 'The phoenix shatters into a single, clear note.'],
    arenaColor: '#ec4899', arenaName: 'The Carnival of Notifications',
    rewardXp: 1200, rewardCoins: 800, rewardText: 'Focus is your weapon now. Distractions shatter against it.',
  },
  chaos: {
    id: 'boss_chaos', name: 'The Entropy Beast', title: 'Devourer of Order', emoji: '🌀',
    description: 'A swirling mass of disorder that unmade everything it touches. Plans crumble, schedules dissolve.',
    phases: [
      { name: 'Disorder', hp: 160, dialogue: 'Order is illusion. Let it all fall apart.' },
      { name: 'Unraveling', hp: 100, dialogue: 'Your plans mean nothing to me!' },
      { name: 'Collapse', hp: 30, dialogue: 'You... you organized the chaos?' },
    ],
    introDialogue: ['Reality fractures. The Entropy Beast crawls through the cracks.', 'It devours the very concept of schedules.', 'Your carefully planned day starts to blur.'],
    defeatDialogue: ['Structure against entropy... it can work?', 'You impose your will on disorder itself.', 'The beast stabilizes into a perfect geometric form, then vanishes.'],
    arenaColor: '#8b5cf6', arenaName: 'The Fractured Plane',
    rewardXp: 1500, rewardCoins: 1000, rewardText: 'You bring order to chaos. Your discipline shapes reality.',
  },
  burnout: {
    id: 'boss_burnout', name: 'The Ash Golem', title: 'The Consumed One', emoji: '🔥',
    description: 'A creature of burnt-out passion and exhaustion. It reminds you of every time you pushed too hard.',
    phases: [
      { name: 'Smoldering', hp: 180, dialogue: 'I once had fire too... it burned me out.' },
      { name: 'Eruption', hp: 110, dialogue: 'Push harder! Until there is nothing left!' },
      { name: 'Embers', hp: 30, dialogue: 'Balance... there is balance in the fire?' },
    ],
    introDialogue: ['Heat fills the arena. The Ash Golem stands from a pile of cinders.', 'Its eyes are hollow, burnt out from overexertion.', 'It swings with the desperation of someone who never rested.'],
    defeatDialogue: ['Sustainable fire... that is the secret?', 'I burned bright and fast. You burn steady and eternal.', 'The golem crumbles to warm, gentle ash.'],
    arenaColor: '#f97316', arenaName: 'The Furnace of Exhaustion',
    rewardXp: 1800, rewardCoins: 1200, rewardText: 'You understand balance. Fire that endures, not fire that consumes.',
  },
  negative_thinking: {
    id: 'boss_negative', name: 'The Shadow Mirror', title: 'Reflection of Despair', emoji: '🪞',
    description: 'A mirror that shows only your failures, your weaknesses, your worst moments on repeat.',
    phases: [
      { name: 'Reflection', hp: 200, dialogue: 'Look at yourself. This is who you really are.' },
      { name: 'Distortion', hp: 130, dialogue: 'Every failure, magnified. Every success, forgotten.' },
      { name: 'Shattering', hp: 35, dialogue: 'You... see good in yourself? How?' },
    ],
    introDialogue: ['A massive mirror blocks your path, its surface dark.', 'The Shadow Mirror shows you at your worst moment.', 'It replays every failure on an infinite loop.'],
    defeatDialogue: ['I only showed you the truth...', 'Your truth includes both failure AND triumph.', 'The mirror cracks, and through the cracks, light pours in.'],
    arenaColor: '#475569', arenaName: 'The Hall of Reflections',
    rewardXp: 2200, rewardCoins: 1500, rewardText: 'You see yourself clearly now. Flaws and all, and you march forward.',
  },
  overthinking: {
    id: 'boss_overthinking', name: 'The Thought Spiral', title: 'The Infinite Loop', emoji: '🔄',
    description: 'A vortex of endless analysis that traps you in decision paralysis. Every choice has a thousand counterarguments.',
    phases: [
      { name: 'Analysis', hp: 220, dialogue: 'But what if? And what about? Consider this...' },
      { name: 'Paralysis', hp: 140, dialogue: 'You cannot decide. There are too many variables.' },
      { name: 'Breaking', hp: 35, dialogue: 'You just... acted? Without thinking it through?' },
    ],
    introDialogue: ['The ground becomes a spiral. Thoughts multiply exponentially.', 'The Thought Spiral shows you every possible outcome.', 'You feel your body freeze, unable to choose.'],
    defeatDialogue: ['Action without overthinking... that is a strength?', 'You broke my loop with a single decisive step.', 'The spiral unwinds into a straight path forward.'],
    arenaColor: '#06b6d4', arenaName: 'The Labyrinth of Loops',
    rewardXp: 2500, rewardCoins: 1800, rewardText: 'You act decisively. Analysis serves you, not imprisons you.',
  },
  self_doubt: {
    id: 'boss_self_doubt', name: 'The Hollow Sovereign', title: 'The Voice That Says No', emoji: '👻',
    description: 'A spectral figure that whispers you are not enough. It has been with you since the beginning, feeding on every setback.',
    phases: [
      { name: 'Whispers', hp: 250, dialogue: 'You are not enough. You never were.' },
      { name: 'Shouts', hp: 160, dialogue: 'Everyone will see you fail. Again.' },
      { name: 'Silence', hp: 40, dialogue: 'You... believe in yourself? Despite everything?' },
    ],
    introDialogue: ['A cold presence fills the arena. You know this voice.', 'The Hollow Sovereign wears your face, but hollowed out.', 'It speaks with the voice that has held you back your whole life.'],
    defeatDialogue: ['I was you. I was the part of you that was afraid.', 'By defeating me, you accept yourself. Fully.', 'The sovereign fades, and in its place, a warm light remains.'],
    arenaColor: '#1e293b', arenaName: 'The Void of Self',
    rewardXp: 3000, rewardCoins: 2500, rewardText: 'You believe in yourself. Not blindly, but with earned certainty.',
  },
};

const HABITS = [
  { id: 'sleep', label: 'Sleep 8 Hours', emoji: '😴' },
  { id: 'workout', label: 'Complete a Workout', emoji: '💪' },
  { id: 'water', label: 'Drink Water', emoji: '💧' },
  { id: 'prayer', label: 'Complete Prayer', emoji: '🕌' },
  { id: 'reading', label: 'Read 30 Pages', emoji: '📖' },
  { id: 'food', label: 'Eat Healthy Food', emoji: '🥗' },
  { id: 'deepwork', label: 'Deep Work Session', emoji: '🎯' },
  { id: 'meditation', label: 'Meditate', emoji: '🧘' },
];

const SIDE_QUEST_POOL: Omit<SideQuest, 'id'>[] = [
  { label: 'Perfect Morning', description: 'Complete all morning tasks before noon.', condition: 'Complete all main tasks before 12:00 PM', rewardXp: 150, rewardCoins: 100 },
  { label: 'Perfect Night', description: 'Complete evening routine before bed.', condition: 'Complete all tasks after 6:00 PM', rewardXp: 150, rewardCoins: 100 },
  { label: 'Read 30 Pages', description: 'Read 30 pages of a book today.', condition: 'Complete the Reading task', rewardXp: 100, rewardCoins: 80 },
  { label: 'Drink 3 Liters', description: 'Drink 3 liters of water throughout the day.', condition: 'Complete the Water task 3 times', rewardXp: 120, rewardCoins: 90 },
  { label: 'Complete Every Task', description: 'Finish all tasks for today — main and extra.', condition: 'Complete all main and extra tasks in one day', rewardXp: 300, rewardCoins: 200 },
  { label: 'Morning Workout', description: 'Complete a workout before 10:00 AM.', condition: 'Complete a workout session in the morning', rewardXp: 200, rewardCoins: 150 },
  { label: 'No Social Media', description: 'Avoid social media for the entire day.', condition: 'Go a full day without social media', rewardXp: 180, rewardCoins: 120 },
  { label: 'Meditate 10 Minutes', description: 'Meditate for at least 10 minutes.', condition: 'Complete the Meditation task', rewardXp: 100, rewardCoins: 70 },
  { label: 'Deep Work 2 Hours', description: 'Complete a 2-hour deep work session.', condition: 'Complete the Deep Work task', rewardXp: 250, rewardCoins: 180 },
  { label: 'Perfect Posture', description: 'Maintain good posture throughout the day.', condition: 'Be mindful of posture all day', rewardXp: 80, rewardCoins: 60 },
];

const SECRET_QUEST_POOL: Omit<SecretQuest, 'id'>[] = [
  { label: 'The Unbroken', description: 'Maintain a 30-day streak without a single missed day.', unlockCondition: 'Reach a 30-day streak', rewardXp: 5000, rewardCoins: 3000, rewardText: 'The Unbroken Seal: Proof that you are beyond failure.' },
  { label: 'Flawless Hunter', description: 'Complete 14 consecutive perfect days.', unlockCondition: 'Complete 14 perfect days in a row', rewardXp: 8000, rewardCoins: 5000, rewardText: 'The Flawless Crest: Only the most disciplined earn this.' },
  { label: 'Shadow Collector', description: 'Collect 5 legendary or mythic shields.', unlockCondition: 'Own 5 legendary+ shields', rewardXp: 6000, rewardCoins: 4000, rewardText: 'The Collector\'s Mark: A shield for every weakness.' },
  { label: 'Mythic Ascendant', description: 'Reach the Mythic rank through pure discipline.', unlockCondition: 'Reach Mythic rank', rewardXp: 10000, rewardCoins: 8000, rewardText: 'The Ascendant Star: You have transcended mortal limits.' },
  { label: 'The Forbidden Path', description: 'Complete every single task for 7 days straight.', unlockCondition: 'Complete all tasks for 7 consecutive days', rewardXp: 7000, rewardCoins: 5000, rewardText: 'The Forbidden Key: Some doors only open for the relentless.' },
  { label: 'Eternal Flame', description: 'Maintain a 100-day streak.', unlockCondition: 'Reach a 100-day streak', rewardXp: 20000, rewardCoins: 15000, rewardText: 'The Eternal Flame: Your discipline burns forever.' },
  { label: 'Zenith', description: 'Complete 50 perfect days total.', unlockCondition: 'Complete 50 perfect days', rewardXp: 15000, rewardCoins: 12000, rewardText: 'The Zenith Crown: You stand at the peak of discipline.' },
  { label: 'The Void Walker', description: 'Complete a task at 3:00 AM.', unlockCondition: 'Complete any task between 2-4 AM', rewardXp: 3000, rewardCoins: 2000, rewardText: 'The Void Walker\'s Sigil: You act when the world sleeps.' },
];

const BOSS_NAMES = ['laziness', 'fear', 'comfort', 'distraction', 'chaos', 'burnout', 'negative_thinking', 'overthinking', 'self_doubt'];

function pickBoss(chapterIdx: number): StoryBoss {
  return BOSSES[BOSS_NAMES[chapterIdx % BOSS_NAMES.length]];
}

function pickSideQuests(chapterIdx: number, count: number): SideQuest[] {
  const result: SideQuest[] = [];
  for (let i = 0; i < count; i++) {
    const pool = SIDE_QUEST_POOL[(chapterIdx * 3 + i) % SIDE_QUEST_POOL.length];
    result.push({ id: `sq_${chapterIdx}_${i}`, ...pool });
  }
  return result;
}

function pickSecretQuest(chapterIdx: number): SecretQuest {
  const pool = SECRET_QUEST_POOL[chapterIdx % SECRET_QUEST_POOL.length];
  return { id: `secret_${chapterIdx}`, ...pool };
}

function pickHabit(chapterIdx: number) {
  return HABITS[chapterIdx % HABITS.length];
}

const CHAPTER_TITLES: { title: string; emoji: string; intro: string; opening: string; ending: string }[] = [
  { title: 'First Awakening', emoji: '✨', intro: 'You wake in the ruins of the Forgotten Village. Something has changed within you. The System speaks: "Your awakening begins now. Complete your first habit to ignite the spark."', opening: 'The screen fades from black. Dust particles float through golden light. A voice echoes: "Arise, Hunter. Your discipline shapes this world."', ending: 'As the chapter closes, the village streets glow faintly. The first seed of discipline has been planted. The world watches.' },
  { title: 'Whispers in the Dust', emoji: '🌫️', intro: 'The villagers speak of an ancient power sleeping beneath the ruins. You must prove your commitment by maintaining your habits.', opening: 'Wind sweeps through empty streets. A door creaks open on its own. Inside, a purple light pulses in rhythm with your heartbeat.', ending: 'The ruins begin to repair themselves, stone by stone, as if responding to your discipline. The village is waking up.' },
  { title: 'The Old Mentor', emoji: '🧙', intro: 'An old sage appears, offering to guide you. But first, you must show consistency. Complete your habits today.', opening: 'A figure sits by a dying fire. "I have waited centuries for someone like you," the sage whispers. "Show me your discipline."', ending: 'The sage nods approvingly. "You have potential. But the real challenges lie ahead." The fire roars to life, then vanishes.' },
  { title: 'Into the Forest', emoji: '🌲', intro: 'The Forest of Discipline looms ahead. Ancient trees block the sun. Your habits are the only light that guides you.', opening: 'Massive trees part slightly as you approach. The forest hums with energy. A path appears, lined with glowing mushrooms.', ending: 'The forest canopy opens briefly, letting starlight through. You have proven worthy to enter deeper. The trees whisper your name.' },
  { title: 'The Test of Roots', emoji: '🌿', intro: 'The forest tests your foundation. Without strong roots, you will fall. Complete your core habits to deepen your roots.', opening: 'Roots burst from the ground, forming a maze. Each path represents a choice. The forest watches to see if you will stay consistent.', ending: 'The roots retract, clearing your path. The forest acknowledges your stability. A hidden trail reveals itself.' },
  { title: 'The Clearing', emoji: '🌤️', intro: 'You discover a clearing where hunters before you have left their mark. You must add your own by completing today\'s mission.', opening: 'Sunlight floods a circular clearing. Stone monuments surround it, each carved with a name. An empty stone waits for yours.', ending: 'Your name carves itself into the stone. The clearing glows with acceptance. You are now part of the forest\'s history.' },
  { title: 'The Temple Steps', emoji: '⛩️', intro: 'The Temple of Focus rises above the treeline. Each step requires concentration. Let nothing distract you from your habits.', opening: 'A thousand steps carved from gold stretch upward. At the top, the temple glows. Each step tests your focus.', ending: 'You reach the temple doors. They open silently. Inside, the air shimmers with concentrated energy. You are ready to enter.' },
  { title: 'The Silent Sanctuary', emoji: '🤫', intro: 'Inside the temple, silence is law. Your mind must be as disciplined as your body. Complete your meditation mission.', opening: 'The temple interior is vast and silent. Sound does not exist here. A monk sits in lotus position, waiting for you to join.', ending: 'The silence breaks with a single bell tone. You have achieved inner stillness. The temple reveals its inner chamber.' },
  { title: 'The Trial of Flames', emoji: '🔥', intro: 'The temple\'s inner chamber holds the Trial of Flames. Only those who maintain their habits under pressure will survive.', opening: 'Pillars of fire line the chamber. The floor is lava. A voice commands: "Walk through. Do not falter. Do not stop."', ending: 'You emerge from the flames unburnt. The temple bows to your discipline. A new power awakens within you.' },
  { title: 'The Base Camp', emoji: '🏕️', intro: 'The Mountain of Will towers above you. Base camp is your last rest before the climb. Prepare by completing all your habits.', opening: 'A cold wind hits you as you arrive at base camp. Climbers who failed lie frozen along the path. You must not join them.', ending: 'Your campfire burns steady. You have prepared well. The mountain awaits, and you are ready to climb.' },
  { title: 'The Ascent', emoji: '🧗', intro: 'The climb begins. Each handhold is a habit completed. Each foothold is a task finished. Do not let go.', opening: 'The mountain face is vertical. Handholds appear only when you complete a habit. The void yawns below.', ending: 'You pull yourself onto a ledge. Halfway up. The view is terrifying and beautiful. But the summit is still far above.' },
  { title: 'The Summit Storm', emoji: '⛈️', intro: 'A storm hits as you near the summit. Wind, rain, and lightning. Your habits are the only anchor in this chaos.', opening: 'Lightning strikes around you. The path ices over. The mountain itself seems to reject your presence. Prove it wrong.', ending: 'You stand at the summit. The storm breaks. Below you, the entire world spreads out. You have conquered the Mountain of Will.' },
  { title: 'The Gates of the Kingdom', emoji: '🏰', intro: 'The Kingdom of Consistency welcomes those who have proven their willpower. But the gates only open for the disciplined.', opening: 'Towering gates of purple crystal block your path. Inscribed upon them: "Only those who never waver may enter." The gates test your resolve.', ending: 'The gates open with a resonant hum. The kingdom\'s streets are paved with discipline. Citizens nod in respect as you walk past.' },
  { title: 'The Royal Court', emoji: '👑', intro: 'You are summoned to the Royal Court. The King of Consistency demands to see your daily routine. Prove it is unwavering.', opening: 'The throne room is vast. The King sits on a throne of crystallized habits. "Show me your consistency," he commands.', ending: 'The King stands and bows. "You are consistent. You may proceed to the deeper realms." He hands you a key of pure discipline.' },
  { title: 'The Unwavering Path', emoji: '🛤️', intro: 'A path through the kingdom tests your consistency over time. One missed habit sends you back to the start.', opening: 'A straight path stretches to the horizon. Signs along the way show your past failures. The path challenges you to walk without stumbling.', ending: 'You reach the end of the path. A portal shimmers ahead, leading to the Ocean of Wisdom. You have proven your consistency.' },
  { title: 'The Shore', emoji: '🏖️', intro: 'The Ocean of Wisdom stretches infinitely before you. To cross it, you must first master the habits of the mind.', opening: 'Waves crash against a black sand beach. The ocean is impossibly vast. A boat waits, but it only moves when you learn.', ending: 'The boat touches water and begins to glide. The ocean\'s surface reflects stars that do not exist in your sky. Wisdom lies ahead.' },
  { title: 'The Dive', emoji: '🤿', intro: 'Wisdom lies beneath the surface. You must dive deep, completing your reading and learning habits to breathe underwater.', opening: 'You plunge into the ocean. Water fills your lungs, but instead of drowning, you breathe knowledge. Ancient texts float around you.', ending: 'You surface with new understanding. The ocean has shared its secrets. A current pulls you toward the next challenge.' },
  { title: 'The Leviathan', emoji: '🐋', intro: 'A creature of ancient wisdom blocks your path. It will only let you pass if your knowledge is true. Complete your reading mission.', opening: 'A shape larger than mountains rises from the deep. The Leviathan speaks in a language older than time. It questions your wisdom.', ending: 'The Leviathan nods and sinks beneath the waves, clearing your path. You have proven your wisdom is genuine.' },
  { title: 'The Dunes', emoji: '🏜️', intro: 'The Desert of Temptation shimmers with mirages. Every distraction you have ever faced manifests here. Stay true to your habits.', opening: 'Heat waves distort the horizon. Mirages show your deepest desires: comfort, entertainment, ease. The sand pulls at your feet.', ending: 'The mirages fade as you walk through them without stopping. The desert respects those who are not tempted. An oasis appears.' },
  { title: 'The Mirage', emoji: '🏝️', intro: 'At the oasis, a figure offers you everything you want — for the price of abandoning one habit. Refuse and stay disciplined.', opening: 'A beautiful figure sits by the oasis pool. "Why struggle? Rest here. Skip just one habit. What difference does one day make?"', ending: 'You walk away from the oasis. The figure screams, revealing its true monstrous form. You were not tempted. The desert opens a path.' },
  { title: 'The Sandstorm', emoji: '🌪️', intro: 'A massive sandstorm engulfs you. You cannot see, cannot hear. Only your habits guide you through. Do not lose them.', opening: 'Sand blots out everything. Your senses are useless. In the howling wind, the only compass is your discipline. Walk forward.', ending: 'The storm clears. You stand at the desert\'s edge, before a wall of ice. The Frozen Sanctuary awaits those who survived temptation.' },
  { title: 'The Frozen Threshold', emoji: '🧊', intro: 'The Frozen Sanctuary is colder than anything you have felt. Only the warmth of completed habits keeps you alive.', opening: 'Ice stretches in every direction. Your breath freezes. But each completed habit generates a small flame within you. Stay warm.', ending: 'The ice cracks beneath your feet, revealing a hidden entrance. The sanctuary\'s interior is paradoxically warm. You have earned entry.' },
  { title: 'The Ice Labyrinth', emoji: ' labyrinth', intro: 'A maze of ice where every wrong turn represents a bad habit. Navigate by staying true to your daily mission.', opening: 'Walls of transparent ice form a maze. You can see through them but cannot pass. The correct path reveals itself only to the disciplined.', ending: 'You exit the labyrinth. Behind you, the ice walls shatter. Ahead, a throne of ice awaits, and upon it sits the sanctuary\'s guardian.' },
  { title: 'The Heart of Ice', emoji: '💎', intro: 'The sanctuary\'s core holds a crystal of frozen discipline. Claim it by completing all your habits with perfect consistency.', opening: 'A massive ice crystal pulses at the sanctuary\'s center. It contains the essence of perfect discipline. Reach for it.', ending: 'The crystal melts into your hand, filling you with cold clarity. The Frozen Sanctuary dissolves. Ahead, the Shadow Citadel looms.' },
  { title: 'The Shadow Gate', emoji: '🌑', intro: 'The Shadow Citadel stands in perpetual darkness. Your habits are the only light. The darker it gets, the brighter you must shine.', opening: 'A gate of solid shadow blocks your path. It absorbs all light. But your discipline generates a faint purple glow. Step through.', ending: 'The shadow parts for you. Inside the citadel, darkness is a weapon and a shield. You feel at home here. The shadows acknowledge you.' },
  { title: 'The Corridor of Echoes', emoji: '🔊', intro: 'A corridor where your past failures echo endlessly. Silence them by completing your habits without hesitation.', opening: 'Voices from your past repeat every excuse you ever made. "I will do it tomorrow." "I am too tired." They grow louder with each step.', ending: 'The echoes fade as you complete your mission without hesitation. The corridor opens into a vast throne room. Something waits in the darkness.' },
  { title: 'The Shadow Throne', emoji: '🪑', intro: 'A figure sits on the Shadow Throne — a version of you that gave up. Defeat it by showing superior discipline.', opening: 'Your shadow self sits on the throne, surrounded by abandoned habits. "I am what happens when you stop trying," it says. "Fight me."', ending: 'Your shadow self dissolves into wisps of darkness. The Shadow Citadel is yours. A staircase of shadows leads upward, toward the stars.' },
  { title: 'The Star Bridge', emoji: '🌟', intro: 'A bridge of starlight leads to the Celestial Kingdom. It holds only for those whose discipline shines bright. Keep your habits strong.', opening: 'A bridge of solid light stretches across an infinite void. Stars surround you. The bridge flickers with each moment of weakness. Walk steadily.', ending: 'You cross the bridge. The Celestial Kingdom shines before you, a city of light and crystal. Celestial beings watch your approach with interest.' },
  { title: 'The Court of Stars', emoji: '⭐', intro: 'Celestial beings test your discipline in ways you have never experienced. Complete your habits under their watchful gaze.', opening: 'A council of starlight beings sits in judgment. "Mortals rarely reach this place," their leader says. "Show us your discipline is real."', ending: 'The court nods in unison. "You are worthy. The path to the Void Dimension opens for you." A crack in reality appears behind the throne.' },
  { title: 'The Fall', emoji: '⬇️', intro: 'To reach the Void, you must fall through nothingness. Your habits are the only thing that exist here. Complete them to survive.', opening: 'You step into the crack and fall. There is no up, no down, no light, no sound. Only your discipline proves you exist. Complete your mission.', ending: 'You land on solid nothingness. The Void Dimension surrounds you — a place where only willpower has substance. You have arrived.' },
  { title: 'The Void', emoji: '🕳️', intro: 'In the Void, nothing is real except your actions. Your habits create the ground beneath your feet. Do not stop, or you fall forever.', opening: 'You float in infinite nothingness. Each habit you complete creates a stepping stone of light. Stop, and the stones vanish. Keep moving.', ending: 'A platform of light solidifies beneath you. The Void accepts your existence. Ahead, a throne of infinite complexity shimmers into view.' },
  { title: 'The Void King', emoji: '👁️', intro: 'The Void King rules over nothingness. He challenges your very existence. Prove you are real through unwavering discipline.', opening: 'A being of pure void sits on the throne. "Prove you exist," it says. "In the void, only action is real. Show me your actions."', ending: 'The Void King dissolves. "You are real. You are disciplined. You may proceed." A path of light leads to the Infinite Throne.' },
  { title: 'The Golden Path', emoji: '🟡', intro: 'The path to the Infinite Throne is paved with gold, but only for those who have maintained perfect habits. Walk it with discipline.', opening: 'A golden road stretches to infinity. At its end, a throne radiates infinite light. The road tests whether your discipline can endure forever.', ending: 'You reach the Infinite Throne. It is empty, waiting for a worthy occupant. But first, you must prove you are ready to sit upon it.' },
  { title: 'The Trial of Eternity', emoji: '♾️', intro: 'The throne tests whether your discipline can last forever. Complete your habits as if you will do so for all eternity.', opening: 'The throne speaks: "Many have sat here. All eventually stopped. Will you? Show me your eternal discipline." Time distorts around you.', ending: 'The throne accepts you. You sit, and for a moment, you see all of time. Then you stand. There is more to conquer. Reality awaits.' },
  { title: 'The Shattered Sky', emoji: '🔮', intro: 'Absolute Reality reveals itself as a world where truth and discipline are the same. Your habits literally shape the world around you.', opening: 'The sky fractures into a million pieces, each showing a different version of reality. In all of them, discipline is the anchor. Find yours.', ending: 'The pieces reassemble into a new sky — one you created through your actions. Reality bends to your discipline. A new realm beckons.' },
  { title: 'The Mirror World', emoji: '🪞', intro: 'A world that is the exact opposite of yours. Discipline is rebellion here. Complete your habits as an act of defiance.', opening: 'Everything is reversed. Laziness is praised, consistency is punished. But you know the truth. Complete your habits anyway.', ending: 'The mirror world shatters. You have proven that discipline is not contextual — it is absolute. The path to Beyond Existence opens.' },
  { title: 'The Final Mirror', emoji: 'markt', intro: 'One last mirror blocks your path. It shows the ultimate version of yourself. Become it by completing every habit perfectly.', opening: 'The mirror shows you as you could be — perfect, disciplined, powerful. But it is just a reflection. You must become it in reality.', ending: 'The mirror cracks. You have surpassed your own ideal. Beyond Existence is no longer a place — it is a state of being you have achieved.' },
  { title: 'The Edge', emoji: '🌌', intro: 'You stand at the edge of all existence. Beyond is nothing. Your habits are the only thing keeping you from falling into the void.', opening: 'A cliff stretches infinitely in both directions. Below, nothing. Above, nothing. You stand on the last fragment of reality. Do not fall.', ending: 'You do not fall. You walk forward into nothing and create ground with each step. You are beyond existence now. The Omega Realm calls.' },
  { title: 'The Omega Gate', emoji: 'Ω', intro: 'The Omega Gate is the last barrier before the ultimate realm. It demands your absolute best. Complete all habits flawlessly.', opening: 'A gate shaped like the Omega symbol blocks your path. It hums with finality. "Beyond me, there is no return," it warns. "Are you ready?"', ending: 'The gate opens. The Omega Realm is beautiful and terrifying. Every discipline you have ever practiced converges here into a single point.' },
  { title: 'The Convergence', emoji: '⚖️', intro: 'In the Omega Realm, all disciplines merge into one. Your habits, your workouts, your reading — they are all the same act now. Complete them.', opening: 'A sphere of infinite complexity floats before you. Inside it, every habit you have ever done swirls together. "Merge them," a voice commands.', ending: 'The sphere absorbs into your chest. You feel every discipline simultaneously. You are no longer practicing habits — you ARE the habits.' },
  { title: 'The Omega Being', emoji: '🌀', intro: 'A being of pure discipline waits at the Omega Realm\'s core. It is what you will become. Surpass it by completing your final habits.', opening: 'A figure of blinding light stands at the realm\'s center. "I am what you will be," it says. "But you must surpass me. Show me discipline beyond Omega."', ending: 'The Omega Being bows. "You have surpassed me. Go. The Final Infinity awaits. There, you will find the last truth of discipline."' },
  { title: 'The First Step', emoji: '🌅', intro: 'Final Infinity begins where everything else ends. The first step into this realm is the hardest. Take it with all your habits completed.', opening: 'A horizon of impossible colors stretches before you. The ground is made of pure light. Your first step here determines everything. Take it with discipline.', ending: 'Your foot touches the light and holds. You are walking on discipline itself. The Final Infinity stretches before you — five chapters remain.' },
  { title: 'The Journey Inward', emoji: '🧭', intro: 'In Final Infinity, the journey is not forward but inward. Your habits are the compass. Follow them to your core.', opening: 'The landscape shifts to match your inner state. When you are disciplined, the path is clear. When you waver, it distorts. Stay true.', ending: 'You reach your inner core — a point of absolute stillness. Here, you understand what discipline truly means. Two chapters remain.' },
  { title: 'The Last Enemy', emoji: '💀', intro: 'Your final enemy is not a boss or a beast. It is the version of yourself that wants to stop. Defeat it by completing your habits one last time.', opening: 'A figure stands in your path. It is you, but tired. You, but content. "We have done enough," it says. "Let us rest." Do not listen.', ending: 'Your tired self nods and fades. "You are right. We never stop." You absorb its strength. One chapter remains. The final one.' },
  { title: 'The Final Infinity', emoji: '∞', intro: 'The last chapter. The final test. Complete every habit, every quest, every mission. This is the culmination of everything you have worked for.', opening: 'Infinity spreads before you. There is no ground, no sky, no beginning, no end. Only you and your discipline. The System speaks one last time: "Complete everything."', ending: 'You stand at the end of all things. And you realize: this is not an ending. It is a beginning. Your discipline is eternal. The story never truly ends.' },
  { title: 'Eternal Dawn', emoji: '🌅', intro: 'A bonus chapter for those who never stop. Continue your habits, for the story is eternal and so are you.', opening: 'A new dawn breaks over a world you have shaped through discipline. The System says: "The story continues as long as you do. Welcome to eternity."', ending: 'The cycle begins anew, but you are different now. You are the master of discipline. And the story continues forever.' },
];

function generateChapters(): StoryChapter[] {
  const chapters: StoryChapter[] = [];
  for (let i = 0; i < 50; i++) {
    const meta = CHAPTER_TITLES[i % CHAPTER_TITLES.length];
    const region = STORY_REGIONS.find((r) => i + 1 >= r.chapterRange[0] && i + 1 <= r.chapterRange[1]) ?? STORY_REGIONS[0];
    const habit = pickHabit(i);
    const boss = pickBoss(i);
    const chapterNum = i + 1;
    const xpReq = Math.floor(Math.pow(i + 1, 2.2) * 100);

    chapters.push({
      id: `chapter_${chapterNum}`,
      chapter: chapterNum,
      regionId: region.id,
      title: meta.title,
      description: meta.intro,
      requiredXp: xpReq,
      openingCinematic: meta.opening,
      storyIntro: meta.intro,
      dialogues: [
        { id: `d_${i}_1`, speaker: 'The System', speakerType: 'narrator', text: meta.intro },
        { id: `d_${i}_2`, speaker: 'Guide', speakerType: 'npc', text: `Hunter, your mission is clear: ${habit.label}. Will you accept this challenge?`, choices: [
          { id: `c_${i}_a`, text: 'I accept. Let the mission begin.', response: 'Your resolve strengthens. The path forward opens.', rewardText: '+10 relationship with the Guide', relationshipChange: 10 },
          { id: `c_${i}_b`, text: 'Tell me more about this challenge.', response: 'The Guide explains the importance of this habit in your journey. Knowledge is power, hunter.', rewardText: '+5 relationship with the Guide', relationshipChange: 5 },
          { id: `c_${i}_c`, text: 'I will do it, but on my own terms.', response: 'The Guide nods. "Independence is a strength. But remember, the System does not bend." No reward, but no penalty either.', relationshipChange: 0 },
        ]},
        { id: `d_${i}_3`, speaker: boss.name, speakerType: 'boss', text: boss.introDialogue[0] },
      ],
      mainMission: {
        id: `mission_${chapterNum}`,
        label: habit.label,
        description: `Complete: ${habit.label}. This is your main mission for Chapter ${chapterNum}.`,
        habitId: habit.id,
        targetCount: 1,
      },
      sideQuests: pickSideQuests(i, 3 + (i % 6)),
      secretQuest: pickSecretQuest(i),
      eliteEnemy: { name: ['Shadow Stalker', 'Dust Wraith', 'Frost Revenant', 'Void Knight', 'Terror Shade'][i % 5], emoji: '👹', description: 'An elite enemy that tests your progress. Defeat it through consistent action.', hp: 50 + i * 10 },
      miniBoss: { name: ['The Gatekeeper', 'The Sentinel', 'The Warden', 'The Guardian', 'The Watcher'][i % 5], emoji: '🗡️', description: 'A mini-boss that guards the path forward. Show your discipline to pass.', hp: 80 + i * 15 },
      finalBoss: boss,
      treasureRoom: {
        description: `A hidden chamber in ${region.name} containing rewards for your perseverance. The door opens only for those who complete the mission.`,
        rewards: [
          { type: 'coins', amount: 100 + i * 50, label: `${100 + i * 50} Coins` },
          { type: 'xp', amount: 200 + i * 100, label: `${200 + i * 100} XP` },
          ...(i % 3 === 0 ? [{ type: 'aura' as const, itemId: 'ember', label: 'Ember Aura' }] : []),
          ...(i % 5 === 0 ? [{ type: 'title' as const, itemId: 'novice_hunter', label: 'Story Veteran Title' }] : []),
        ],
      },
      endingCinematic: meta.ending,
      rewards: [
        { type: 'coins', amount: 100 + i * 50, label: `${100 + i * 50} Coins` },
        { type: 'xp', amount: 200 + i * 100, label: `${200 + i * 100} XP` },
      ],
      emoji: meta.emoji,
    });
  }
  return chapters;
}

export const STORY_CHAPTERS: StoryChapter[] = generateChapters();

export function getChapterByIndex(index: number): StoryChapter | null {
  if (index < 0 || index >= STORY_CHAPTERS.length) return null;
  return STORY_CHAPTERS[index];
}

export function getRegionByChapter(chapter: number): StoryRegion {
  return STORY_REGIONS.find((r) => chapter >= r.chapterRange[0] && chapter <= r.chapterRange[1]) ?? STORY_REGIONS[0];
}

export function getRegionById(id: string): StoryRegion | undefined {
  return STORY_REGIONS.find((r) => r.id === id);
}
