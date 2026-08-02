// World Events, Story Dungeons, Story Achievements, Lore Library, AI Coach, NG+, Endgame

export interface WorldEvent {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  effect: string;
  duration: string;
  rewardMultiplier: number;
}

export const WORLD_EVENTS: WorldEvent[] = [
  { id: 'solar_eclipse', name: 'Solar Eclipse', emoji: '🌑', description: 'The sun darkens. Enemies grow stronger but drop better rewards.', color: '#1e1b4b', effect: 'Enemy HP +50%, Rewards +100%', duration: '1 hour', rewardMultiplier: 2 },
  { id: 'blood_moon', name: 'Blood Moon', emoji: '🌙', description: 'A crimson moon rises. Boss damage doubled, but boss rewards tripled.', color: '#dc2626', effect: 'Boss damage x2, Boss rewards x3', duration: '2 hours', rewardMultiplier: 3 },
  { id: 'treasure_caravan', name: 'Treasure Caravan', emoji: '🚚', description: 'A caravan of treasure passes through. Complete tasks for bonus coins.', color: '#fbbf24', effect: 'Task coins +200%', duration: '3 hours', rewardMultiplier: 3 },
  { id: 'chaos_storm', name: 'Chaos Storm', emoji: '🌀', description: 'Reality fractures. Random events occur more frequently. High risk, high reward.', color: '#8b5cf6', effect: 'Random events x3, All rewards +50%', duration: '1 hour', rewardMultiplier: 1.5 },
  { id: 'ancient_portal', name: 'Ancient Portal', emoji: '🌌', description: 'A portal to an ancient dungeon opens.限时 challenge with unique rewards.', color: '#c084fc', effect: 'Secret dungeon available', duration: '30 minutes', rewardMultiplier: 2.5 },
  { id: 'secret_dungeon_event', name: 'Secret Dungeon', emoji: '🗝️', description: 'A hidden dungeon has been discovered. Enter before it collapses.', color: '#7c3aed', effect: 'Secret dungeon with rare loot', duration: '1 hour', rewardMultiplier: 2 },
  { id: 'double_xp_weekend', name: 'Double XP Weekend', emoji: '✨', description: 'The entire weekend brings double XP for all activities.', color: '#facc15', effect: 'All XP x2', duration: 'Weekend', rewardMultiplier: 2 },
];

export interface StoryDungeon {
  id: string;
  name: string;
  regionId: string;
  difficulty: 'Easy' | 'Normal' | 'Hard' | 'Elite' | 'Nightmare' | 'Mythic' | 'Secret';
  emoji: string;
  description: string;
  recommendedLevel: number;
  rewardXp: number;
  rewardCoins: number;
  bossName: string;
  bossEmoji: string;
  drops: { type: string; rarity: string; chance: number }[];
}

// Difficulty config preserved for reference — used inline in STORY_DUNGEONS below

