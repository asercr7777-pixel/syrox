export type ReputationId = 'kingdom' | 'guild' | 'guardian' | 'scholar' | 'void';

export interface Reputation {
  id: ReputationId;
  name: string;
  emoji: string;
  description: string;
  color: string;
  levels: { name: string; threshold: number; description: string }[];
}

export const REPUTATIONS: Reputation[] = [
  {
    id: 'kingdom',
    name: 'Kingdom Reputation',
    emoji: '🏰',
    description: 'Your standing with the Kingdom of Consistency. Earned through perfect days and streaks.',
    color: '#fbbf24',
    levels: [
      { name: 'Stranger', threshold: 0, description: 'Unknown to the kingdom.' },
      { name: 'Citizen', threshold: 50, description: 'Recognized as a resident.' },
      { name: 'Knight', threshold: 200, description: 'Granted a title and land.' },
      { name: 'Lord', threshold: 500, description: 'A noble of the court.' },
      { name: 'Champion', threshold: 1000, description: 'The kingdom\'s greatest defender.' },
    ],
  },
  {
    id: 'guild',
    name: 'Guild Reputation',
    emoji: '⚔️',
    description: 'Your standing with the hunter guilds. Earned through dungeon clears and boss defeats.',
    color: '#ff7a18',
    levels: [
      { name: 'Initiate', threshold: 0, description: 'A new guild member.' },
      { name: 'Hunter', threshold: 50, description: 'A proven hunter.' },
      { name: 'Veteran', threshold: 200, description: 'A respected veteran.' },
      { name: 'Elite', threshold: 500, description: 'An elite hunter.' },
      { name: 'Guild Master', threshold: 1000, description: 'Leader of the guild.' },
    ],
  },
  {
    id: 'guardian',
    name: 'Guardian Reputation',
    emoji: '🛡️',
    description: 'Your standing with the Guardians. Earned through long streaks and shield collection.',
    color: '#7dd3fc',
    levels: [
      { name: 'Ward', threshold: 0, description: 'Under basic protection.' },
      { name: 'Defender', threshold: 50, description: 'A proven defender.' },
      { name: 'Warden', threshold: 200, description: 'A guardian of others.' },
      { name: 'Sentinel', threshold: 500, description: 'An eternal sentinel.' },
      { name: 'Eternal Guardian', threshold: 1000, description: 'The ultimate protector.' },
    ],
  },
  {
    id: 'scholar',
    name: 'Scholar Reputation',
    emoji: '📚',
    description: 'Your standing with the scholars. Earned through reading, meditation, and lore collection.',
    color: '#06b6d4',
    levels: [
      { name: 'Novice', threshold: 0, description: 'A beginner scholar.' },
      { name: 'Student', threshold: 50, description: 'A dedicated student.' },
      { name: 'Adept', threshold: 200, description: 'A skilled scholar.' },
      { name: 'Sage', threshold: 500, description: 'A wise sage.' },
      { name: 'Lore Master', threshold: 1000, description: 'Knower of all things.' },
    ],
  },
  {
    id: 'void',
    name: 'Void Reputation',
    emoji: '🕳️',
    description: 'Your standing with the Void entities. Earned through secret quests and void exploration.',
    color: '#1e1b4b',
    levels: [
      { name: 'Unseen', threshold: 0, description: 'Unknown to the void.' },
      { name: 'Touched', threshold: 50, description: 'Marked by the void.' },
      { name: 'Walker', threshold: 200, description: 'A void walker.' },
      { name: 'Master', threshold: 500, description: 'A master of void.' },
      { name: 'Void Lord', threshold: 1000, description: 'Ruler of the void.' },
    ],
  },
];

export function getReputationLevel(repId: ReputationId, points: number): { name: string; level: number; nextThreshold: number; description: string } {
  const rep = REPUTATIONS.find((r) => r.id === repId);
  if (!rep) return { name: 'Unknown', level: 0, nextThreshold: 50, description: '' };
  let current = rep.levels[0];
  let levelIdx = 0;
  for (let i = 0; i < rep.levels.length; i++) {
    if (points >= rep.levels[i].threshold) { current = rep.levels[i]; levelIdx = i; }
  }
  const nextLevel = rep.levels[levelIdx + 1];
  return {
    name: current.name,
    level: levelIdx,
    nextThreshold: nextLevel ? nextLevel.threshold : current.threshold,
    description: current.description,
  };
}

// --- Factions ---

export interface Faction {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  motto: string;
  joinRequirement: string;
  perks: string[];
  uniqueQuests: { id: string; label: string; description: string; rewardText: string }[];
}

