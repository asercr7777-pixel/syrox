export type ChestRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'secret';
export type DropType = 'coins' | 'xp' | 'weapon' | 'aura' | 'title' | 'frame' | 'background';

export interface DropOption {
  type: DropType;
  weight: number;
}

export interface ChestType {
  id: string;
  name: string;
  rarity: ChestRarity;
  price: number;
  description: string;
  drops: DropOption[];
}

export const CHEST_TYPES: ChestType[] = [
  {
    id: 'common_chest',
    name: 'Common Chest',
    rarity: 'common',
    price: 50,
    description: 'A basic wooden chest containing modest rewards.',
    drops: [
      { type: 'coins', weight: 60 },
      { type: 'xp', weight: 30 },
      { type: 'weapon', weight: 10 },
    ],
  },
  {
    id: 'rare_chest',
    name: 'Rare Chest',
    rarity: 'rare',
    price: 150,
    description: 'An ornate silver chest with improved rewards.',
    drops: [
      { type: 'coins', weight: 40 },
      { type: 'xp', weight: 30 },
      { type: 'weapon', weight: 15 },
      { type: 'aura', weight: 10 },
      { type: 'title', weight: 5 },
    ],
  },
  {
    id: 'epic_chest',
    name: 'Epic Chest',
    rarity: 'epic',
    price: 400,
    description: 'A glowing golden chest containing powerful items.',
    drops: [
      { type: 'coins', weight: 25 },
      { type: 'xp', weight: 25 },
      { type: 'weapon', weight: 20 },
      { type: 'aura', weight: 15 },
      { type: 'title', weight: 10 },
      { type: 'frame', weight: 5 },
    ],
  },
  {
    id: 'legendary_chest',
    name: 'Legendary Chest',
    rarity: 'legendary',
    price: 1000,
    description: 'A legendary crimson chest radiating immense power.',
    drops: [
      { type: 'coins', weight: 15 },
      { type: 'xp', weight: 20 },
      { type: 'weapon', weight: 25 },
      { type: 'aura', weight: 20 },
      { type: 'title', weight: 10 },
      { type: 'frame', weight: 7 },
      { type: 'background', weight: 3 },
    ],
  },
  {
    id: 'mythic_chest',
    name: 'Mythic Chest',
    rarity: 'mythic',
    price: 2500,
    description: 'A mythic obsidian chest housing treasures of legend.',
    drops: [
      { type: 'coins', weight: 10 },
      { type: 'xp', weight: 15 },
      { type: 'weapon', weight: 25 },
      { type: 'aura', weight: 25 },
      { type: 'title', weight: 15 },
      { type: 'frame', weight: 7 },
      { type: 'background', weight: 3 },
    ],
  },
  {
    id: 'secret_chest',
    name: 'Secret Chest',
    rarity: 'secret',
    price: 5000,
    description: 'A mysterious void-black chest of untold riches.',
    drops: [
      { type: 'coins', weight: 5 },
      { type: 'xp', weight: 10 },
      { type: 'weapon', weight: 30 },
      { type: 'aura', weight: 30 },
      { type: 'title', weight: 15 },
      { type: 'frame', weight: 5 },
      { type: 'background', weight: 5 },
    ],
  },
];

export function getChestById(id: string): ChestType | undefined {
  return CHEST_TYPES.find((chest) => chest.id === id);
}