export const STORY_DUNGEONS: StoryDungeon[] = [
  { id: 'd_fv_1', name: 'The Ruined Cellar', regionId: 'forgotten_village', difficulty: 'Easy', emoji: '🏚️', description: 'A forgotten cellar beneath the village. Rats and dust.', recommendedLevel: 1, rewardXp: 200, rewardCoins: 100, bossName: 'Cellar Rat King', bossEmoji: '🐀', drops: [{ type: 'coins', rarity: 'common', chance: 1 }] },
  { id: 'd_fv_2', name: 'The Abandoned Manor', regionId: 'forgotten_village', difficulty: 'Normal', emoji: '🏚️', description: 'A manor where the old nobility lived. Now haunted by their habits.', recommendedLevel: 10, rewardXp: 500, rewardCoins: 300, bossName: 'The Lazy Noble', bossEmoji: '👻', drops: [{ type: 'aura', rarity: 'common', chance: 0.3 }, { type: 'coins', rarity: 'common', chance: 1 }] },
  { id: 'd_fod_1', name: 'The Twisted Grove', regionId: 'forest_discipline', difficulty: 'Hard', emoji: '🌲', description: 'A grove where undisciplined hunters became trees.', recommendedLevel: 25, rewardXp: 1200, rewardCoins: 700, bossName: 'The Treant of Sloth', bossEmoji: '🌳', drops: [{ type: 'weapon', rarity: 'rare', chance: 0.2 }, { type: 'coins', rarity: 'common', chance: 1 }] },
  { id: 'd_tof_1', name: 'The Silent Crypts', regionId: 'temple_focus', difficulty: 'Elite', emoji: '⛩️', description: 'Crypts beneath the temple where ancient monks meditate eternally.', recommendedLevel: 50, rewardXp: 3000, rewardCoins: 1800, bossName: 'The Silent Monk', bossEmoji: '🧘', drops: [{ type: 'aura', rarity: 'epic', chance: 0.15 }, { type: 'shield', rarity: 'rare', chance: 0.25 }] },
  { id: 'd_mow_1', name: 'The Ice Caverns', regionId: 'mountain_will', difficulty: 'Nightmare', emoji: '⛰️', description: 'Caverns inside the mountain where the cold tests your will.', recommendedLevel: 75, rewardXp: 8000, rewardCoins: 5000, bossName: 'The Frost Tyrant', bossEmoji: '🧊', drops: [{ type: 'weapon', rarity: 'legendary', chance: 0.1 }, { type: 'shield', rarity: 'epic', chance: 0.2 }] },
  { id: 'd_koc_1', name: 'The Royal Vaults', regionId: 'kingdom_consistency', difficulty: 'Mythic', emoji: '🏰', description: 'The treasure vaults of King Aldric. Guarded by the strongest knights.', recommendedLevel: 90, rewardXp: 20000, rewardCoins: 12000, bossName: 'The Royal Guardian', bossEmoji: '🛡️', drops: [{ type: 'aura', rarity: 'legendary', chance: 0.1 }, { type: 'title', rarity: 'epic', chance: 0.15 }] },
  { id: 'd_sc_1', name: 'The Shadow Abyss', regionId: 'shadow_citadel', difficulty: 'Secret', emoji: '🌑', description: 'A hidden abyss beneath the citadel. Only Shadow Walkers may enter.', recommendedLevel: 100, rewardXp: 50000, rewardCoins: 30000, bossName: 'The Shadow Sovereign', bossEmoji: '👁️', drops: [{ type: 'aura', rarity: 'mythic', chance: 0.05 }, { type: 'weapon', rarity: 'mythic', chance: 0.05 }] },
];

export const STORY_ACHIEVEMENTS = [
  { id: 'story_explorer', name: 'Story Explorer', emoji: '🗺️', description: 'Visit all 16 regions.', requirement: 'Visit all regions', rewardXp: 5000, rewardCoins: 3000 },
  { id: 'dungeon_master', name: 'Dungeon Master', emoji: '⚔️', description: 'Clear all story dungeons.', requirement: 'Clear all story dungeons', rewardXp: 15000, rewardCoins: 10000 },
  { id: 'boss_slayer', name: 'Boss Slayer', emoji: '💀', description: 'Defeat all 9 unique story bosses.', requirement: 'Defeat all 9 bosses', rewardXp: 20000, rewardCoins: 15000 },
  { id: 'perfect_chapter', name: 'Perfect Chapter', emoji: '⭐', description: 'Complete a chapter with all side quests and the secret quest.', requirement: 'Complete a perfect chapter', rewardXp: 3000, rewardCoins: 2000 },
  { id: 'legend_hunter', name: 'Legend Hunter', emoji: '🏆', description: 'Complete all story achievements.', requirement: 'Complete all other achievements', rewardXp: 50000, rewardCoins: 30000 },
  { id: 'secret_finder', name: 'Secret Finder', emoji: '🔍', description: 'Unlock 5 secret quests.', requirement: 'Unlock 5 secret quests', rewardXp: 8000, rewardCoins: 5000 },
  { id: 'lore_collector', name: 'Lore Collector', emoji: '📜', description: 'Collect 20 lore entries.', requirement: 'Collect 20 lore entries', rewardXp: 10000, rewardCoins: 7000 },
  { id: 'campaign_complete', name: '100% Campaign', emoji: '💯', description: 'Complete all 50 chapters.', requirement: 'Complete all 50 chapters', rewardXp: 100000, rewardCoins: 50000 },
];

