export type RankId =
  | 'E'
  | 'F'
  | 'D'
  | 'C'
  | 'B'
  | 'A'
  | 'S'
  | 'SS'
  | 'SS_DARK'
  | 'SS_SHADOW_DARK'
  | 'SHADOW_HUNTER'
  | 'SHADOW_MONARCH'
  | 'ELITE_SLAYER'
  | 'NIGHTMARE_BRINGER'
  | 'DOOM_BRINGER'
  | 'EXECUTIONER'
  | 'MYTHIC_ONE'
  | 'IMMORTAL_WARRIOR'
  | 'SHADOW_KING'
  | 'SYSTEM_OVERLORD';

export interface RankReward {
  type: 'aura' | 'weapon' | 'shield' | 'title';
  itemId: string;
  label: string;
}

export interface RankDungeon {
  name: string;
  xpReward: number;
}

export interface Rank {
  id: RankId;
  name: string;
  emoji: string;
  color: string;
  glow: string;
  /** Total XP required to REACH this rank (cumulative). */
  xpRequired: number;
  description: string;
  dungeon: RankDungeon;
  rewards: RankReward[];
  /** Visual tier for card styling. */
  tier: 'bronze' | 'silver' | 'green' | 'blue' | 'purple' | 'gold' | 'fire' | 'lightning' | 'shadow' | 'monarch';
}

