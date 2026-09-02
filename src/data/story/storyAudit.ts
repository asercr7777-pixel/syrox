import { ALL_CHAPTERS } from './index';

export interface StoryAuditReport {
  valid: boolean;
  chapters: number;
  missions: number;
  bosses: number;
  loreEntries: number;
  errors: string[];
  warnings: string[];
}

export function auditCanonicalStory(): StoryAuditReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missionIds = new Set<string>();
  const bossIds = new Set<string>();
  const loreIds = new Set<string>();
  const chapterIds = new Set<string>();
  let missions = 0;

  if (ALL_CHAPTERS.length !== 30) errors.push(`Expected 30 chapters, found ${ALL_CHAPTERS.length}.`);

  ALL_CHAPTERS.forEach((chapter, index) => {
    if (chapter.number !== index + 1) errors.push(`Chapter order break at index ${index}: found chapter ${chapter.number}.`);
    if (chapterIds.has(chapter.id)) errors.push(`Duplicate chapter id: ${chapter.id}.`);
    chapterIds.add(chapter.id);

    if (chapter.missions.length !== 6) warnings.push(`${chapter.id} has ${chapter.missions.length} missions; canonical target is 6.`);
    if (!chapter.boss?.id) errors.push(`${chapter.id} has no boss id.`);
    if (chapter.boss?.id && bossIds.has(chapter.boss.id)) errors.push(`Duplicate boss id: ${chapter.boss.id}.`);
    if (chapter.boss?.id) bossIds.add(chapter.boss.id);

    const loreId = chapter.lore?.id;
    if (loreId && loreIds.has(loreId)) errors.push(`Duplicate lore id: ${loreId}.`);
    if (loreId) loreIds.add(loreId);

    chapter.missions.forEach((mission, missionIndex) => {
      missions += 1;
      if (missionIds.has(mission.id)) errors.push(`Duplicate mission id: ${mission.id}.`);
      missionIds.add(mission.id);
      if (mission.chapterId !== chapter.id) errors.push(`${mission.id} points to ${mission.chapterId}, expected ${chapter.id}.`);
      if (mission.target < 1) errors.push(`${mission.id} has an invalid target.`);
      if (mission.xpReward <= 0 || mission.coinReward <= 0) errors.push(`${mission.id} has a non-positive reward.`);
      const expectedUnlock = missionIndex < chapter.missions.length - 1 ? chapter.missions[missionIndex + 1]?.id : null;
      if (mission.unlocks !== expectedUnlock) warnings.push(`${mission.id} unlock chain differs from the canonical sequence.`);
    });
  });

  if (missions !== 180) warnings.push(`Canonical target is 180 missions; found ${missions}.`);
  return { valid: errors.length === 0, chapters: ALL_CHAPTERS.length, missions, bosses: bossIds.size, loreEntries: loreIds.size, errors, warnings };
}