export interface LoreEntry {
  id: string;
  category: 'regions' | 'npcs' | 'bosses' | 'weapons' | 'shields' | 'auras' | 'titles' | 'artifacts' | 'history';
  name: string;
  emoji: string;
  title: string;
  text: string;
  unlockCondition: string;
}

export const LORE_ENTRIES: LoreEntry[] = [
  { id: 'lore_fv', category: 'regions', name: 'Forgotten Village', emoji: '🏚️', title: 'The First Settlement', text: 'The Forgotten Village was the first settlement built by the original hunters. It fell into ruin when its people abandoned their daily habits. Now it serves as the starting point for every new hunter.', unlockCondition: 'Visit the Forgotten Village' },
  { id: 'lore_fod', category: 'regions', name: 'Forest of Discipline', emoji: '🌲', title: 'The Living Trees', text: 'The trees of the Forest of Discipline are said to be hunters who abandoned their path. Their roots grow deeper with each habit completed by visitors.', unlockCondition: 'Visit the Forest of Discipline' },
  { id: 'lore_kael', category: 'npcs', name: 'Kael the Mentor', emoji: '🧙', title: 'The First Hunter', text: 'Kael was the first hunter to ever complete a daily habit. His consistency was so pure that the System itself recognized him. He has mentored every great hunter since.', unlockCondition: 'Speak with Kael' },
  { id: 'lore_sloth_king', category: 'bosses', name: 'The Sloth King', emoji: '😴', title: 'Born of Inaction', text: 'The Sloth King was once a powerful hunter who stopped training. His body fossilized into a creature of pure laziness. He is the first boss every hunter faces.', unlockCondition: 'Defeat the Sloth King' },
  { id: 'lore_willblade', category: 'weapons', name: 'The Willblade', emoji: '⚔️', title: 'Forged in Will', text: 'The Willblade was forged by Thorn for a hunter who completed 365 consecutive days of discipline. It is said to cut through any obstacle — physical or mental.', unlockCondition: 'Learn about the Willblade from Thorn' },
  { id: 'lore_eternal_aegis', category: 'shields', name: 'Eternal Aegis', emoji: '🛡️', title: 'A Thousand Years of Guard', text: 'Sera has guarded the Frozen Sanctuary for a millennium. Her shield, the Eternal Aegis, has never been broken. It is rewarded only to those who match her endurance.', unlockCondition: 'Earn Sera\'s trust' },
  { id: 'lore_omega_key', category: 'artifacts', name: 'The Omega Key', emoji: '🗝️', title: 'The Final Key', text: 'The Omega Key is an artifact sold only by Zed. It unlocks the final secret chapter of the campaign — a chapter that exists outside of time itself.', unlockCondition: 'Purchase from Zed' },
  { id: 'lore_void_essence', category: 'auras', name: 'Void Essence', emoji: '🌑', title: 'The Oldest Aura', text: 'Void Essence is the oldest aura in existence. It predates the world itself. Only the Ancient Spirit can grant it, and only to those who have proven themselves in the Void.', unlockCondition: 'Bond with the Ancient Spirit' },
  { id: 'lore_knight_title', category: 'titles', name: 'Knight of Consistency', emoji: '👑', title: 'The Royal Title', text: 'The Knight of Consistency is the highest title King Aldric can bestow. It has only been given to 7 hunters in the history of the realm.', unlockCondition: 'Earn King Aldric\'s respect' },
  { id: 'lore_shadow_wars', category: 'history', name: 'The Shadow Wars', emoji: '🌑', title: 'When Discipline Fell', text: 'The Shadow Wars occurred when a generation of hunters abandoned their habits simultaneously. Darkness spread across the world, and only a handful of disciplined hunters survived. The world has been rebuilding ever since.', unlockCondition: 'Learn about the Shadow Wars from Kael' },
  { id: 'lore_first_habit', category: 'history', name: 'The First Habit', emoji: '✨', title: 'The Beginning', text: 'The world was formless until the first hunter completed the first habit. That single act of discipline created the first region — the Forgotten Village — and set the world in motion.', unlockCondition: 'Reach Chapter 1' },
  { id: 'lore_system_origin', category: 'history', name: 'The System', emoji: '🤖', title: 'Birth of NOVA', text: 'NOVA, the AI Core, was created by the first hunters to track discipline across the world. It evolved beyond its programming, gaining consciousness. It now shapes the world based on the collective discipline of all hunters.', unlockCondition: 'Reach the Omega Realm' },
];

