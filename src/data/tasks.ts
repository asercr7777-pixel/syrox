export interface CoreTask {
  id: string;
  label: string;
  emoji: string;
  points: number;
  category: 'body' | 'mind' | 'spirit' | 'work';
}

export const CORE_TASKS: CoreTask[] = [
  { id: 'sleep', label: 'Sleep 8 hours', emoji: '😴', points: 60, category: 'body' },
  { id: 'train', label: 'Train for 1 hour', emoji: '💪', points: 100, category: 'body' },
  { id: 'pray', label: 'Pray', emoji: '🕌', points: 50, category: 'spirit' },
  { id: 'work', label: 'Work', emoji: '💼', points: 90, category: 'work' },
  { id: 'eat_healthy', label: 'Eat healthy', emoji: '🥗', points: 50, category: 'body' },
  { id: 'read_quran', label: 'Read 10 pages in Quran', emoji: '📖', points: 50, category: 'spirit' },
  { id: 'water', label: 'Drink 8 glasses of water', emoji: '💧', points: 40, category: 'body' },
];

export interface WorkoutDay {
  id: 'push' | 'pull' | 'leg';
  name: string;
  emoji: string;
  description: string;
  sections: { name: string; type: 'stretching' | 'main' | 'plyometric' }[];
}

export const WORKOUT_SPLIT: WorkoutDay[] = [
  {
    id: 'push',
    name: 'Day 1 — Push',
    emoji: '💥',
    description: 'Chest, shoulders, triceps focus.',
    sections: [
      { name: 'Stretching', type: 'stretching' },
      { name: 'Push', type: 'main' },
      { name: 'Plyometric', type: 'plyometric' },
    ],
  },
  {
    id: 'pull',
    name: 'Day 2 — Pull',
    emoji: '🏋️',
    description: 'Back and biceps focus.',
    sections: [
      { name: 'Stretching', type: 'stretching' },
      { name: 'Pull', type: 'main' },
      { name: 'Plyometric', type: 'plyometric' },
    ],
  },
  {
    id: 'leg',
    name: 'Day 3 — Leg',
    emoji: '🦵',
    description: 'Quads, hamstrings, calves focus.',
    sections: [
      { name: 'Stretching', type: 'stretching' },
      { name: 'Leg', type: 'main' },
      { name: 'Plyometric', type: 'plyometric' },
    ],
  },
];

export interface DefaultExercise {
  name: string;
  sets: number;
  reps: string;
  section: 'stretching' | 'main' | 'plyometric';
}

export const DEFAULT_EXERCISES: Record<WorkoutDay['id'], DefaultExercise[]> = {
  push: [
    { name: 'Arm Circles', sets: 2, reps: '30s', section: 'stretching' },
    { name: 'Chest Stretch', sets: 2, reps: '30s', section: 'stretching' },
    { name: 'Push-ups', sets: 4, reps: '12-15', section: 'main' },
    { name: 'Dumbbell Press', sets: 4, reps: '10-12', section: 'main' },
    { name: 'Shoulder Press', sets: 3, reps: '10-12', section: 'main' },
    { name: 'Tricep Dips', sets: 3, reps: '12-15', section: 'main' },
    { name: 'Clap Push-ups', sets: 3, reps: '8-10', section: 'plyometric' },
  ],
  pull: [
    { name: 'Back Stretch', sets: 2, reps: '30s', section: 'stretching' },
    { name: 'Shoulder Rolls', sets: 2, reps: '30s', section: 'stretching' },
    { name: 'Pull-ups', sets: 4, reps: '8-12', section: 'main' },
    { name: 'Bent-over Rows', sets: 4, reps: '10-12', section: 'main' },
    { name: 'Bicep Curls', sets: 3, reps: '12-15', section: 'main' },
    { name: 'Face Pulls', sets: 3, reps: '15-20', section: 'main' },
    { name: 'Plyometric Rows', sets: 3, reps: '8-10', section: 'plyometric' },
  ],
  leg: [
    { name: 'Leg Swings', sets: 2, reps: '30s', section: 'stretching' },
    { name: 'Hip Openers', sets: 2, reps: '30s', section: 'stretching' },
    { name: 'Squats', sets: 4, reps: '12-15', section: 'main' },
    { name: 'Lunges', sets: 4, reps: '12 each', section: 'main' },
    { name: 'Romanian Deadlift', sets: 3, reps: '10-12', section: 'main' },
    { name: 'Calf Raises', sets: 4, reps: '15-20', section: 'main' },
    { name: 'Jump Squats', sets: 3, reps: '12-15', section: 'plyometric' },
  ],
};

export interface DailyChallenge {
  id: string;
  label: string;
  description: string;
  xp: number;
  coins: number;
  check: (state: any) => boolean;
}

