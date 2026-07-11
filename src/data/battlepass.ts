export interface BattlePassSeason {
  id: string;
  name: string;
  maxTier: number;
  startDate: string;
  endDate: string;
}

export type RewardType = 'coins' | 'xp' | 'chest' | 'item';
export type SpecialItemType = 'weapon' | 'aura' | 'title' | 'frame' | 'background';

export interface Reward {
  type: RewardType;
  amount?: number;
  itemId?: string;
  label: string;
}

export interface BattlePassTier {
  tier: number;
  freeReward: Reward;
  premiumReward: Reward;
}

export const BATTLE_PASS_SEASON: BattlePassSeason = {
  id: 'season_1',
  name: 'Season 1: Awakening',
  maxTier: 100,
  startDate: '2026-07-01',
  endDate: '2026-09-30',
};

function generateSpecialItem(tier: number): SpecialItemType {
  const specialItems: SpecialItemType[] = [
    'weapon',
    'aura',
    'title',
    'frame',
    'background',
  ];
  return specialItems[(tier / 10 - 1) % specialItems.length];
}

function generateBattlePassRewards(): BattlePassTier[] {
  const rewards: BattlePassTier[] = [];

  for (let tier = 1; tier <= 100; tier++) {
    const isSpecialTier = tier % 10 === 0;

    let freeReward: Reward;
    let premiumReward: Reward;

    if (isSpecialTier) {
      const specialItem = generateSpecialItem(tier);
      freeReward = {
        type: 'item',
        itemId: `special_${specialItem}_tier${tier}_free`,
        label: `Special ${specialItem.charAt(0).toUpperCase() + specialItem.slice(1)} (Free)`,
      };
      premiumReward = {
        type: 'item',
        itemId: `special_${specialItem}_tier${tier}_premium`,
        label: `Exclusive ${specialItem.charAt(0).toUpperCase() + specialItem.slice(1)} (Premium)`,
      };
    } else {
      const freeCoins = 100 + tier * 5;
      const freeXp = 50 + tier * 2;
      const premiumCoins = 300 + tier * 15;
      const premiumXp = 150 + tier * 5;

      if (tier % 2 === 0) {
        freeReward = {
          type: 'coins',
          amount: freeCoins,
          label: `${freeCoins} Coins`,
        };
        premiumReward = {
          type: 'coins',
          amount: premiumCoins,
          label: `${premiumCoins} Coins`,
        };
      } else {
        freeReward = {
          type: 'xp',
          amount: freeXp,
          label: `${freeXp} XP`,
        };
        premiumReward = {
          type: 'xp',
          amount: premiumXp,
          label: `${premiumXp} XP`,
        };
      }
    }

    rewards.push({
      tier,
      freeReward,
      premiumReward,
    });
  }

  return rewards;
}

export const BATTLE_PASS_REWARDS: BattlePassTier[] = generateBattlePassRewards();

export function getBattlePassReward(tier: number): BattlePassTier | undefined {
  if (tier < 1 || tier > 100) return undefined;
  return BATTLE_PASS_REWARDS[tier - 1];
}
