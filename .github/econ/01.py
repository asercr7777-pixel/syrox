from pathlib import Path
import re

store = Path("src/store/useStore.ts")
text = store.read_text()

def replace_func(src, start_marker, end_marker, replacement):
    a = src.index(start_marker)
    b = src.index(end_marker, a)
    return src[:a] + replacement + src[b:]

if "getMarketItem, type MarketCategory" not in text:
    text = text.replace(
        "import { ALL_CHAPTERS, getTotalChapters } from '../data/story';",
        "import { ALL_CHAPTERS, getTotalChapters } from '../data/story';\n"
        "import { getMarketItem, type MarketCategory } from '../data/marketplace';\n"
        "import { getChestById } from '../data/chests';\n"
        "import { getBattlePassReward } from '../data/battlepass';\n"
        "import { getMilestoneById } from '../data/milestones';",
        1,
    )

if "const safeInventory = Array.from(" not in text:
    anchor = """  const safeCoreCompleted = cloudState.mainTasks && cloudState.mainTasks.length > 0
    ? Object.fromEntries(safeMainTasks.map((task) => [task.id, Boolean(cloudState.coreCompleted?.[task.id])]))
    : def.coreCompleted;
"""
    insertion = anchor + """  const safeInventory = Array.from(
    new Map(
      (cloudState.inventory ?? []).map((item) => [`${item.type}:${item.id}`, {
        ...item,
        obtainedAt: Number.isFinite(item.obtainedAt) ? item.obtainedAt : Date.now(),
        favorite: Boolean(item.favorite),
      }])
    ).values()
  );
"""
    if anchor not in text:
        raise SystemExit("normalize anchor missing")
    text = text.replace(anchor, insertion, 1)

text = text.replace(
    "    level: levelFromXp(Math.max(0, cloudState.xp ?? def.xp)),",
    """    xp: Math.max(0, Number.isFinite(cloudState.xp) ? cloudState.xp : def.xp),
    coins: Math.max(0, Number.isFinite(cloudState.coins) ? cloudState.coins : def.coins),
    totalPoints: Math.max(0, Number.isFinite(cloudState.totalPoints) ? cloudState.totalPoints : def.totalPoints),
    dailyXp: Math.max(0, Math.min(Number.isFinite(cloudState.dailyXp) ? cloudState.dailyXp : 0, Number.isFinite(cloudState.dailyCap) ? cloudState.dailyCap : def.dailyCap)),
    dailyPoints: Math.max(0, Number.isFinite(cloudState.dailyPoints) ? cloudState.dailyPoints : def.dailyPoints),
    dailyCap: Math.max(1, Number.isFinite(cloudState.dailyCap) ? cloudState.dailyCap : def.dailyCap),
    level: levelFromXp(Math.max(0, Number.isFinite(cloudState.xp) ? cloudState.xp : def.xp)),""",
    1,
)
if "inventory: safeInventory," not in text:
    text = text.replace("    coreCompleted: safeCoreCompleted,\n    customCompleted:", "    coreCompleted: safeCoreCompleted,\n    inventory: safeInventory,\n    customCompleted:", 1)
text = text.replace(
    "    chestInventory: { ...def.chestInventory, ...cloudState.chestInventory },",
    """    chestInventory: Object.fromEntries(
      Object.entries({ ...def.chestInventory, ...cloudState.chestInventory }).map(([id, count]) => [id, Math.max(0, Math.floor(Number(count) || 0))])
    ),""",
    1,
)