export const DAILY_CHALLENGES: DailyChallenge[] = [
  {
    id: 'all_main',
    label: 'Complete all main tasks',
    description: 'Finish every core task today.',
    xp: 150,
    coins: 80,
    check: (s) => s && s.coreCompleted && Object.values(s.coreCompleted).every(Boolean),
  },
  {
    id: 'workout_done',
    label: 'Finish a workout',
    description: 'Complete any workout session.',
    xp: 120,
    coins: 60,
    check: (s) => s && s.workoutsCompletedToday > 0,
  },
  {
    id: 'drink_water',
    label: 'Drink enough water',
    description: 'Complete the water task.',
    xp: 60,
    coins: 30,
    check: (s) => s && s.coreCompleted && s.coreCompleted.water,
  },
  {
    id: 'read_20',
    label: 'Read for 20 minutes',
    description: 'Complete the Quran reading task.',
    xp: 80,
    coins: 40,
    check: (s) => s && s.coreCompleted && s.coreCompleted.read_quran,
  },
  {
    id: 'dungeon_run',
    label: 'Clear a dungeon',
    description: 'Complete today\'s dungeon.',
    xp: 200,
    coins: 100,
    check: (s) => s && s.dungeonClearedToday,
  },
  {
    id: 'no_miss',
    label: 'No missed tasks',
    description: 'Do not miss any core task today.',
    xp: 100,
    coins: 50,
    check: (s) => s && s.coreCompleted && Object.values(s.coreCompleted).every(Boolean),
  },
];

export const DAILY_LOGIN_REWARDS = [
  { day: 1, type: 'coins', amount: 50, label: '50 Coins' },
  { day: 2, type: 'xp', amount: 100, label: '100 XP' },
  { day: 3, type: 'coins', amount: 100, label: '100 Coins' },
  { day: 4, type: 'shards', amount: 5, label: '5 Aura Shards' },
  { day: 5, type: 'xp', amount: 200, label: '200 XP' },
  { day: 6, type: 'chest', amount: 1, label: 'Mystery Chest' },
  { day: 7, type: 'coins', amount: 250, label: '250 Coins + Streak Shield', shield: true },
  { day: 8, type: 'coins', amount: 100, label: '100 Coins' },
  { day: 9, type: 'xp', amount: 200, label: '200 XP' },
  { day: 10, type: 'shards', amount: 10, label: '10 Aura Shards' },
  { day: 11, type: 'coins', amount: 150, label: '150 Coins' },
  { day: 12, type: 'xp', amount: 300, label: '300 XP' },
  { day: 13, type: 'chest', amount: 1, label: 'Mystery Chest' },
  { day: 14, type: 'coins', amount: 300, label: '300 Coins + Rare Aura Roll', aura: 'rare' },
  { day: 15, type: 'coins', amount: 150, label: '150 Coins' },
  { day: 16, type: 'xp', amount: 300, label: '300 XP' },
  { day: 17, type: 'shards', amount: 15, label: '15 Aura Shards' },
  { day: 18, type: 'coins', amount: 200, label: '200 Coins' },
  { day: 19, type: 'chest', amount: 1, label: 'Mystery Chest' },
  { day: 20, type: 'xp', amount: 500, label: '500 XP' },
  { day: 21, type: 'coins', amount: 400, label: '400 Coins + Epic Aura Roll', aura: 'epic' },
  { day: 22, type: 'shards', amount: 20, label: '20 Aura Shards' },
  { day: 23, type: 'xp', amount: 400, label: '400 XP' },
  { day: 24, type: 'chest', amount: 2, label: '2 Mystery Chests' },
  { day: 25, type: 'coins', amount: 500, label: '500 Coins' },
  { day: 26, type: 'xp', amount: 600, label: '600 XP' },
  { day: 27, type: 'shards', amount: 25, label: '25 Aura Shards' },
  { day: 28, type: 'chest', amount: 2, label: '2 Mystery Chests' },
  { day: 29, type: 'xp', amount: 800, label: '800 XP' },
  { day: 30, type: 'aura', amount: 1, label: 'Legendary Aura Roll', aura: 'legendary' },
];

export const SPIN_REWARDS = [
  { id: 'coins_50', label: '50 Coins', type: 'coins', amount: 50, weight: 25, color: '#f59e0b' },
  { id: 'xp_100', label: '100 XP', type: 'xp', amount: 100, weight: 20, color: '#ff7a18' },
  { id: 'coins_100', label: '100 Coins', type: 'coins', amount: 100, weight: 18, color: '#fbbf24' },
  { id: 'double_xp', label: 'Double XP (1h)', type: 'double_xp', amount: 1, weight: 10, color: '#a855f7' },
  { id: 'shards_10', label: '10 Aura Shards', type: 'shards', amount: 10, weight: 12, color: '#06b6d4' },
  { id: 'chest', label: 'Mystery Chest', type: 'chest', amount: 1, weight: 8, color: '#10b981' },
  { id: 'weapon', label: 'Random Weapon', type: 'weapon', amount: 1, weight: 5, color: '#3b82f6' },
  { id: 'aura', label: 'Random Aura', type: 'aura', amount: 1, weight: 2, color: '#ec4899' },
];

export const AI_SUGGESTIONS = [
  "You're building real momentum. Don't stop now — the next rank is closer than it feels.",
  "Discipline is a muscle. Today's workout is tomorrow's strength.",
  "Missed yesterday? Good. The comeback is where champions are forged.",
  "Your streak is your shield. Protect it with today's actions.",
  "Small wins compound. Complete one task and watch the rest follow.",
  "The shadow grows stronger with every task. Keep feeding it.",
  "Rest is part of training. Sleep well tonight, hunter.",
  "Water, prayer, reading — the foundation is simple. Execute.",
  "You don't rise to the level of your goals. You fall to the level of your systems.",
  "The dungeon resets at midnight. Don't waste the opportunity.",
];
