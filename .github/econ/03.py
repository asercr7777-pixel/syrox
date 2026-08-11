text = replace_func(text, "function clearSecretDungeon(", "\nfunction claimLoginReward", """function clearSecretDungeon(dungeonId: string): DropResult[] {
  let drops: DropResult[] = [];
  setState((s) => {
    const dungeon = SECRET_DUNGEONS.find((d) => d.id === dungeonId);
    if (!dungeon || !s.secretDungeonAvailable || s.secretDungeonId !== dungeonId) return s;
    if (s.secretDungeonExpiresAt !== null && s.secretDungeonExpiresAt < Date.now()) return s;
    drops = generateDrops(0.15);
    drops.push({ type: 'aura', itemId: dungeon.auraId, rarity: 'epic', label: 'Secret Aura' });
    drops.push({ type: 'title', itemId: dungeon.titleId, rarity: 'epic', label: 'Secret Title' });
    let next = addPoints(s, dungeon.rewardXp, dungeon.rewardXp);
    next = { ...next, coins: next.coins + dungeon.rewardCoins, secretDungeonAvailable: false, secretDungeonId: null, secretDungeonExpiresAt: null, dungeonsCleared: next.dungeonsCleared + 1 };
    const existing = new Set(next.inventory.map((i) => `${i.type}:${i.id}`));
    const newItems = drops.filter((d) => d.itemId && !existing.has(`${d.type}:${d.itemId}`))
      .map((d) => ({ id: d.itemId!, type: d.type as InventoryItem['type'], obtainedAt: Date.now(), favorite: false }));
    return { ...next, inventory: [...next.inventory, ...newItems] };
  });
  playSound('rankup');
  return drops;
}
""")

text = replace_func(text, "function attackBoss(", "\nfunction openChest", """function attackBoss(bossId: string, damage: number): DropResult[] {
  let drops: DropResult[] = [];
  setState((s) => {
    if (s.bossDefeated[bossId]) return s;
    const currentHp = s.bossHpRemaining[bossId] ?? 0;
    const safeDamage = Math.max(0, Math.min(100, Math.floor(Number.isFinite(damage) ? damage : 0)));
    if (safeDamage <= 0 || currentHp <= 0) return s;
    const actualDamage = Math.min(safeDamage, currentHp);
    const newHp = Math.max(0, currentHp - actualDamage);
    let next = addPoints(s, actualDamage, actualDamage);
    next = { ...next, bossHpRemaining: { ...next.bossHpRemaining, [bossId]: newHp } };
    if (newHp === 0) {
      next = { ...next, bossDefeated: { ...next.bossDefeated, [bossId]: true }, activeBossId: null, coins: next.coins + 500 };
      drops = [{ type: 'coins', amount: 500, label: '500 Coins' }];
      playSound('rankup');
    } else playSound('task');
    return next;
  });
  return drops;
}
""")

text = replace_func(text, "function openChest(", "\nfunction buyChest", """function openChest(chestId: string): DropResult | null {
  let result: DropResult | null = null;
  setState((s) => {
    const count = s.chestInventory[chestId] ?? 0;
    const chest = getChestById(chestId);
    if (count <= 0 || !chest) return s;
    const dropType = ['coins', 'xp', 'weapon', 'aura', 'title'] as const;
    const pick = dropType[Math.floor(Math.random() * dropType.length)];
    if (pick === 'coins') {
      const amt = 50 + Math.floor(Math.random() * 200);
      result = { type: 'coins', amount: amt, label: `${amt} Coins` };
      return { ...s, chestInventory: { ...s.chestInventory, [chestId]: count - 1 }, coins: s.coins + amt };
    }
    if (pick === 'xp') {
      const amt = 50 + Math.floor(Math.random() * 150);
      result = { type: 'xp', amount: amt, label: `${amt} XP` };
      const next = addPoints(s, amt, 0);
      return { ...next, chestInventory: { ...next.chestInventory, [chestId]: count - 1 } };
    }
    const rarity = rollRarity();
    const pool = pick === 'weapon' ? WEAPONS : pick === 'aura' ? AURAS : TITLES;
    const item = pickFromRarity(pool, rarity);
    if (!item) {
      result = { type: 'coins', amount: 100, label: '100 Coins' };
      return { ...s, chestInventory: { ...s.chestInventory, [chestId]: count - 1 }, coins: s.coins + 100 };
    }
    const itemType = pick as InventoryItem['type'];
    if (s.inventory.some((i) => i.id === item.id && i.type === itemType)) {
      const duplicateValue = Math.max(25, Math.floor(chest.price * 0.5));
      result = { type: 'coins', amount: duplicateValue, label: `${duplicateValue} Coins (duplicate conversion)` };
      return { ...s, chestInventory: { ...s.chestInventory, [chestId]: count - 1 }, coins: s.coins + duplicateValue };
    }
    result = { type: itemType as DropResult['type'], itemId: item.id, rarity, label: item.name };
    return { ...s, chestInventory: { ...s.chestInventory, [chestId]: count - 1 }, inventory: [...s.inventory, { id: item.id, type: itemType, obtainedAt: Date.now(), favorite: false }] };
  });
  if (result) playSound('reward');
  return result;
}
""")