export const RANKS: Rank[] = [
  { id: 'E', name: 'E-Rank', emoji: '🔰', color: '#92725e', glow: 'rgba(146,114,94,0.5)', xpRequired: 0, description: 'The beginning of the awakening.', dungeon: { name: 'Novice Hollow', xpReward: 30 }, rewards: [{ type: 'aura', itemId: 'stone', label: 'Stone Aura' }, { type: 'title', itemId: 'rookie', label: 'Rookie Title' }], tier: 'bronze' },
  { id: 'F', name: 'F-Rank', emoji: '💠', color: '#cbd5e1', glow: 'rgba(203,213,225,0.5)', xpRequired: 400, description: 'A flicker of willpower.', dungeon: { name: 'Apprentice Cave', xpReward: 50 }, rewards: [{ type: 'aura', itemId: 'mist', label: 'Mist Aura' }, { type: 'shield', itemId: 'guardian_shield', label: 'Guardian Shield' }], tier: 'silver' },
  { id: 'D', name: 'D-Rank', emoji: '🔷', color: '#22c55e', glow: 'rgba(34,197,94,0.5)', xpRequired: 1200, description: 'The path reveals itself.', dungeon: { name: 'Goblin Cave', xpReward: 80 }, rewards: [{ type: 'aura', itemId: 'bronze', label: 'Bronze Aura' }, { type: 'title', itemId: 'wanderer', label: 'Wanderer Title' }], tier: 'green' },
  { id: 'C', name: 'C-Rank', emoji: '🔹', color: '#3b82f6', glow: 'rgba(59,130,246,0.5)', xpRequired: 2400, description: 'Discipline takes root.', dungeon: { name: 'Stone Crypt', xpReward: 140 }, rewards: [{ type: 'aura', itemId: 'frost', label: 'Frost Aura' }, { type: 'weapon', itemId: 'iron_sword', label: 'Iron Sword' }], tier: 'blue' },
  { id: 'B', name: 'B-Rank', emoji: '💎', color: '#a855f7', glow: 'rgba(168,85,247,0.5)', xpRequired: 4000, description: 'A hunter in the making.', dungeon: { name: 'Frozen Hollow', xpReward: 220 }, rewards: [{ type: 'aura', itemId: 'storm', label: 'Storm Aura' }, { type: 'title', itemId: 'elite_hunter', label: 'Elite Hunter Title' }], tier: 'purple' },
  { id: 'A', name: 'A-Rank', emoji: '🏵️', color: '#eab308', glow: 'rgba(234,179,8,0.5)', xpRequired: 6000, description: 'Elite of the awakened.', dungeon: { name: 'Inferno Spire', xpReward: 320 }, rewards: [{ type: 'aura', itemId: 'solar', label: 'Solar Aura' }, { type: 'shield', itemId: 'shadow_aegis', label: 'Shadow Aegis' }], tier: 'gold' },
  { id: 'S', name: 'S-Rank', emoji: '⚜️', color: '#f97316', glow: 'rgba(249,115,22,0.6)', xpRequired: 8500, description: 'A force to be reckoned with.', dungeon: { name: "Demon's Lair", xpReward: 460 }, rewards: [{ type: 'aura', itemId: 'crimson', label: 'Crimson Aura' }, { type: 'title', itemId: 'demon_hunter', label: 'Demon Hunter Title' }], tier: 'fire' },
  { id: 'SS', name: 'SS-Rank', emoji: '🜂', color: '#facc15', glow: 'rgba(250,204,21,0.7)', xpRequired: 11500, description: 'Lightning courses through you.', dungeon: { name: 'Void Sanctum', xpReward: 600 }, rewards: [{ type: 'aura', itemId: 'azure', label: 'Azure Aura' }, { type: 'weapon', itemId: 'storm_spear', label: 'Storm Spear' }], tier: 'lightning' },
  { id: 'SS_DARK', name: 'SS Dark', emoji: '🌌', color: '#64748b', glow: 'rgba(100,116,139,0.7)', xpRequired: 15000, description: 'Shadow begins to bend to your will.', dungeon: { name: 'Dark Cathedral', xpReward: 780 }, rewards: [{ type: 'aura', itemId: 'phantom', label: 'Phantom Aura' }, { type: 'weapon', itemId: 'shadow_bow', label: 'Shadow Bow' }], tier: 'shadow' },
  { id: 'SS_SHADOW_DARK', name: 'SS Shadow Dark', emoji: '🌑', color: '#475569', glow: 'rgba(71,85,105,0.8)', xpRequired: 19000, description: 'The abyss acknowledges you.', dungeon: { name: 'Shadow Abyss', xpReward: 960 }, rewards: [{ type: 'aura', itemId: 'void', label: 'Abyss Aura' }, { type: 'weapon', itemId: 'abyss_greatsword', label: 'Abyss Greatsword' }], tier: 'shadow' },
  { id: 'SHADOW_HUNTER', name: 'Shadow Hunter', emoji: '🐉', color: '#7c3aed', glow: 'rgba(124,58,237,0.8)', xpRequired: 23500, description: 'You hunt in the dark.', dungeon: { name: "Wolf King's Domain", xpReward: 1200 }, rewards: [{ type: 'aura', itemId: 'void', label: 'Void Aura' }, { type: 'weapon', itemId: 'void_blade', label: 'Void Blade' }], tier: 'shadow' },
  { id: 'SHADOW_MONARCH', name: 'Shadow Monarch', emoji: '👑', color: '#7c3aed', glow: 'rgba(124,58,237,0.85)', xpRequired: 28500, description: 'The monarch of shadows awakens.', dungeon: { name: "Monarch's Throne", xpReward: 1500 }, rewards: [{ type: 'aura', itemId: 'genesis', label: 'Genesis Aura' }, { type: 'weapon', itemId: 'monarchs_blade', label: "Monarch's Blade" }], tier: 'monarch' },
  { id: 'ELITE_SLAYER', name: 'Elite Slayer', emoji: '🪽', color: '#dc2626', glow: 'rgba(220,38,38,0.85)', xpRequired: 34000, description: 'A slayer of legends.', dungeon: { name: "Slayer's Coliseum", xpReward: 1800 }, rewards: [{ type: 'aura', itemId: 'inferno', label: 'Inferno Aura' }, { type: 'weapon', itemId: 'dragon_slayer', label: 'Dragon Slayer' }], tier: 'fire' },
  { id: 'NIGHTMARE_BRINGER', name: 'Nightmare Bringer', emoji: '🌙', color: '#be123c', glow: 'rgba(190,18,60,0.85)', xpRequired: 40000, description: 'You bring nightmares to the unworthy.', dungeon: { name: 'Nightmare Sanctum', xpReward: 2100 }, rewards: [{ type: 'aura', itemId: 'blood_moon', label: 'Blood Moon Aura' }, { type: 'weapon', itemId: 'nightmare_spear', label: 'Nightmare Spear' }], tier: 'shadow' },
  { id: 'DOOM_BRINGER', name: 'Doom Bringer', emoji: '☄️', color: '#b91c1c', glow: 'rgba(185,28,28,0.9)', xpRequired: 46500, description: 'The harbinger of doom.', dungeon: { name: 'Doom Crucible', xpReward: 2500 }, rewards: [{ type: 'aura', itemId: 'ragnarok', label: 'Ragnarok Aura' }, { type: 'weapon', itemId: 'ragnarok_axe', label: 'Ragnarok Axe' }], tier: 'fire' },
  { id: 'EXECUTIONER', name: 'Executioner', emoji: '🗡️', color: '#16a34a', glow: 'rgba(22,163,74,0.9)', xpRequired: 53500, description: 'The final judgment falls.', dungeon: { name: "Executioner's Block", xpReward: 2900 }, rewards: [{ type: 'aura', itemId: 'dragon', label: 'Dragon Aura' }, { type: 'weapon', itemId: 'dragon_kings_spear', label: "Dragon King's Spear" }], tier: 'green' },
  { id: 'MYTHIC_ONE', name: 'Mythic One', emoji: '🌠', color: '#fbbf24', glow: 'rgba(251,191,36,0.9)', xpRequired: 60500, description: 'Beyond mortal limits.', dungeon: { name: 'Mythic Sanctuary', xpReward: 3400 }, rewards: [{ type: 'aura', itemId: 'celestial', label: 'Celestial Aura' }, { type: 'weapon', itemId: 'infinity_blade', label: 'Infinity Blade' }], tier: 'gold' },
  { id: 'IMMORTAL_WARRIOR', name: 'Immortal Warrior', emoji: '♾️', color: '#a78bfa', glow: 'rgba(167,139,250,0.9)', xpRequired: 65500, description: 'Death cannot claim you.', dungeon: { name: 'Hall of the Immortal', xpReward: 4000 }, rewards: [{ type: 'aura', itemId: 'divine', label: 'Divine Aura' }, { type: 'weapon', itemId: 'eternal_blade', label: 'Eternal Blade' }], tier: 'purple' },
  { id: 'SHADOW_KING', name: 'Shadow King', emoji: '♛', color: '#4c1d95', glow: 'rgba(76,29,149,0.95)', xpRequired: 70500, description: 'King of all shadows.', dungeon: { name: "Shadow King's Court", xpReward: 4700 }, rewards: [{ type: 'aura', itemId: 'eclipse', label: 'Eclipse Aura' }, { type: 'weapon', itemId: 'crimson_eclipse', label: 'Crimson Eclipse' }], tier: 'shadow' },
  { id: 'SYSTEM_OVERLORD', name: 'The System Overlord', emoji: '👁️', color: '#fbbf24', glow: 'rgba(251,191,36,0.95)', xpRequired: 75000, description: 'The apex. The overlord of the System.', dungeon: { name: 'System Overlord Citadel', xpReward: 5500 }, rewards: [{ type: 'aura', itemId: 'ascended_shadow', label: 'Ascended Shadow Aura' }, { type: 'weapon', itemId: 'last_monarch_blade', label: 'Last Monarch Blade' }], tier: 'monarch' },
];

export function getRankByXp(xp: number): Rank {
  let current = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.xpRequired) current = r;
    else break;
  }
  return current;
}

export function getNextRank(xp: number): Rank | null {
  for (const r of RANKS) {
    if (xp < r.xpRequired) return r;
  }
  return null;
}

export function getRankIndex(rankId: RankId): number {
  return RANKS.findIndex((r) => r.id === rankId);
}

export function isAtOrAbove(xp: number, rankId: RankId): boolean {
  const target = RANKS.find((r) => r.id === rankId);
  if (!target) return false;
  return xp >= target.xpRequired;
}
