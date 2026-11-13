export interface Milestone {
  id: string;
  name: string;
  description: string;
  emoji: string;
  type: 'tasks' | 'streak' | 'dungeons' | 'xp' | 'workouts';
  threshold: number;
  reward: {
    coins: number;
    xp: number;
    badgeId?: string;
    auraId?: string;
  };
}

export const MILESTONES: Milestone[] = [
  {
    id: 'tasks_10',
    name: 'First Steps',
    description: 'Complete 10 quests in total',
    emoji: '🎯',
    type: 'tasks',
    threshold: 10,
    reward: { coins: 0, xp: 80, badgeId: 'first_steps' },
  },
  {
    id: 'tasks_100',
    name: 'Momentum Builder',
    description: 'Complete 100 quests in total',
    emoji: '⚡',
    type: 'tasks',
    threshold: 100,
    reward: { coins: 0, xp: 250 },
  },
  {
    id: 'tasks_1000',
    name: 'Unstoppable Force',
    description: 'Complete 1,000 quests in total',
    emoji: '🌪️',
    type: 'tasks',
    threshold: 1000,
    reward: { coins: 0, xp: 2000 },
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day discipline streak',
    emoji: '🔥',
    type: 'streak',
    threshold: 7,
    reward: { coins: 0, xp: 200, badgeId: 'week_streak' },
  },
  {
    id: 'streak_30',
    name: 'Monthly Legend',
    description: 'Maintain a 30-day discipline streak',
    emoji: '👑',
    type: 'streak',
    threshold: 30,
    reward: { coins: 0, xp: 600, badgeId: 'month_streak' },
  },
  {
    id: 'streak_100',
    name: 'Century Champion',
    description: 'Maintain a 100-day discipline streak',
    emoji: '💎',
    type: 'streak',
    threshold: 100,
    reward: { coins: 0, xp: 2000 },
  },
  {
    id: 'workouts_5',
    name: 'Training Initiate',
    description: 'Log 5 completed training sessions',
    emoji: '🏋️',
    type: 'workouts',
    threshold: 5,
    reward: { coins: 0, xp: 200 },
  },
  {
    id: 'workouts_25',
    name: 'Conditioned Athlete',
    description: 'Log 25 completed training sessions',
    emoji: '💪',
    type: 'workouts',
    threshold: 25,
    reward: { coins: 0, xp: 750 },
  },
  {
    id: 'workouts_50',
    name: 'Iron Veteran',
    description: 'Log 50 completed training sessions',
    emoji: '🛡️',
    type: 'workouts',
    threshold: 50,
    reward: { coins: 0, xp: 1800 },
  },
  {
    id: 'xp_10000',
    name: 'Rapid Ascender',
    description: 'Earn 10,000 lifetime XP',
    emoji: '🌟',
    type: 'xp',
    threshold: 10000,
    reward: { coins: 0, xp: 500 },
  },
  {
    id: 'xp_100000',
    name: 'Power Surge',
    description: 'Earn 100,000 lifetime XP',
    emoji: '⭐',
    type: 'xp',
    threshold: 100000,
    reward: { coins: 0, xp: 2000 },
  },
  {
    id: 'xp_1000000',
    name: 'Cosmic Sovereign',
    description: 'Earn 1,000,000 lifetime XP',
    emoji: '🌌',
    type: 'xp',
    threshold: 1000000,
    reward: { coins: 0, xp: 5000, auraId: 'cosmic' },
  },
];

export function getMilestoneById(id: string): Milestone | undefined {
  return MILESTONES.find((milestone) => milestone.id === id);
}
