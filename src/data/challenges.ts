import type { RequirementSpec } from '../lib/progression';

export interface BossChallengeDef {
  id: string;
  tier: 'Tier I' | 'Tier II' | 'Tier III' | 'Tier IV';
  category: 'Physical' | 'Discipline' | 'Consistency' | 'Mastery';
  title: string;
  subtitle: string;
  description: string;
  requirement: RequirementSpec;
  xpReward: number;
  unlockTitleId?: string;
  unlockFrameId?: string;
  unlockBadgeId?: string;
}

export const BOSS_CHALLENGES: BossChallengeDef[] = [
  {
    id: 'boss_iron_vanguard',
    tier: 'Tier I',
    category: 'Physical',
    title: 'Iron Vanguard',
    subtitle: 'Foundational Conditioning Trial',
    description: 'Complete 3 logged training sessions, accumulate 60 training minutes, and reach 1,000 lifetime XP.',
    requirement: { minWorkouts: 3, minTrainingMinutes: 60, minXp: 1000 },
    xpReward: 400,
    unlockTitleId: 'iron_will',
    unlockFrameId: 'shadow_frame',
    unlockBadgeId: 'first_dungeon',
  },
  {
    id: 'boss_unbroken_week',
    tier: 'Tier I',
    category: 'Discipline',
    title: 'Unbroken Protocol',
    subtitle: 'Seven-Day Operational Discipline',
    description: 'Hold a 7-day streak, achieve 3 full-clear quest days, and complete 25 total quests.',
    requirement: { minBestStreak: 7, minFullClearDays: 3, minQuestsCompleted: 25 },
    xpReward: 650,
    unlockTitleId: 'gate_explorer',
    unlockFrameId: 'crimson_frame',
    unlockBadgeId: 'week_streak',
  },
  {
    id: 'boss_endurance_engine',
    tier: 'Tier II',
    category: 'Physical',
    title: 'Endurance Engine',
    subtitle: 'Sustained Athletic Capacity',
    description: 'Record 15 training sessions, log 300 minutes under the clock, and accumulate 4,000 lifetime XP.',
    requirement: { minWorkouts: 15, minTrainingMinutes: 300, minXp: 4000 },
    xpReward: 1000,
    unlockTitleId: 'elite_hunter',
    unlockFrameId: 'frost_frame',
  },
  {
    id: 'boss_momentum_architect',
    tier: 'Tier II',
    category: 'Mastery',
    title: 'Momentum Architect',
    subtitle: 'High-Output Daily Cadence',
    description: 'Complete 100 verified quests and achieve 10 full-clear days.',
    requirement: { minQuestsCompleted: 100, minFullClearDays: 10 },
    xpReward: 1400,
    unlockTitleId: 'shadow_walker',
    unlockFrameId: 'golden_frame',
    unlockBadgeId: 'perfect_day',
  },
  {
    id: 'boss_obsidian_monolith',
    tier: 'Tier III',
    category: 'Consistency',
    title: 'Obsidian Monolith',
    subtitle: 'Monthly Zero-Excuses Standard',
    description: 'Maintain a 30-day best streak, 20 training sessions, and 12,000 lifetime XP.',
    requirement: { minBestStreak: 30, minWorkouts: 20, minXp: 12000 },
    xpReward: 2200,
    unlockTitleId: 'the_unbreakable',
    unlockFrameId: 'eclipse_frame',
    unlockBadgeId: 'month_streak',
  },
  {
    id: 'boss_apex_sovereign',
    tier: 'Tier IV',
    category: 'Mastery',
    title: 'Apex Sovereign',
    subtitle: 'The Ultimate Personal Standard',
    description: 'Reach 30,000 lifetime XP, 40 logged training sessions, and 300 completed quests.',
    requirement: { minXp: 30000, minWorkouts: 40, minQuestsCompleted: 300 },
    xpReward: 3500,
    unlockTitleId: 'shadow_monarch',
    unlockFrameId: 'monarch_frame',
    unlockBadgeId: 'boss_slayer',
  },
];
