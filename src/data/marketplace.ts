import type { Rarity } from './collections';
import { AURAS, WEAPONS, TITLES, SHIELDS, FRAMES, BACKGROUNDS } from './collections';
import type { RankId } from './ranks';
import { RANKS } from './ranks';

export type MarketCategory = 'weapons' | 'auras' | 'titles' | 'shields' | 'frames' | 'backgrounds';

export interface MarketItem {
  id: string;
  name: string;
  rarity: Rarity;
  category: MarketCategory;
  price: number;
  xpRequired: number;
  rankRequired: RankId;
  description: string;
}

// Balanced economy: rarity increases both the cost and progression requirement,
// while keeping common/rare items accessible during normal play.
const RARITY_PRICE: Record<Rarity, number> = {
  common: 50,
  rare: 150,
  epic: 400,
  legendary: 1000,
  mythic: 2500,
  secret: 6000,
};

const RARITY_XP: Record<Rarity, number> = {
  common: 0,
  rare: 1000,
  epic: 5000,
  legendary: 15000,
  mythic: 40000,
  secret: 100000,
};

export const CATEGORY_LABELS: Record<MarketCategory, string> = {
  weapons: 'Weapons',
  auras: 'Auras',
  titles: 'Titles',
  shields: 'Shields',
  frames: 'Frames',
  backgrounds: 'Backgrounds',
};

const CATEGORY_SINGULAR: Record<MarketCategory, string> = {
  weapons: 'weapon',
  auras: 'aura',
  titles: 'title',
  shields: 'shield',
  frames: 'frame',
  backgrounds: 'background',
};

function rankForXp(xp: number): RankId {
  let result: RankId = 'E';
  for (const rank of RANKS) {
    if (xp <= rank.xpRequired) return rank.id;
    result = rank.id;
  }
  return result;
}

function buildDescription(name: string, rarity: Rarity, category: MarketCategory): string {
  const type = CATEGORY_SINGULAR[category];
  const rarityText = rarity.charAt(0).toUpperCase() + rarity.slice(1);
  return `${name} is a ${rarityText} ${type}. Collect it, equip it, and show your progression.`;
}

function buildItems<T extends { id: string; name: string; rarity: Rarity }>(
  items: T[],
  category: MarketCategory,
): MarketItem[] {
  return items.map((item) => {
    const xpRequired = RARITY_XP[item.rarity];
    return {
      id: item.id,
      name: item.name,
      rarity: item.rarity,
      category,
      price: RARITY_PRICE[item.rarity],
      xpRequired,
      rankRequired: rankForXp(xpRequired),
      description: buildDescription(item.name, item.rarity, category),
    };
  });
}

export const MARKET_ITEMS: MarketItem[] = [
  ...buildItems(WEAPONS, 'weapons'),
  ...buildItems(AURAS, 'auras'),
  ...buildItems(TITLES, 'titles'),
  ...buildItems(SHIELDS, 'shields'),
  ...buildItems(FRAMES, 'frames'),
  ...buildItems(BACKGROUNDS, 'backgrounds'),
];

export function getMarketItem(id: string, category: MarketCategory): MarketItem | undefined {
  return MARKET_ITEMS.find((item) => item.id === id && item.category === category);
}
