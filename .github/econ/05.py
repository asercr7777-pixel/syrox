text = replace_func(text, "function equipItem(", "\nfunction unequipItem", """function equipItem(type: 'aura' | 'weapon' | 'title' | 'shield' | 'frame' | 'background', itemId: string) {
  setState((s) => {
    if (!s.inventory.some((item) => item.id === itemId && item.type === type)) return s;
    return { ...s, equipped: { ...s.equipped, [type]: itemId } };
  });
}
""")

text = replace_func(text, "function claimBattlePassReward(", "\nfunction claimDailyFortune", """function claimBattlePassReward(tier: number, premium: boolean) {
  setState((s) => {
    const rewardTier = getBattlePassReward(tier);
    if (!rewardTier || tier > s.battlePassTier) return s;
    if (premium && !s.battlePassPremium) return s;
    const claimed = premium ? s.battlePassClaimedPremium : s.battlePassClaimedFree;
    if (claimed.includes(tier)) return s;
    const reward = premium ? rewardTier.premiumReward : rewardTier.freeReward;
    let next = { ...s };
    if (reward.type === 'coins') next = { ...next, coins: next.coins + (reward.amount ?? 0) };
    else if (reward.type === 'xp') next = addPoints(next, reward.amount ?? 0, 0);
    else if (reward.type === 'item' && reward.itemId) {
      const itemType: InventoryItem['type'] = reward.itemId.includes('aura') ? 'aura' : reward.itemId.includes('weapon') ? 'weapon' : 'title';
      if (!next.inventory.some((i) => i.id === reward.itemId && i.type === itemType)) next = { ...next, inventory: [...next.inventory, { id: reward.itemId, type: itemType, obtainedAt: Date.now(), favorite: false }] };
    }
    playSound('reward');
    return premium ? { ...next, battlePassClaimedPremium: [...next.battlePassClaimedPremium, tier] } : { ...next, battlePassClaimedFree: [...next.battlePassClaimedFree, tier] };
  });
}
""")

text = replace_func(text, "function claimMilestone(", "\nfunction prestige", """function claimMilestone(milestoneId: string) {
  setState((s) => {
    if (s.milestoneClaimed.includes(milestoneId)) return s;
    const milestone = getMilestoneById(milestoneId);
    if (!milestone) return s;
    let next = addPoints(s, milestone.reward.xp, 0);
    next = { ...next, coins: next.coins + milestone.reward.coins };
    const existing = new Set(next.inventory.map((i) => `${i.type}:${i.id}`));
    const rewardItems: InventoryItem[] = [];
    if (milestone.reward.badgeId && !existing.has(`badge:${milestone.reward.badgeId}`)) rewardItems.push({ id: milestone.reward.badgeId, type: 'badge', obtainedAt: Date.now(), favorite: false });
    if (milestone.reward.auraId && !existing.has(`aura:${milestone.reward.auraId}`)) rewardItems.push({ id: milestone.reward.auraId, type: 'aura', obtainedAt: Date.now(), favorite: false });
    playSound('rankup');
    return { ...next, inventory: [...next.inventory, ...rewardItems], milestoneClaimed: [...next.milestoneClaimed, milestoneId] };
  });
}
""")

if ".filter((r) => r.type !== 'title')" in text:
    text = text.replace("const newItems: InventoryItem[] = rank.rewards\n      .filter((r) => r.type !== 'title')\n      .map", "const newItems: InventoryItem[] = rank.rewards\n      .map", 1)

store.write_text(text)
