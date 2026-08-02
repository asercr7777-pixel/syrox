export interface StoryScene {
  id: string;
  chapter: number;
  title: string;
  emoji: string;
  bgGradient: string;
  dialogue: DialogueLine[];
  objective?: {
    label: string;
    hint: string;
  };
  reward?: { type: 'xp' | 'coins'; amount: number; label: string };
  unlocks?: string;
}

export interface DialogueLine {
  speaker: 'shadow' | 'narrator' | 'system';
  text: string;
  emotion?: 'neutral' | 'happy' | 'serious' | 'excited' | 'mysterious';
}

const SHADOW = {
  neutral: '🌑',
  happy: '😊',
  serious: '😤',
  excited: '🔥',
  mysterious: '👁️',
};

export const STORY_SCENES: StoryScene[] = [
  {
    id: 'scene_01_awakening',
    chapter: 1,
    title: 'Awakening',
    emoji: '🌑',
    bgGradient: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    dialogue: [
      { speaker: 'narrator', text: 'You open your eyes in an endless darkness. You cannot remember how you got here. The air feels heavy, charged with an energy you have never felt before.' },
      { speaker: 'shadow', text: 'So... you have finally awakened. I was beginning to wonder if you would ever open your eyes.', emotion: 'mysterious' },
      { speaker: 'shadow', text: 'Welcome, Hunter. My name is Shadow. I will be your guide in this world.', emotion: 'neutral' },
      { speaker: 'shadow', text: 'You have been chosen. The System has selected you as a Player — one who must grow through discipline to survive.', emotion: 'serious' },
    ],
    reward: { type: 'xp', amount: 50, label: '50 XP — First Step' },
    unlocks: 'scene_02_system',
  },
  {
    id: 'scene_02_system',
    chapter: 1,
    title: 'The System',
    emoji: '⚙️',
    bgGradient: 'linear-gradient(135deg, #0f0c29, #1a1a3e, #0f0c29)',
    dialogue: [
      { speaker: 'shadow', text: 'This world operates on a System. Think of it as the rules of reality itself.', emotion: 'neutral' },
      { speaker: 'shadow', text: 'The System rewards those who are disciplined. Every action you take in the real world — every task you complete — feeds your power here.', emotion: 'serious' },
      { speaker: 'shadow', text: 'Your body in the real world is connected to your soul here. If you grow stronger there, you grow stronger everywhere.', emotion: 'neutral' },
      { speaker: 'shadow', text: 'Let me explain the core mechanics. Listen carefully — your survival depends on it.', emotion: 'serious' },
    ],
    reward: { type: 'coins', amount: 30, label: '30 Coins — System Initiated' },
    unlocks: 'scene_03_discipline',
  },
  {
    id: 'scene_03_discipline',
    chapter: 2,
    title: 'The Discipline System',
    emoji: '💪',
    bgGradient: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
    dialogue: [
      { speaker: 'shadow', text: 'Discipline is the foundation of everything. It is the measure of your commitment.', emotion: 'neutral' },
      { speaker: 'shadow', text: 'Every day, you have Core Tasks — sleep, training, prayer, work, healthy eating, reading, and water. These are not optional. They are your daily quests.', emotion: 'serious' },
      { speaker: 'shadow', text: 'When you complete a task, the System grants you Points. These points determine your discipline score for the day.', emotion: 'neutral' },
      { speaker: 'shadow', text: 'A perfect day — all tasks complete — earns you bonus rewards and extends your streak. Your streak is your shield against failure.', emotion: 'excited' },
      { speaker: 'shadow', text: 'You can also create Custom Tasks for anything else you want to track. The more you do, the stronger you become.', emotion: 'happy' },
    ],
    objective: { label: 'Complete your first core task', hint: 'Go to the Tasks page and check off one task.' },
    reward: { type: 'xp', amount: 100, label: '100 XP — Discipline Awakened' },
    unlocks: 'scene_04_ranks',
  },
  {
    id: 'scene_04_ranks',
    chapter: 2,
    title: 'Ranks',
    emoji: '🎖️',
    bgGradient: 'linear-gradient(135deg, #0f3460, #16537e, #0f3460)',
    dialogue: [
      { speaker: 'shadow', text: 'Every Hunter is ranked by their power. You start at Rank E — the weakest. But do not let that discourage you.', emotion: 'neutral' },
      { speaker: 'shadow', text: 'As you earn XP, you will climb: E, D, C, B, A, S... and beyond. The legendary Shadow Hunter rank. And perhaps... even Mr. BYDA himself.', emotion: 'mysterious' },
      { speaker: 'shadow', text: 'Each rank unlocks new abilities, new items, and new challenges. The higher you climb, the more the world opens to you.', emotion: 'excited' },
      { speaker: 'shadow', text: 'Your rank is visible to all. It is a symbol of your dedication. Wear it with pride.', emotion: 'serious' },
    ],
    reward: { type: 'coins', amount: 50, label: '50 Coins — Rank Knowledge' },
    unlocks: 'scene_05_coins_xp',
  },
  {
    id: 'scene_05_coins_xp',
    chapter: 3,
    title: 'Coins and XP',
    emoji: '💰',
    bgGradient: 'linear-gradient(135deg, #2d1b00, #4a3300, #2d1b00)',
    dialogue: [
      { speaker: 'shadow', text: 'Two currencies flow through the System: Coins and XP. Both are essential.', emotion: 'neutral' },
      { speaker: 'shadow', text: 'XP — Experience Points — determine your level and rank. You earn XP by completing tasks, clearing dungeons, and finishing quests. It is permanent. It never goes away.', emotion: 'serious' },
      { speaker: 'shadow', text: 'Coins are your spending currency. You earn them from tasks, quests, daily rewards, and the spin wheel. Spend them in the Marketplace on weapons, auras, titles, and more.', emotion: 'happy' },
      { speaker: 'shadow', text: 'The more disciplined you are, the richer you become. A wealthy hunter is a well-equipped hunter.', emotion: 'excited' },
    ],
    reward: { type: 'coins', amount: 100, label: '100 Coins — Economy Lesson' },
    unlocks: 'scene_06_quests',
  },
  {
    id: 'scene_06_quests',
    chapter: 3,
    title: 'Quests',
    emoji: '📜',
    bgGradient: 'linear-gradient(135deg, #1b0d2e, #2d1b4e, #1b0d2e)',
    dialogue: [
      { speaker: 'shadow', text: 'Quests are missions given by the System. They come in many forms: Daily, Weekly, Monthly, Story, Challenge, and even Hidden quests.', emotion: 'neutral' },
      { speaker: 'shadow', text: 'Each quest has a target — complete a number of tasks, reach a streak, clear dungeons. When you meet the target, you claim your reward.', emotion: 'serious' },
      { speaker: 'shadow', text: 'Some quests are easy and quick. Others take weeks. The hardest quests give the most powerful rewards.', emotion: 'excited' },
      { speaker: 'shadow', text: 'Hidden quests are special. They appear without warning. Only the most disciplined hunters will find them.', emotion: 'mysterious' },
      { speaker: 'shadow', text: 'Check your Quest Board regularly. An unclaimed reward is a wasted reward.', emotion: 'serious' },
    ],
    objective: { label: 'Check the Quest Board', hint: 'Visit the Quests page to see available quests.' },
    reward: { type: 'xp', amount: 150, label: '150 XP — Quest Knowledge' },
    unlocks: 'scene_07_dungeons',
  },
  {
    id: 'scene_07_dungeons',
    chapter: 4,
    title: 'Dungeons',
    emoji: '🏰',
    bgGradient: 'linear-gradient(135deg, #1a0a0a, #2d1414, #1a0a0a)',
    dialogue: [
      { speaker: 'shadow', text: 'Dungeons are challenges that appear in your path. Each dungeon has a boss — a powerful enemy that tests your discipline.', emotion: 'serious' },
      { speaker: 'shadow', text: 'To clear a dungeon, you must prove your strength. The System measures your daily discipline. If your score is high enough, the boss falls.', emotion: 'neutral' },
      { speaker: 'shadow', text: 'Clearing a dungeon grants you rare loot — weapons, auras, shields, and sometimes... legendary items.', emotion: 'excited' },
      { speaker: 'shadow', text: 'Some dungeons are secret. They appear randomly and vanish quickly. If you see one, do not hesitate.', emotion: 'mysterious' },
      { speaker: 'shadow', text: 'The strongest hunters clear dungeons every day. Make it a habit. Make it a ritual.', emotion: 'serious' },
    ],
    reward: { type: 'coins', amount: 75, label: '75 Coins — Dungeon Knowledge' },
    unlocks: 'scene_08_auras',
  },
  {
    id: 'scene_08_auras',
    chapter: 4,
    title: 'Auras',
    emoji: '✨',
    bgGradient: 'linear-gradient(135deg, #0d1b2e, #1b3a5e, #0d1b2e)',
    dialogue: [
      { speaker: 'shadow', text: 'Auras are manifestations of your inner power. They surround you with visible energy — a glow that other hunters can see.', emotion: 'neutral' },
      { speaker: 'shadow', text: 'Auras come in rarities: Common, Rare, Epic, Legendary, and Mythic. The rarer the aura, the more impressive your presence.', emotion: 'excited' },
      { speaker: 'shadow', text: 'You start with the Ember aura — a basic flame. But as you progress, you will unlock the Frost aura, the Shadow aura, and perhaps... the Shadow Monarch aura itself.', emotion: 'mysterious' },
      { speaker: 'shadow', text: 'Equip your aura from your Inventory. It will follow you everywhere — on your profile, in dungeons, and on the leaderboard.', emotion: 'neutral' },
    ],
    reward: { type: 'xp', amount: 120, label: '120 XP — Aura Knowledge' },
    unlocks: 'scene_09_weapons',
  },
  {
    id: 'scene_09_weapons',
    chapter: 5,
    title: 'Weapons',
    emoji: '⚔️',
    bgGradient: 'linear-gradient(135deg, #2e0d0d, #4e1b1b, #2e0d0d)',
    dialogue: [
      { speaker: 'shadow', text: 'Weapons are your tools of war. They do not deal physical damage — they represent your strength in the System.', emotion: 'neutral' },
      { speaker: 'shadow', text: 'Like auras, weapons come in rarities. A common dagger, a rare sword, an epic greatsword, a legendary weapon forged in shadow.', emotion: 'excited' },
      { speaker: 'shadow', text: 'You can obtain weapons from dungeons, the Marketplace, and chests. Some can only be earned through special quests.', emotion: 'neutral' },
      { speaker: 'shadow', text: 'Equip your weapon from your Inventory. It appears on your profile and in battle scenes.', emotion: 'happy' },
      { speaker: 'shadow', text: 'A hunter without a weapon is like a warrior without fists. Find one. Equip it. Own it.', emotion: 'serious' },
    ],
    reward: { type: 'coins', amount: 75, label: '75 Coins — Weapon Knowledge' },
    unlocks: 'scene_10_titles',
  },
  {
    id: 'scene_10_titles',
    chapter: 5,
    title: 'Titles',
    emoji: '🏷️',
    bgGradient: 'linear-gradient(135deg, #2e1b0d, #4e3b1b, #2e1b0d)',
    dialogue: [
      { speaker: 'shadow', text: 'Titles are honorifics — names that precede you. They tell other hunters who you are before you even speak.', emotion: 'neutral' },
      { speaker: 'shadow', text: '"The Awakened", "Dungeon Conqueror", "Shadow Walker", "Monarch" — each title is earned through specific achievements.', emotion: 'excited' },
      { speaker: 'shadow', text: 'Some titles are common. Others are so rare that only a handful of hunters have ever worn them.', emotion: 'mysterious' },
      { speaker: 'shadow', text: 'Equip your title from your Inventory. It will appear next to your name on your profile and the leaderboard.', emotion: 'happy' },
    ],
    reward: { type: 'xp', amount: 100, label: '100 XP — Title Knowledge' },
    unlocks: 'scene_11_achievements',
  },
  {
    id: 'scene_11_achievements',
    chapter: 6,
    title: 'Achievements',
    emoji: '🏆',
    bgGradient: 'linear-gradient(135deg, #2e2e0d, #4e4e1b, #2e2e0d)',
    dialogue: [
      { speaker: 'shadow', text: 'Achievements are milestones. They mark the moments when you proved yourself beyond doubt.', emotion: 'neutral' },
      { speaker: 'shadow', text: 'Your first task. Your first dungeon. Your first perfect day. Your first 30-day streak. Each achievement is a badge of honor.', emotion: 'excited' },
      { speaker: 'shadow', text: 'Some achievements are easy — your first steps. Others require months of dedication. A few are secret, hidden until you stumble upon them.', emotion: 'mysterious' },
      { speaker: 'shadow', text: 'Achievements are unlocked automatically when you meet the conditions. You do not need to claim them. The System watches.', emotion: 'serious' },
      { speaker: 'shadow', text: 'Check your Achievements page to see how far you have come — and how far you have yet to go.', emotion: 'happy' },
    ],
    objective: { label: 'Check your Achievements', hint: 'Visit the Achievements page to see your progress.' },
    reward: { type: 'coins', amount: 100, label: '100 Coins — Achievement Knowledge' },
    unlocks: 'scene_12_journey_begins',
  },
  {
    id: 'scene_12_journey_begins',
    chapter: 6,
    title: 'The Journey Begins',
    emoji: '🔥',
    bgGradient: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    dialogue: [
      { speaker: 'shadow', text: 'You now know the basics of this world. The System. Discipline. Ranks. Coins. XP. Quests. Dungeons. Auras. Weapons. Titles. Achievements.', emotion: 'neutral' },
      { speaker: 'shadow', text: 'But knowing is not enough. You must ACT. The System does not reward knowledge — it rewards action.', emotion: 'serious' },
      { speaker: 'shadow', text: 'Go now. Complete your tasks. Clear your dungeons. Climb the ranks. I will be watching.', emotion: 'excited' },
      { speaker: 'shadow', text: 'And remember... I am always here. Whenever you return to Story Mode, I will guide you to the next chapter of your journey.', emotion: 'mysterious' },
      { speaker: 'shadow', text: 'The path to Shadow Monarch begins with a single step. Take it.', emotion: 'serious' },
    ],
    reward: { type: 'xp', amount: 200, label: '200 XP — Journey Begins' },
    unlocks: 'scene_13_first_gate',
  },
  {
    id: 'scene_13_first_gate',
    chapter: 7,
    title: 'The First Gate',
    emoji: '🚪',
    bgGradient: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
    dialogue: [
      { speaker: 'narrator', text: 'A massive gate materializes before you, pulsing with blue energy. Shadows swirl around its edges.' },
      { speaker: 'shadow', text: 'Your first real challenge. This gate is a Dungeon. Behind it lies a boss — a creature born from indiscipline.', emotion: 'serious' },
      { speaker: 'shadow', text: 'To open this gate, you must prove your discipline. Complete your daily tasks. The System will measure your worth.', emotion: 'neutral' },
      { speaker: 'shadow', text: 'When you are ready, visit the Dungeons page. Face the boss. Show me what you have learned.', emotion: 'excited' },
    ],
    objective: { label: 'Clear your first Dungeon', hint: 'Go to the Dungeons page and defeat the boss.' },
    reward: { type: 'coins', amount: 150, label: '150 Coins — Gate Walker' },
    unlocks: 'scene_14_rising',
  },
  {
    id: 'scene_14_rising',
    chapter: 7,
    title: 'Rising',
    emoji: '📈',
    bgGradient: 'linear-gradient(135deg, #0d2e1b, #1b4e3b, #0d2e1b)',
    dialogue: [
      { speaker: 'shadow', text: 'You cleared the gate. You defeated the boss. The System acknowledges you.', emotion: 'happy' },
      { speaker: 'shadow', text: 'But this is only the beginning. The path ahead is long. Each rank brings new challenges, new dungeons, new quests.', emotion: 'serious' },
      { speaker: 'shadow', text: 'Your discipline is your weapon. Your streak is your shield. Your consistency is your armor.', emotion: 'neutral' },
      { speaker: 'shadow', text: 'Keep going, Hunter. The Shadow Monarch waits at the end of this path. And I... I will walk with you every step of the way.', emotion: 'mysterious' },
    ],
    reward: { type: 'xp', amount: 300, label: '300 XP — Rising Hunter' },
    unlocks: null,
  },
];

export function getSceneById(id: string): StoryScene | undefined {
  return STORY_SCENES.find((s) => s.id === id);
}

export function getSceneIndex(id: string): number {
  return STORY_SCENES.findIndex((s) => s.id === id);
}

export function getNextScene(id: string): StoryScene | null {
  const idx = getSceneIndex(id);
  if (idx < 0 || idx >= STORY_SCENES.length - 1) return null;
  return STORY_SCENES[idx + 1];
}

export function getTotalScenes(): number {
  return STORY_SCENES.length;
}

export function getShadowEmoji(emotion: DialogueLine['emotion'] = 'neutral'): string {
  return SHADOW[emotion] ?? SHADOW.neutral;
}
