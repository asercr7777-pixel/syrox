from pathlib import Path

p = Path('src/store/useStore.ts')
s = p.read_text()

repls = [
("workoutRewardsClaimedToday: { push: false, pull: false, leg: false, ...(cloudState.workoutRewardsClaimedToday ?? {}) },", "workoutRewardsClaimedToday: { ...(cloudState.workoutRewardsClaimedToday ?? {}), push: cloudState.workoutRewardsClaimedToday?.push ?? false, pull: cloudState.workoutRewardsClaimedToday?.pull ?? false, leg: cloudState.workoutRewardsClaimedToday?.leg ?? false },"),
("    const enabledMain = state.mainTasks.filter((t) => t.enabled);\n    const disciplineScore = calculateDisciplineScore(state);", "    const disciplineScore = calculateDisciplineScore(state);"),
("  const enabledMain = state.mainTasks.filter((t) => t.enabled);\n  const activeCustomIds = new Set(state.customTasks.map((t) => t.id));\n  const totalPossible = enabledMain.length + state.customTasks.length;\n  if (totalPossible <= 0) return 0;\n  return Math.max(0, Math.min(100, Math.round(((mainDone + extraDone) / totalPossible) * 100)));", "  const enabledMain = state.mainTasks.filter((t) => t.enabled);\n  const mainDone = enabledMain.filter((t) => Boolean(state.coreCompleted[t.id])).length;\n  const extraDone = state.customTasks.filter((t) => Boolean(state.customCompleted[t.id])).length;\n  const totalPossible = enabledMain.length + state.customTasks.length;\n  if (totalPossible <= 0) return 0;\n  return Math.max(0, Math.min(100, Math.round(((mainDone + extraDone) / totalPossible) * 100)));"),
("      const item = pickFromRarity(pool as any, rarity);", "      const item = pickFromRarity(pool as any, rarity) as any;"),
]
for old, new in repls:
    if old not in s:
        raise SystemExit(f'Missing expected text: {old[:80]}')
    s = s.replace(old, new, 1)
p.write_text(s)