export const FACTIONS: Faction[] = [
  {
    id: 'order_discipline',
    name: 'Order of Discipline',
    emoji: '⚔️',
    description: 'The oldest faction, dedicated to the pure pursuit of daily habits. They believe consistency is the highest virtue.',
    color: '#ff7a18',
    motto: 'Every Day, Without Fail',
    joinRequirement: 'Maintain a 7-day streak',
    perks: ['+10% XP from core tasks', 'Access to Order-exclusive dungeons', 'Unique aura: Discipline Flame'],
    uniqueQuests: [
      { id: 'order_q1', label: 'The Oath of Discipline', description: 'Maintain a 30-day streak as a member of the Order.', rewardText: '+20% XP permanently while in the Order' },
      { id: 'order_q2', label: 'The Perfect Month', description: 'Complete all core tasks for 30 consecutive days.', rewardText: 'Title: Paragon of Discipline' },
    ],
  },
  {
    id: 'shadow_walkers',
    name: 'Shadow Walkers',
    emoji: '🌑',
    description: 'A secretive faction that operates in the shadows. They specialize in secret quests, hidden dungeons, and forbidden knowledge.',
    color: '#7c3aed',
    motto: 'In Shadow, Truth',
    joinRequirement: 'Complete 3 secret quests',
    perks: ['+50% secret quest rewards', 'Access to Shadow-only dungeons', 'Unique aura: Shadow Veil'],
    uniqueQuests: [
      { id: 'shadow_q1', label: 'The Shadow Trial', description: 'Complete 10 secret quests as a Shadow Walker.', rewardText: 'Title: Shadow Walker Elite' },
      { id: 'shadow_q2', label: 'The Forbidden Path', description: 'Unlock all secret quests in the game.', rewardText: 'Shadow Lord Title + permanent +15% coin gain' },
    ],
  },
  {
    id: 'ancient_scholars',
    name: 'Ancient Scholars',
    emoji: '📜',
    description: 'A faction devoted to knowledge and lore. They believe that understanding the world is the key to mastering it.',
    color: '#06b6d4',
    motto: 'Knowledge is Power',
    joinRequirement: 'Collect 10 lore entries',
    perks: ['+25% XP from Reading and Meditation', 'Access to Scholar-only lore', 'Unique aura: Wisdom Light'],
    uniqueQuests: [
      { id: 'scholar_q1', label: 'The Grand Library', description: 'Collect all lore entries in the game.', rewardText: 'Title: Grand Scholar + all lore permanently unlocked' },
      { id: 'scholar_q2', label: 'The Truth Seeker', description: 'Complete the Reading task 100 times.', rewardText: 'Aura: Eternal Wisdom' },
    ],
  },
  {
    id: 'void_legion',
    name: 'Void Legion',
    emoji: '🕳️',
    description: 'A faction that embraces the Void. They are the most powerful and the most dangerous — their power comes from the space between realities.',
    color: '#1e1b4b',
    motto: 'From Nothing, Power',
    joinRequirement: 'Reach the Void Dimension (Chapter 31)',
    perks: ['+30% XP in the Void Dimension', 'Access to Void-only bosses', 'Unique aura: Void Essence'],
    uniqueQuests: [
      { id: 'void_q1', label: 'The Void Campaign', description: 'Defeat all Void Dimension bosses.', rewardText: 'Title: Void Commander' },
      { id: 'void_q2', label: 'The Nothing', description: 'Reach 100% Void reputation.', rewardText: 'Aura: Absolute Void + permanent +20% boss damage' },
    ],
  },
  {
    id: 'infinity_council',
    name: 'Infinity Council',
    emoji: '∞',
    description: 'The most elite faction, open only to those who have reached the Final Infinity. They govern the endgame and shape the future of the world.',
    color: '#facc15',
    motto: 'Beyond Limits',
    joinRequirement: 'Complete the campaign (Chapter 50)',
    perks: ['+25% all XP', 'Access to all endgame content', 'Unique aura: Infinity Glow', 'New Game+ access'],
    uniqueQuests: [
      { id: 'infinity_q1', label: 'The Eternal Council', description: 'Complete New Game+.', rewardText: 'Title: Council Member + permanent +50% all gains' },
      { id: 'infinity_q2', label: 'The Infinite Hunter', description: 'Reach floor 100 of the Infinite Tower.', rewardText: 'Title: Infinite Hunter + secret ending unlocked' },
    ],
  },
];

export function getFactionById(id: string): Faction | undefined {
  return FACTIONS.find((f) => f.id === id);
}
