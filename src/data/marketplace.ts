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
  boost?: number;
}

const RARITY_PRICE: Record<Rarity, number> = { common: 50, rare: 150, epic: 400, legendary: 1000, mythic: 2500, secret: 6000 };
const RARITY_XP: Record<Rarity, number> = { common: 0, rare: 1000, epic: 5000, legendary: 15000, mythic: 40000, secret: 100000 };

export const CATEGORY_LABELS: Record<MarketCategory, string> = {
  weapons: 'Weapons', auras: 'Auras', titles: 'Titles', shields: 'Shields', frames: 'Frames', backgrounds: 'Backgrounds',
};

const CATEGORY_SINGULAR: Record<MarketCategory, string> = {
  weapons: 'weapon', auras: 'aura', titles: 'title', shields: 'shield', frames: 'frame', backgrounds: 'background',
};

function rankForXp(xp: number): RankId {
  let result: RankId = 'E';
  for (const rank of RANKS) { if (xp <= rank.xpRequired) return rank.id; result = rank.id; }
  return result;
}

function buildDescription(name: string, rarity: Rarity, category: MarketCategory): string {
  return `${name} is a ${rarity.charAt(0).toUpperCase() + rarity.slice(1)} ${CATEGORY_SINGULAR[category]}. Collect it, equip it, and show your progression.`;
}

function buildItems<T extends { id: string; name: string; rarity: Rarity; boost?: number }>(items: T[], category: MarketCategory): MarketItem[] {
  return items.map((item) => ({
    id: item.id, name: item.name, rarity: item.rarity, category,
    price: RARITY_PRICE[item.rarity], xpRequired: RARITY_XP[item.rarity],
    rankRequired: rankForXp(RARITY_XP[item.rarity]), description: buildDescription(item.name, item.rarity, category), boost: item.boost,
  }));
}

const NEW_WEAPONS: MarketItem[] = [
  { id: 'dreadfang_katana', name: 'Dreadfang Katana', rarity: 'rare', category: 'weapons', price: 150, xpRequired: 1000, rankRequired: rankForXp(1000), description: 'A silent curved blade built for precise hunters.', boost: 4 },
  { id: 'thunder_reaver', name: 'Thunder Reaver', rarity: 'epic', category: 'weapons', price: 400, xpRequired: 5000, rankRequired: rankForXp(5000), description: 'A storm-forged greatsword that rewards relentless progress.', boost: 7 },
  { id: 'abyssal_scythe', name: 'Abyssal Scythe', rarity: 'epic', category: 'weapons', price: 400, xpRequired: 5000, rankRequired: rankForXp(5000), description: 'A dark reaper forged for hunters who never retreat.', boost: 7 },
  { id: 'sunpiercer_lance', name: 'Sunpiercer Lance', rarity: 'legendary', category: 'weapons', price: 1000, xpRequired: 15000, rankRequired: rankForXp(15000), description: 'A radiant lance for breaking through impossible limits.', boost: 10 },
  { id: 'voidfang_katana', name: 'Voidfang Katana', rarity: 'legendary', category: 'weapons', price: 1000, xpRequired: 15000, rankRequired: rankForXp(15000), description: 'A void-edged katana that bends the light around its wielder.', boost: 10 },
  { id: 'monarchs_greatsword', name: "Monarch's Greatsword", rarity: 'mythic', category: 'weapons', price: 2500, xpRequired: 40000, rankRequired: rankForXp(40000), description: 'A colossal blade reserved for hunters at the mythic tier.', boost: 15 },
  { id: 'starfall_bow', name: 'Starfall Bow', rarity: 'mythic', category: 'weapons', price: 2500, xpRequired: 40000, rankRequired: rankForXp(40000), description: 'A celestial bow that turns consistency into power.', boost: 15 },
  { id: 'eclipse_cleaver', name: 'Eclipse Cleaver', rarity: 'secret', category: 'weapons', price: 6000, xpRequired: 100000, rankRequired: rankForXp(100000), description: 'A forbidden cleaver carrying the force of a total eclipse.', boost: 20 },
  { id: 'worldbreaker_hammer', name: 'Worldbreaker Hammer', rarity: 'secret', category: 'weapons', price: 6000, xpRequired: 100000, rankRequired: rankForXp(100000), description: 'A devastating hammer said to split any obstacle.', boost: 20 },
  { id: 'shadowfang_dagger', name: 'Shadowfang Dagger', rarity: 'secret', category: 'weapons', price: 6000, xpRequired: 100000, rankRequired: rankForXp(100000), description: 'A near-silent dagger forged from condensed shadow.', boost: 20 },
];

export const MARKET_ITEMS: MarketItem[] = [
  ...buildItems(WEAPONS, 'weapons'), ...NEW_WEAPONS,
  ...buildItems(AURAS, 'auras'), ...buildItems(TITLES, 'titles'),
  ...buildItems(SHIELDS, 'shields'), ...buildItems(FRAMES, 'frames'), ...buildItems(BACKGROUNDS, 'backgrounds'),
];

export function getMarketItem(id: string, category: MarketCategory): MarketItem | undefined {
  return MARKET_ITEMS.find((item) => item.id === id && item.category === category);
}