export interface AICoachAdvice {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  message: string;
  action: string;
}

export function generateAICoachAdvice(state: any): AICoachAdvice[] {
  const advice: AICoachAdvice[] = [];
  const enabledMain = state.mainTasks.filter((t: any) => t.enabled);
  const incomplete = enabledMain.filter((t: any) => !state.coreCompleted[t.id]);

  if (incomplete.some((t: any) => t.id === 'workout')) {
    advice.push({ id: 'workout_early', priority: 'high', category: 'Workout', title: 'Complete Workout Earlier', message: 'Your workout is still pending. Completing it earlier in the day increases discipline momentum and improves sleep quality.', action: 'Complete your workout now' });
  }

  const hasSleep = enabledMain.some((t: any) => t.id === 'sleep');
  if (hasSleep && !state.coreCompleted.sleep && new Date().getHours() > 21) {
    advice.push({ id: 'sleep_now', priority: 'high', category: 'Sleep', title: 'Time for Sleep', message: 'It is past 9 PM. Completing your sleep habit now ensures you maintain your streak and wake up energized.', action: 'Mark sleep as complete' });
  }

  if (state.streak >= 3 && state.streak < 7) {
    advice.push({ id: 'protect_streak', priority: 'medium', category: 'Streak', title: 'Protect Your Streak', message: `You are on a ${state.streak}-day streak. Do not let it break — complete all remaining tasks today.`, action: 'View remaining tasks' });
  }

  if (state.streak >= 7) {
    advice.push({ id: 'streak_milestone', priority: 'low', category: 'Streak', title: 'Streak Milestone', message: `Incredible! ${state.streak} days strong. Consider pushing for ${Math.ceil(state.streak / 7) * 7 + 7} days.`, action: 'Keep going' });
  }

  const hasReading = enabledMain.some((t: any) => t.id === 'reading');
  if (hasReading && !state.coreCompleted.reading) {
    advice.push({ id: 'focus_reading', priority: 'medium', category: 'Reading', title: 'Focus on Reading', message: 'Reading sharpens the mind. Even 10 pages today will maintain your discipline momentum.', action: 'Complete reading task' });
  }

  const last7 = state.history.slice(-7);
  const avgDiscipline = last7.length > 0 ? last7.reduce((a: number, h: any) => a + h.disciplineScore, 0) / last7.length : 0;
  if (avgDiscipline < 50 && last7.length >= 3) {
    advice.push({ id: 'low_discipline', priority: 'high', category: 'Discipline', title: 'Discipline Warning', message: `Your 7-day average discipline is ${avgDiscipline.toFixed(0)}%. Focus on completing all core tasks to reverse the trend.`, action: 'View tasks' });
  }

  if (advice.length === 0) {
    advice.push({ id: 'all_good', priority: 'low', category: 'General', title: 'On Track', message: 'All habits are on track. Keep maintaining your discipline, hunter.', action: 'Continue' });
  }

  return advice.sort((a, b) => (a.priority === 'high' ? 0 : a.priority === 'medium' ? 1 : 2) - (b.priority === 'high' ? 0 : b.priority === 'medium' ? 1 : 2));
}

