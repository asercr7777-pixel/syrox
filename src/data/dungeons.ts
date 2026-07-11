import type { RankId } from './ranks';

export interface DungeonExercise {
  name: string;
  reps: number;
  /** For time-based exercises like plank, in seconds. */
  isTime?: boolean;
}

export interface DungeonReward {
  type: 'xp' | 'coins' | 'aura' | 'title' | 'weapon' | 'shield' | 'badge';
  itemId?: string;
  amount?: number;
  label: string;
  rarity?: string;
}

export interface Dungeon {
  id: string;
  rankId: RankId;
  name: string;
  theme: string;
  description: string;
  exercises: DungeonExercise[];
  rewardXp: number;
  rewardCoins: number;
  rewards: DungeonReward[];
  /** Aura drop rate bonus for this dungeon. */
  auraDropBonus: number;
}

function makeDungeon(
  rankId: RankId,
  name: string,
  theme: string,
  description: string,
  pushups: number,
  squats: number,
  plank: number,
  rewardXp: number,
  rewardCoins: number,
  rewards: DungeonReward[],
  auraDropBonus: number,
): Dungeon {
  return {
    id: `dungeon_${rankId}`,
    rankId,
    name,
    theme,
    description,
    exercises: [
      { name: 'Push-ups', reps: pushups },
      { name: 'Squats', reps: squats },
      { name: 'Plank', reps: plank, isTime: true },
    ],
    rewardXp,
    rewardCoins,
    rewards,
    auraDropBonus,
  };
}

