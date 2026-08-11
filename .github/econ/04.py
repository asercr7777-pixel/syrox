text = replace_func(text, "function buyChest(", "\nfunction equipPet", """function buyChest(chestId: string, price: number): boolean {
  let success = false;
  setState((s) => {
    const chest = getChestById(chestId);
    if (!chest || price !== chest.price || s.coins < chest.price) return s;
    success = true;
    playSound('click');
    return { ...s, coins: s.coins - chest.price, chestInventory: { ...s.chestInventory, [chestId]: (s.chestInventory[chestId] ?? 0) + 1 } };
  });
  return success;
}
""")

text = replace_func(text, "function claimLoginReward(", "\nfunction spinWheel", """function claimLoginReward(): { reward: any; newIndex: number } | null {
  let result: { reward: any; newIndex: number } | null = null;
  setState((s) => {
    const today = todayStr();
    if (s.lastLoginClaimDate === today) return s;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const newStreak = s.lastLoginClaimDate === yesterday ? s.loginStreak + 1 : 1;
    const index = (newStreak - 1) % 30;
    const reward = DAILY_LOGIN_REWARDS[index];
    result = { reward, newIndex: index };
    let next: AppState = { ...s, lastLoginClaimDate: today, loginStreak: newStreak };
    if (reward.type === 'coins') next = { ...next, coins: next.coins + reward.amount };
    else if (reward.type === 'xp') next = addPoints(next, reward.amount, 0);
    else if (reward.type === 'chest') next = { ...next, chestInventory: { ...next.chestInventory, common_chest: (next.chestInventory.common_chest ?? 0) + reward.amount } };
    else if (reward.type === 'aura') {
      const pool = AURAS.filter((a) => a.rarity === reward.aura);
      const pick = pool[Math.floor(Math.random() * pool.length)];
      if (pick && !next.inventory.some((i) => i.id === pick.id && i.type === 'aura')) next = { ...next, inventory: [...next.inventory, { id: pick.id, type: 'aura', obtainedAt: Date.now(), favorite: false }] };
      else if (pick) next = { ...next, coins: next.coins + 150 };
    }
    if (reward.shield) next = { ...next, streakShield: next.streakShield + 1 };
    return next;
  });
  if (result) playSound('reward');
  return result;
}
""")

text = replace_func(text, "function spinWheel(", "\nfunction claimChallenge", """function spinWheel(): DropResult | null {
  let result: DropResult | null = null;
  setState((s) => {
    const today = todayStr();
    if (s.lastSpinDate === today) return s;
    const totalWeight = SPIN_REWARDS.reduce((a, r) => a + r.weight, 0);
    let roll = Math.random() * totalWeight;
    let chosen = SPIN_REWARDS[0];
    for (const r of SPIN_REWARDS) {
      roll -= r.weight;
      if (roll <= 0) { chosen = r; break; }
    }
    let next: AppState = { ...s, lastSpinDate: today, lastSpinRewardId: chosen.id };
    if (chosen.type === 'coins') {
      next = { ...next, coins: next.coins + chosen.amount };
      result = { type: 'coins', amount: chosen.amount, label: `${chosen.amount} Coins` };
    } else if (chosen.type === 'xp') {
      next = addPoints(next, chosen.amount, 0);
      result = { type: 'xp', amount: chosen.amount, label: `${chosen.amount} XP` };
    } else if (chosen.type === 'shards') {
      const coins = chosen.amount * 10;
      next = { ...next, coins: next.coins + coins };
      result = { type: 'coins', amount: coins, label: `${coins} Coins (Aura Shards converted)` };
    } else if (chosen.type === 'double_xp') {
      next = { ...next, doubleXpUntil: Date.now() + 3600 * 1000 };
      result = { type: 'xp', amount: 0, label: 'Double XP for 1 hour' };
    } else if (chosen.type === 'chest') {
      next = { ...next, chestInventory: { ...next.chestInventory, common_chest: (next.chestInventory.common_chest ?? 0) + 1 } };
      result = { type: 'chest', amount: 1, label: 'Mystery Chest' };
    } else if (chosen.type === 'weapon' || chosen.type === 'aura') {
      const pool = chosen.type === 'weapon' ? WEAPONS : AURAS;
      const rarity = rollRarity();
      const item = pickFromRarity(pool, rarity);
      if (item && !next.inventory.some((i) => i.id === item.id && i.type === chosen.type)) {
        next = { ...next, inventory: [...next.inventory, { id: item.id, type: chosen.type, obtainedAt: Date.now(), favorite: false }] };
        result = { type: chosen.type, itemId: item.id, rarity, label: item.name };
      } else {
        const coins = chosen.type === 'weapon' ? 100 : 150;
        next = { ...next, coins: next.coins + coins };
        result = { type: 'coins', amount: coins, label: `${coins} Coins (duplicate conversion)` };
      }
    }
    return next;
  });
  playSound('reward');
  return result;
}
""")