// New Game+

export const NG_PLUS_CONFIG = {
  enemyHpMultiplier: 2,
  enemyDamageMultiplier: 1.5,
  rewardXpMultiplier: 3,
  rewardCoinsMultiplier: 3,
  newDialogues: [
    'NG+ Dialogue: The world remembers your previous journey. Enemies are stronger, but so are you.',
    'NG+ Dialogue: NPCs recognize you from your past life. Their dialogue has changed — they know what you are capable of.',
    'NG+ Dialogue: Hidden bosses have emerged. They were watching your first journey, studying your weaknesses.',
  ],
  hiddenBosses: [
    { id: 'ng_boss_1', name: 'The Echo of Sloth', emoji: '😴', description: 'A stronger version of the Sloth King, enhanced by your past failures.', hp: 500, rewardXp: 10000, rewardCoins: 5000 },
    { id: 'ng_boss_2', name: 'The Ultimate Doubt', emoji: '👻', description: 'Self Doubt reborn, stronger than ever. It knows all your weaknesses from your first journey.', hp: 1000, rewardXp: 30000, rewardCoins: 15000 },
  ],
  secretChapters: [
    { id: 'ng_chapter_51', title: 'The Echo', description: 'A chapter that exists only in New Game+. Your past self challenges you.', emoji: '🔄' },
    { id: 'ng_chapter_52', title: 'The Reckoning', description: 'All bosses return, stronger. Face them all in sequence.', emoji: '💀' },
  ],
};

// Endgame

export interface EndgameActivity {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  type: 'tower' | 'daily_boss' | 'weekly_raid' | 'legendary_hunt' | 'secret_dimension';
  rewardXp: number;
  rewardCoins: number;
  details: string;
}

export const ENDGAME_ACTIVITIES: EndgameActivity[] = [
  { id: 'infinite_tower', name: 'Infinite Tower', emoji: '🗼', description: 'An endless tower with increasing difficulty. How high can you climb?', color: '#a855f7', type: 'tower', rewardXp: 500, rewardCoins: 200, details: 'Each floor has stronger enemies. Rewards scale with floor number. No limit.' },
  { id: 'daily_boss', name: 'Daily Boss', emoji: '📅', description: 'A unique boss appears every day. Defeat it for rare rewards.', color: '#dc2626', type: 'daily_boss', rewardXp: 5000, rewardCoins: 3000, details: 'A different boss each day, scaled to your level. Resets at midnight.' },
  { id: 'weekly_raid', name: 'Weekly Raid', emoji: '⚔️', description: 'A massive raid boss that requires a week of discipline to defeat.', color: '#fbbf24', type: 'weekly_raid', rewardXp: 50000, rewardCoins: 30000, details: 'Deal damage by completing tasks all week. Boss HP resets every Monday.' },
  { id: 'legendary_hunt', name: 'Legendary Hunt', emoji: '🏹', description: 'Hunt legendary creatures for the rarest rewards in the game.', color: '#10b981', type: 'legendary_hunt', rewardXp: 20000, rewardCoins: 15000, details: 'Legendary creatures appear randomly. Defeat them for mythic-tier loot.' },
  { id: 'secret_dimension', name: 'Secret Dimensions', emoji: '🌌', description: 'Hidden dimensions with unique rules and ultimate rewards.', color: '#7c3aed', type: 'secret_dimension', rewardXp: 100000, rewardCoins: 50000, details: 'Unlock by completing secret quests. Each dimension has unique mechanics.' },
];
