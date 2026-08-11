text = replace_func(text, "function purchaseItem(", "\nfunction completeStoryMission", """function purchaseItem(itemId: string, category: string, price: number): boolean {
  let success = false;
  setState((s) => {
    const marketItem = getMarketItem(itemId, category as MarketCategory);
    if (!marketItem || price !== marketItem.price) return s;
    if (s.xp < marketItem.xpRequired || s.coins < marketItem.price) return s;
    const typeMap: Record<MarketCategory, InventoryItem['type']> = {
      weapons: 'weapon', auras: 'aura', titles: 'title',
      shields: 'shield', frames: 'frame', backgrounds: 'background',
    };
    const type = typeMap[marketItem.category];
    if (s.inventory.some((i) => i.id === itemId && i.type === type)) return s;
    success = true;
    playSound('reward');
    return {
      ...s,
      coins: s.coins - marketItem.price,
      inventory: [...s.inventory, { id: itemId, type, obtainedAt: Date.now(), favorite: false }],
    };
  });
  return success;
}
""")

text = replace_func(text, "function completeStoryMission(", "\nfunction setStoryChoice", """function completeStoryMission(missionId: string, reward: { xp: number; coins: number }) {
  setState((s) => {
    if (s.storyCompletedMissions[missionId]) return s;
    const mission = ALL_CHAPTERS.flatMap((chapter) => chapter.missions).find((m) => m.id === missionId);
    const boss = mission ? undefined : ALL_CHAPTERS.map((chapter) => chapter.boss).find((b) => `boss_${b.id}` === missionId);
    if (!mission && !boss) return s;
    const expectedXp = mission?.xpReward ?? boss?.xpReward ?? 0;
    const expectedCoins = mission?.coinReward ?? boss?.coinReward ?? 0;
    if (reward.xp !== expectedXp || reward.coins !== expectedCoins) return s;
    let next = addPoints(s, expectedXp, 0);
    next = { ...next, coins: next.coins + expectedCoins, storyCompletedMissions: { ...next.storyCompletedMissions, [missionId]: true } };
    return next;
  });
  playSound('reward');
}
""")

text = replace_func(text, "function clearDungeon(", "\nfunction damageBoss", """function clearDungeon(dungeonId: string): DropResult[] {
  let drops: DropResult[] = [];
  setState((s) => {
    const dungeon = DUNGEONS.find((d) => d.id === dungeonId);
    if (!dungeon || s.dungeonClearedToday) return s;
    if (getRankIndex(getRankByXp(s.xp).id) < getRankIndex(dungeon.rankId)) return s;
    drops = generateDrops(dungeon.auraDropBonus);
    let next = addPoints(s, dungeon.rewardXp, dungeon.rewardXp);
    next = { ...next, coins: next.coins + dungeon.rewardCoins, dungeonClearedToday: true, lastDungeonDate: todayStr(), dungeonsCleared: next.dungeonsCleared + 1 };
    const existing = new Set(next.inventory.map((i) => `${i.type}:${i.id}`));
    const rewardItems: InventoryItem[] = [];
    for (const drop of drops) {
      if (!drop.itemId) continue;
      const key = `${drop.type}:${drop.itemId}`;
      if (!existing.has(key)) {
        existing.add(key);
        rewardItems.push({ id: drop.itemId, type: drop.type as InventoryItem['type'], obtainedAt: Date.now(), favorite: false });
      }
    }
    for (const reward of dungeon.rewards) {
      if (!reward.itemId || !['aura', 'title', 'weapon', 'shield', 'badge'].includes(reward.type)) continue;
      const key = `${reward.type}:${reward.itemId}`;
      if (!existing.has(key)) {
        existing.add(key);
        rewardItems.push({ id: reward.itemId, type: reward.type as InventoryItem['type'], obtainedAt: Date.now(), favorite: false });
      }
    }
    return { ...next, inventory: [...next.inventory, ...rewardItems] };
  });
  playSound('rankup');
  return drops;
}
""")

text = replace_func(text, "function damageBoss(", "\nfunction clearSecretDungeon", """function damageBoss(amount: number): DropResult[] {
  let drops: DropResult[] = [];
  setState((s) => {
    const bossId = 'dungeon_boss';
    if (s.bossDefeated[bossId]) return s;
    const currentHp = s.bossHpRemaining[bossId] ?? (BOSS_DUNGEON as any).hp;
    const safeAmount = Math.max(0, Math.min(100, Math.floor(Number.isFinite(amount) ? amount : 0)));
    if (safeAmount <= 0) return s;
    const actualDamage = Math.min(safeAmount, currentHp);
    const newHp = Math.max(0, currentHp - actualDamage);
    let next = addPoints(s, actualDamage, actualDamage);
    next = { ...next, bossHpRemaining: { ...next.bossHpRemaining, [bossId]: newHp } };
    if (newHp === 0) {
      next = { ...next, bossDefeated: { ...next.bossDefeated, [bossId]: true }, coins: next.coins + BOSS_DUNGEON.rewardCoins };
      next = addPoints(next, BOSS_DUNGEON.rewardXp, BOSS_DUNGEON.rewardXp);
      drops = [
        { type: 'aura', itemId: BOSS_DUNGEON.auraId, rarity: 'legendary', label: 'Shadow Monarch Aura' },
        { type: 'title', itemId: BOSS_DUNGEON.titleId, rarity: 'legendary', label: 'Shadow Monarch Title' },
        { type: 'badge', itemId: BOSS_DUNGEON.badgeId, rarity: 'legendary', label: 'Boss Slayer Badge' },
      ];
      const existing = new Set(next.inventory.map((i) => `${i.type}:${i.id}`));
      const newItems = drops.filter((d) => d.itemId && !existing.has(`${d.type}:${d.itemId}`))
        .map((d) => ({ id: d.itemId!, type: d.type as InventoryItem['type'], obtainedAt: Date.now(), favorite: false }));
      return { ...next, inventory: [...next.inventory, ...newItems] };
    }
    return next;
  });
  playSound('task');
  return drops;
}
""")