export const DUNGEONS: Dungeon[] = [
  makeDungeon('E', 'Awakening Gate', 'The First Threshold', 'A gentle test for the newly awakened.', 10, 10, 20, 80, 40, [
    { type: 'xp', amount: 80, label: '80 XP' },
    { type: 'coins', amount: 40, label: '40 Coins' },
    { type: 'aura', itemId: 'stone', label: 'Stone Aura', rarity: 'common' },
  ], 0),
  makeDungeon('F', 'Whispering Hollow', 'Echoes of Will', 'The hollow tests your resolve.', 15, 15, 30, 120, 60, [
    { type: 'xp', amount: 120, label: '120 XP' },
    { type: 'coins', amount: 60, label: '60 Coins' },
    { type: 'shield', itemId: 'guardian_shield', label: 'Guardian Shield', rarity: 'common' },
  ], 0),
  makeDungeon('D', 'Stone Trial', 'Foundation of Stone', 'Build your foundation on stone.', 20, 20, 40, 180, 90, [
    { type: 'xp', amount: 180, label: '180 XP' },
    { type: 'coins', amount: 90, label: '90 Coins' },
    { type: 'title', itemId: 'wanderer', label: 'Wanderer Title', rarity: 'rare' },
  ], 0.02),
  makeDungeon('C', 'Frost Cavern', 'Cold Resolve', 'The frost sharpens focus.', 30, 30, 45, 260, 130, [
    { type: 'xp', amount: 260, label: '260 XP' },
    { type: 'coins', amount: 130, label: '130 Coins' },
    { type: 'aura', itemId: 'frost', label: 'Frost Aura', rarity: 'rare' },
    { type: 'weapon', itemId: 'iron_sword', label: 'Iron Sword', rarity: 'rare' },
  ], 0.03),
  makeDungeon('B', 'Storm Spire', 'Lightning Trial', 'Climb the spire through the storm.', 40, 40, 60, 380, 190, [
    { type: 'xp', amount: 380, label: '380 XP' },
    { type: 'coins', amount: 190, label: '190 Coins' },
    { type: 'aura', itemId: 'storm', label: 'Storm Aura', rarity: 'epic' },
    { type: 'title', itemId: 'elite_hunter', label: 'Elite Hunter Title', rarity: 'epic' },
  ], 0.04),
  makeDungeon('A', 'Crimson Sanctum', 'Blood and Gold', 'The sanctum of the elite.', 55, 55, 75, 540, 270, [
    { type: 'xp', amount: 540, label: '540 XP' },
    { type: 'coins', amount: 270, label: '270 Coins' },
    { type: 'aura', itemId: 'solar', label: 'Solar Aura', rarity: 'epic' },
    { type: 'shield', itemId: 'shadow_aegis', label: 'Shadow Aegis', rarity: 'epic' },
  ], 0.05),
  makeDungeon('S', 'Inferno Keep', 'Trial of Fire', 'Only the strong survive the keep.', 70, 70, 90, 760, 380, [
    { type: 'xp', amount: 760, label: '760 XP' },
    { type: 'coins', amount: 380, label: '380 Coins' },
    { type: 'aura', itemId: 'crimson', label: 'Crimson Aura', rarity: 'legendary' },
    { type: 'title', itemId: 'demon_hunter', label: 'Demon Hunter Title', rarity: 'legendary' },
  ], 0.06),
  makeDungeon('SS', 'Thunder Vault', 'Charged Halls', 'The vault hums with power.', 85, 85, 105, 1050, 520, [
    { type: 'xp', amount: 1050, label: '1,050 XP' },
    { type: 'coins', amount: 520, label: '520 Coins' },
    { type: 'aura', itemId: 'azure', label: 'Azure Aura', rarity: 'legendary' },
    { type: 'weapon', itemId: 'storm_spear', label: 'Storm Spear', rarity: 'legendary' },
  ], 0.07),
  makeDungeon('SS_DARK', 'Dark Abyss', 'Into Darkness', 'The abyss watches back.', 100, 100, 120, 1450, 720, [
    { type: 'xp', amount: 1450, label: '1,450 XP' },
    { type: 'coins', amount: 720, label: '720 Coins' },
    { type: 'aura', itemId: 'phantom', label: 'Phantom Aura', rarity: 'legendary' },
    { type: 'weapon', itemId: 'shadow_bow', label: 'Shadow Bow', rarity: 'legendary' },
  ], 0.08),
  makeDungeon('SS_SHADOW_DARK', 'Shadow Labyrinth', 'Lost in Shadow', 'Navigate the labyrinth of self.', 120, 120, 150, 2000, 1000, [
    { type: 'xp', amount: 2000, label: '2,000 XP' },
    { type: 'coins', amount: 1000, label: '1,000 Coins' },
    { type: 'aura', itemId: 'void', label: 'Abyss Aura', rarity: 'mythic' },
    { type: 'weapon', itemId: 'abyss_greatsword', label: 'Abyss Greatsword', rarity: 'mythic' },
  ], 0.1),
  makeDungeon('SHADOW_HUNTER', "Hunter's Gauntlet", 'The Hunt Begins', 'A true test for the shadow hunter.', 150, 150, 180, 2800, 1400, [
    { type: 'xp', amount: 2800, label: '2,800 XP' },
    { type: 'coins', amount: 1400, label: '1,400 Coins' },
    { type: 'aura', itemId: 'void', label: 'Void Aura', rarity: 'mythic' },
    { type: 'weapon', itemId: 'void_blade', label: 'Void Blade', rarity: 'mythic' },
    { type: 'badge', itemId: 'shadow_hunter_badge', label: 'Shadow Hunter Badge', rarity: 'mythic' },
  ], 0.12),
  makeDungeon('SHADOW_MONARCH', "Monarch's Throne", 'The Monarch Awakens', 'The throne awaits its rightful ruler.', 180, 180, 210, 3800, 1900, [
    { type: 'xp', amount: 3800, label: '3,800 XP' },
    { type: 'coins', amount: 1900, label: '1,900 Coins' },
    { type: 'aura', itemId: 'genesis', label: 'Genesis Aura', rarity: 'mythic' },
    { type: 'weapon', itemId: 'monarchs_blade', label: "Monarch's Blade", rarity: 'mythic' },
    { type: 'title', itemId: 'shadow_monarch', label: 'Shadow Monarch Title', rarity: 'mythic' },
  ], 0.14),
  makeDungeon('ELITE_SLAYER', "Slayer's Coliseum", 'Arena of Legends', 'A slayer proves their worth in the arena.', 220, 220, 240, 5200, 2600, [
    { type: 'xp', amount: 5200, label: '5,200 XP' },
    { type: 'coins', amount: 2600, label: '2,600 Coins' },
    { type: 'aura', itemId: 'inferno', label: 'Inferno Aura', rarity: 'mythic' },
    { type: 'weapon', itemId: 'dragon_slayer', label: 'Dragon Slayer', rarity: 'mythic' },
    { type: 'badge', itemId: 'elite_slayer_badge', label: 'Elite Slayer Badge', rarity: 'mythic' },
  ], 0.16),
  makeDungeon('NIGHTMARE_BRINGER', 'Nightmare Sanctum', 'Realm of Nightmares', 'You bring nightmares to the unworthy.', 260, 260, 270, 6800, 3400, [
    { type: 'xp', amount: 6800, label: '6,800 XP' },
    { type: 'coins', amount: 3400, label: '3,400 Coins' },
    { type: 'aura', itemId: 'blood_moon', label: 'Blood Moon Aura', rarity: 'secret' },
    { type: 'weapon', itemId: 'nightmare_spear', label: 'Nightmare Spear', rarity: 'secret' },
    { type: 'title', itemId: 'nightmare_bringer', label: 'Nightmare Bringer Title', rarity: 'secret' },
  ], 0.18),
  makeDungeon('DOOM_BRINGER', 'Doom Crucible', 'The Crucible of Doom', 'The harbinger of doom must prove their claim.', 300, 300, 300, 8500, 4200, [
    { type: 'xp', amount: 8500, label: '8,500 XP' },
    { type: 'coins', amount: 4200, label: '4,200 Coins' },
    { type: 'aura', itemId: 'ragnarok', label: 'Ragnarok Aura', rarity: 'secret' },
    { type: 'weapon', itemId: 'ragnarok_axe', label: 'Ragnarok Axe', rarity: 'secret' },
    { type: 'badge', itemId: 'doom_bringer_badge', label: 'Doom Bringer Badge', rarity: 'secret' },
  ], 0.2),
  makeDungeon('EXECUTIONER', "Executioner's Block", 'Final Judgment', 'The final judgment falls upon the worthy.', 340, 340, 330, 10500, 5200, [
    { type: 'xp', amount: 10500, label: '10,500 XP' },
    { type: 'coins', amount: 5200, label: '5,200 Coins' },
    { type: 'aura', itemId: 'dragon', label: 'Dragon Aura', rarity: 'secret' },
    { type: 'weapon', itemId: 'dragon_kings_spear', label: "Dragon King's Spear", rarity: 'secret' },
    { type: 'title', itemId: 'executioner', label: 'Executioner Title', rarity: 'secret' },
  ], 0.22),
  makeDungeon('MYTHIC_ONE', 'Mythic Sanctuary', 'Beyond Mortal Limits', 'A sanctuary for those who transcended mortality.', 380, 380, 360, 13000, 6500, [
    { type: 'xp', amount: 13000, label: '13,000 XP' },
    { type: 'coins', amount: 6500, label: '6,500 Coins' },
    { type: 'aura', itemId: 'celestial', label: 'Celestial Aura', rarity: 'secret' },
    { type: 'weapon', itemId: 'infinity_blade', label: 'Infinity Blade', rarity: 'secret' },
    { type: 'badge', itemId: 'mythic_one_badge', label: 'Mythic One Badge', rarity: 'secret' },
  ], 0.24),
  makeDungeon('IMMORTAL_WARRIOR', 'Hall of the Immortal', 'Where Death Fears to Tread', 'Death cannot claim those who conquer this hall.', 420, 420, 390, 16000, 8000, [
    { type: 'xp', amount: 16000, label: '16,000 XP' },
    { type: 'coins', amount: 8000, label: '8,000 Coins' },
    { type: 'aura', itemId: 'divine', label: 'Divine Aura', rarity: 'secret' },
    { type: 'weapon', itemId: 'eternal_blade', label: 'Eternal Blade', rarity: 'secret' },
    { type: 'title', itemId: 'immortal_warrior', label: 'Immortal Warrior Title', rarity: 'secret' },
  ], 0.26),
  makeDungeon('SHADOW_KING', "Shadow King's Court", 'The Court of Shadows', 'The king of shadows holds court. Kneel or fall.', 460, 460, 420, 20000, 10000, [
    { type: 'xp', amount: 20000, label: '20,000 XP' },
    { type: 'coins', amount: 10000, label: '10,000 Coins' },
    { type: 'aura', itemId: 'eclipse', label: 'Eclipse Aura', rarity: 'secret' },
    { type: 'weapon', itemId: 'crimson_eclipse', label: 'Crimson Eclipse', rarity: 'secret' },
    { type: 'badge', itemId: 'shadow_king_badge', label: 'Shadow King Badge', rarity: 'secret' },
  ], 0.28),
  makeDungeon('SYSTEM_OVERLORD', 'System Overlord Citadel', 'The Apex of All Existence', 'The citadel of the overlord. Only one may rule.', 500, 500, 450, 25000, 12000, [
    { type: 'xp', amount: 25000, label: '25,000 XP' },
    { type: 'coins', amount: 12000, label: '12,000 Coins' },
    { type: 'aura', itemId: 'ascended_shadow', label: 'Ascended Shadow Aura', rarity: 'secret' },
    { type: 'weapon', itemId: 'last_monarch_blade', label: 'Last Monarch Blade', rarity: 'secret' },
    { type: 'title', itemId: 'system_overlord', label: 'System Overlord Title', rarity: 'secret' },
    { type: 'badge', itemId: 'system_overlord_badge', label: 'System Overlord Badge', rarity: 'secret' },
  ], 0.3),
];

