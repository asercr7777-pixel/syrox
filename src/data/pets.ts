export type PetBonusType = 'xp_boost' | 'coin_boost' | 'streak_shield' | 'luck';
export type RankId = 'E' | 'F' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SHADOW_HUNTER';

export interface PetBonus {
  type: PetBonusType;
  value: number;
}

export interface Pet {
  id: string;
  name: string;
  emoji: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'secret';
  description: string;
  bonus: PetBonus | PetBonus[];
  unlockRank: RankId;
  maxLevel: number;
}

export const PETS: Pet[] = [
  {
    id: 'shadow_wolf',
    name: 'Shadow Wolf',
    emoji: '🐺',
    rarity: 'common',
    description: 'A swift dark wolf that enhances your training pace.',
    bonus: { type: 'xp_boost', value: 5 },
    unlockRank: 'E',
    maxLevel: 30,
  },
  {
    id: 'baby_dragon',
    name: 'Baby Dragon',
    emoji: '🐉',
    rarity: 'rare',
    description: 'A young dragon that multiplies your coin earnings.',
    bonus: { type: 'coin_boost', value: 10 },
    unlockRank: 'D',
    maxLevel: 50,
  },
  {
    id: 'spirit_fox',
    name: 'Spirit Fox',
    emoji: '🦊',
    rarity: 'epic',
    description: 'A mystical fox blessed with fortune and luck.',
    bonus: { type: 'luck', value: 15 },
    unlockRank: 'B',
    maxLevel: 70,
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    emoji: '🔥',
    rarity: 'legendary',
    description: 'A legendary phoenix that amplifies your experience gains.',
    bonus: { type: 'xp_boost', value: 15 },
    unlockRank: 'A',
    maxLevel: 100,
  },
  {
    id: 'dark_raven',
    name: 'Dark Raven',
    emoji: '🖤',
    rarity: 'mythic',
    description: 'A mythic raven that protects your hard-earned streaks.',
    bonus: { type: 'streak_shield', value: 1 },
    unlockRank: 'S',
    maxLevel: 150,
  },
  {
    id: 'titan_golem',
    name: 'Titan Golem',
    emoji: '⛰️',
    rarity: 'secret',
    description: 'An ancient golem of immense power, boosting both XP and coins.',
    bonus: [
      { type: 'xp_boost', value: 25 },
      { type: 'coin_boost', value: 25 },
    ],
    unlockRank: 'SHADOW_HUNTER',
    maxLevel: 200,
  },
];

export function getPetById(id: string): Pet | undefined {
  return PETS.find((pet) => pet.id === id);
}
