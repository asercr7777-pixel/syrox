from pathlib import Path
import re
p = Path('src/store/useStore.ts')
s = p.read_text()
for line in [
    "    const mainDone = enabledMain.filter((t) => state.coreCompleted[t.id]).length;\n",
    "    const extraDone = Object.values(state.customCompleted).filter(Boolean).length;\n",
    "  const mainDone = enabledMain.filter((t) => next.coreCompleted[t.id]).length;\n",
    "  const extraDone = Object.values(next.customCompleted).filter(Boolean).length;\n",
]:
    s = s.replace(line, '', 1)
old = """    } else if (chosen.type === 'weapon' || chosen.type === 'aura') {
      const pool = chosen.type === 'weapon' ? WEAPONS : AURAS;
      const rarity = rollRarity();
      const item = pickFromRarity(pool, rarity);
      if (item && !next.inventory.some((i) => i.id === item.id && i.type === chosen.type)) {
        next = {
          ...next,
          inventory: [...next.inventory, { id: item.id, type: chosen.type, obtainedAt: Date.now(), favorite: false }],
        };
        result = { type: chosen.type, itemId: item.id, rarity, label: item.name };
      } else {
        const coins = chosen.type === 'weapon' ? 100 : 150;
        next = { ...next, coins: next.coins + coins };
        result = { type: 'coins', amount: coins, label: `${coins} Coins (duplicate conversion)` };
      }
    }
"""
new = """    } else if (chosen.type === 'weapon') {
      const rarity = rollRarity();
      const item = pickFromRarity(WEAPONS, rarity);
      if (item && !next.inventory.some((i) => i.id === item.id && i.type === 'weapon')) {
        next = { ...next, inventory: [...next.inventory, { id: item.id, type: 'weapon', obtainedAt: Date.now(), favorite: false }] };
        result = { type: 'weapon', itemId: item.id, rarity, label: item.name };
      } else {
        next = { ...next, coins: next.coins + 100 };
        result = { type: 'coins', amount: 100, label: '100 Coins (duplicate conversion)' };
      }
    } else if (chosen.type === 'aura') {
      const rarity = rollRarity();
      const item = pickFromRarity(AURAS, rarity);
      if (item && !next.inventory.some((i) => i.id === item.id && i.type === 'aura')) {
        next = { ...next, inventory: [...next.inventory, { id: item.id, type: 'aura', obtainedAt: Date.now(), favorite: false }] };
        result = { type: 'aura', itemId: item.id, rarity, label: item.name };
      } else {
        next = { ...next, coins: next.coins + 150 };
        result = { type: 'coins', amount: 150, label: '150 Coins (duplicate conversion)' };
      }
    }
"""
if old not in s:
    raise SystemExit('spin union block not found')
s = s.replace(old, new, 1)
p.write_text(s)
