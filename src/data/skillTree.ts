import type { RequirementSpec } from '../lib/progression';

export type SkillBranchId =
  | 'physical'
  | 'discipline'
  | 'mental'
  | 'learning'
  | 'productivity'
  | 'consistency';

export interface SkillNode {
  id: string;
  branch: SkillBranchId;
  tier: 1 | 2 | 3;
  name: string;
  description: string;
  benefit: string;
  requirement: RequirementSpec;
}

export interface SkillBranchMeta {
  id: SkillBranchId;
  name: string;
  subtitle: string;
  accent: string;
}

export const SKILL_BRANCHES: SkillBranchMeta[] = [
  {
    id: 'physical',
    name: 'Physical Development',
    subtitle: 'Strength output and logged training capacity',
    accent: '#ff5d73',
  },
  {
    id: 'discipline',
    name: 'Discipline',
    subtitle: 'Full-clear execution across core daily commitments',
    accent: '#a78bfa',
  },
  {
    id: 'mental',
    name: 'Mental Performance',
    subtitle: 'Endurance under sustained multi-session effort',
    accent: '#5cecff',
  },
  {
    id: 'learning',
    name: 'Learning & Mastery',
    subtitle: 'Accumulated lifetime XP and rank progression',
    accent: '#f4c95d',
  },
  {
    id: 'productivity',
    name: 'Productivity',
    subtitle: 'Total verified quests completed across sessions',
    accent: '#76f5bd',
  },
  {
    id: 'consistency',
    name: 'Consistency',
    subtitle: 'Unbroken daily chains and resilience over time',
    accent: '#38bdf8',
  },
];

export const SKILL_NODES: SkillNode[] = [
  // Physical Development
  {
    id: 'phys_1',
    branch: 'physical',
    tier: 1,
    name: 'Iron Foundation',
    description: 'Complete your first structured training session.',
    benefit: 'Establishes baseline physical log tracking.',
    requirement: { minWorkouts: 1 },
  },
  {
    id: 'phys_2',
    branch: 'physical',
    tier: 2,
    name: 'Kinetic Engine',
    description: 'Record 10 completed training sessions.',
    benefit: 'Unlocks intermediate strength progression status.',
    requirement: { minWorkouts: 10 },
  },
  {
    id: 'phys_3',
    branch: 'physical',
    tier: 3,
    name: 'Apex Conditioning',
    description: 'Complete 30 workouts and 600 logged training minutes.',
    benefit: 'Signifies sustained physical mastery.',
    requirement: { minWorkouts: 30, minTrainingMinutes: 600 },
  },

  // Discipline
  {
    id: 'disc_1',
    branch: 'discipline',
    tier: 1,
    name: 'Protocol Initiate',
    description: 'Achieve your first full-clear day across all core quests.',
    benefit: 'Proves complete daily execution.',
    requirement: { minFullClearDays: 1 },
  },
  {
    id: 'disc_2',
    branch: 'discipline',
    tier: 2,
    name: 'Relentless Standard',
    description: 'Record 7 full-clear days in your activity history.',
    benefit: 'Confirms repeatable multi-day discipline.',
    requirement: { minFullClearDays: 7 },
  },
  {
    id: 'disc_3',
    branch: 'discipline',
    tier: 3,
    name: 'Iron Sovereign',
    description: 'Achieve 30 full-clear days and 10,000 lifetime XP.',
    benefit: 'Apex rank-level daily operational control.',
    requirement: { minFullClearDays: 30, minXp: 10000 },
  },

  // Mental Performance
  {
    id: 'ment_1',
    branch: 'mental',
    tier: 1,
    name: 'Focused Block',
    description: 'Accumulate 60 minutes of timed training or deliberate sessions.',
    benefit: 'Builds sustained attention endurance.',
    requirement: { minTrainingMinutes: 60 },
  },
  {
    id: 'ment_2',
    branch: 'mental',
    tier: 2,
    name: 'Zero Drift',
    description: 'Maintain a 5-day best streak with 180 minutes logged.',
    benefit: 'Demonstrates calm focus without drop-off.',
    requirement: { minBestStreak: 5, minTrainingMinutes: 180 },
  },
  {
    id: 'ment_3',
    branch: 'mental',
    tier: 3,
    name: 'Flow Architect',
    description: 'Reach 15,000 XP and 14-day best streak.',
    benefit: 'Highest cognitive stability under load.',
    requirement: { minXp: 15000, minBestStreak: 14 },
  },

  // Learning & Mastery
  {
    id: 'learn_1',
    branch: 'learning',
    tier: 1,
    name: 'First Awakening',
    description: 'Accumulate 500 lifetime XP through completed actions.',
    benefit: 'Crosses the threshold into F-Rank cadence.',
    requirement: { minXp: 500 },
  },
  {
    id: 'learn_2',
    branch: 'learning',
    tier: 2,
    name: 'System Scholar',
    description: 'Reach 4,000 lifetime XP (B-Rank progression tier).',
    benefit: 'Marks consistent compound learning.',
    requirement: { minXp: 4000 },
  },
  {
    id: 'learn_3',
    branch: 'learning',
    tier: 3,
    name: 'Grandmaster Synthesis',
    description: 'Achieve 25,000 lifetime XP through verified execution.',
    benefit: 'Elite mastery across all tracked domains.',
    requirement: { minXp: 25000 },
  },

  // Productivity
  {
    id: 'prod_1',
    branch: 'productivity',
    tier: 1,
    name: 'Task Executor',
    description: 'Complete 10 verified quests in total.',
    benefit: 'Establishes reliable daily throughput.',
    requirement: { minQuestsCompleted: 10 },
  },
  {
    id: 'prod_2',
    branch: 'productivity',
    tier: 2,
    name: 'High Output',
    description: 'Complete 75 verified quests across your log.',
    benefit: 'Sustained weekly and monthly completion rate.',
    requirement: { minQuestsCompleted: 75 },
  },
  {
    id: 'prod_3',
    branch: 'productivity',
    tier: 3,
    name: 'Overdrive Execution',
    description: 'Complete 250 verified quests and 10 workouts.',
    benefit: 'Demonstrates relentless operational output.',
    requirement: { minQuestsCompleted: 250, minWorkouts: 10 },
  },

  // Consistency
  {
    id: 'cons_1',
    branch: 'consistency',
    tier: 1,
    name: 'Three-Day Ignition',
    description: 'Maintain a 3-day active streak.',
    benefit: 'Breaks initial inertia.',
    requirement: { minBestStreak: 3 },
  },
  {
    id: 'cons_2',
    branch: 'consistency',
    tier: 2,
    name: 'Unbroken Week',
    description: 'Maintain a 7-day active streak.',
    benefit: 'Completes a full unbroken weekly cycle.',
    requirement: { minBestStreak: 7 },
  },
  {
    id: 'cons_3',
    branch: 'consistency',
    tier: 3,
    name: 'Obsidian Habit',
    description: 'Maintain a 30-day best streak.',
    benefit: 'Locks in long-term autonomous consistency.',
    requirement: { minBestStreak: 30 },
  },
];