export interface BossChallenge {
  id: string;
  name: string;
  description: string;
  exercises: DungeonExercise[];
  totalHp: number;
  rewardXp: number;
  rewardCoins: number;
  badgeId: string;
  titleId: string;
  auraId: string;
}

export const BOSS_DUNGEON: BossChallenge = {
  id: 'boss_dungeon',
  name: 'The Shadow Monarch',
  description: 'The ultimate test. Defeat the monarch within to claim the throne.',
  exercises: [
    { name: 'Push-ups', reps: 100 },
    { name: 'Squats', reps: 100 },
    { name: 'Plank', reps: 180, isTime: true },
    { name: 'Push-ups', reps: 100 },
    { name: 'Squats', reps: 100 },
  ],
  totalHp: 500,
  rewardXp: 10000,
  rewardCoins: 5000,
  badgeId: 'boss_slayer',
  titleId: 'shadow_monarch',
  auraId: 'shadow_monarch',
};

export interface SecretDungeon {
  id: string;
  name: string;
  description: string;
  exercises: DungeonExercise[];
  rewardXp: number;
  rewardCoins: number;
  titleId: string;
  auraId: string;
}

export const SECRET_DUNGEONS: SecretDungeon[] = [
  {
    id: 'secret_abyss_gate',
    name: 'Abyss Gate',
    description: 'A rare gate has opened. Move quickly.',
    exercises: [
      { name: 'Push-ups', reps: 75 },
      { name: 'Plank', reps: 120, isTime: true },
      { name: 'Squats', reps: 75 },
    ],
    rewardXp: 1500,
    rewardCoins: 800,
    titleId: 'abyss_explorer',
    auraId: 'abyss',
  },
  {
    id: 'secret_void_rift',
    name: 'Void Rift',
    description: 'A tear in reality. Few will ever see it.',
    exercises: [
      { name: 'Push-ups', reps: 90 },
      { name: 'Squats', reps: 90 },
      { name: 'Plank', reps: 150, isTime: true },
    ],
    rewardXp: 2200,
    rewardCoins: 1100,
    titleId: 'void_hunter',
    auraId: 'void',
  },
  {
    id: 'secret_eclipse_trial',
    name: 'Eclipse Trial',
    description: 'The eclipse grants power to those who act.',
    exercises: [
      { name: 'Push-ups', reps: 110 },
      { name: 'Squats', reps: 110 },
      { name: 'Plank', reps: 180, isTime: true },
    ],
    rewardXp: 3000,
    rewardCoins: 1500,
    titleId: 'eclipse_warrior',
    auraId: 'eclipse',
  },
];

export function getDungeonForRank(rankId: RankId): Dungeon | undefined {
  return DUNGEONS.find((d) => d.rankId === rankId);
}

export function getDungeonsUpToRank(rankId: RankId, allRanks: RankId[]): Dungeon[] {
  const idx = allRanks.indexOf(rankId);
  return DUNGEONS.filter((d) => allRanks.indexOf(d.rankId) <= idx);
}
