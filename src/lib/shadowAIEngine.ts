export type ShadowGroup = 'push' | 'pull' | 'leg' | 'core' | 'conditioning' | 'mobility' | 'plyometric';

export type ShadowExerciseMeta = {
  name: string;
  group: ShadowGroup;
  targets: string[];
  impact?: 'low' | 'moderate' | 'high';
  difficulty?: 1 | 2 | 3 | 4;
};

const RECOVERY_HOURS: Record<ShadowGroup, number> = {
  push: 48,
  pull: 48,
  leg: 72,
  core: 24,
  conditioning: 24,
  mobility: 0,
  plyometric: 72,
};

const TARGET_ORDER: Record<string, number> = {
  chest: 1,
  shoulders: 2,
  triceps: 3,
  back: 1,
  biceps: 2,
  quads: 1,
  glutes: 2,
  hamstrings: 2,
  calves: 3,
  core: 1,
  ankles: 2,
  hips: 2,
};

export const normalizeTarget = (target: string) => target.toLowerCase().replace(/\s+/g, ' ').trim();

export const targetScore = (target: string) => {
  const t = normalizeTarget(target);
  const key = Object.keys(TARGET_ORDER).find(k => t.includes(k));
  return key ? TARGET_ORDER[key] : 3;
};

/**
 * Returns a deterministic, non-repeating exercise order for a single session.
 * The caller supplies only exercises already filtered for equipment and mode.
 */
export function rankExercises(
  candidates: ShadowExerciseMeta[],
  preferredGroups: ShadowGroup[],
  week: number,
  day: number,
  used: Set<string>,
) {
  return [...candidates]
    .filter(e => !used.has(e.name))
    .filter(e => preferredGroups.includes(e.group))
    .sort((a, b) => {
      const ag = preferredGroups.indexOf(a.group);
      const bg = preferredGroups.indexOf(b.group);
      if (ag !== bg) return ag - bg;
      const ad = Math.abs((a.difficulty ?? 2) - Math.min(4, 1 + Math.floor((week - 1) / 4)));
      const bd = Math.abs((b.difficulty ?? 2) - Math.min(4, 1 + Math.floor((week - 1) / 4)));
      if (ad !== bd) return ad - bd;
      return ((a.name.length + day + week) % 7) - ((b.name.length + day + week) % 7);
    });
}

/**
 * Removes adjacent high-impact lower-body work. This prevents a plyometric
 * day from becoming an accidental second leg-power day immediately after legs.
 */
export function canPlaceGroup(
  group: ShadowGroup,
  previousGroups: ShadowGroup[],
  mode: 'standard' | 'basketball',
) {
  if (mode !== 'basketball') return true;
  if (group !== 'plyometric' && group !== 'leg') return true;
  const previous = previousGroups[previousGroups.length - 1];
  if (!previous) return true;
  return !(previous === 'leg' || previous === 'plyometric');
}

export function recoveryHours(group: ShadowGroup) {
  return RECOVERY_HOURS[group];
}

/** Keeps the generated program from silently assigning a category to the wrong day. */
export function isCompatibleGroup(dayGroups: ShadowGroup[], exerciseGroup: ShadowGroup) {
  return dayGroups.includes(exerciseGroup);
}
