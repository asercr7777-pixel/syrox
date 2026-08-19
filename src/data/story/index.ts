export * from './types';
export * from './npcs';
export { STORY_CHAPTERS, STORY_CHAPTERS_EXPANSION } from './chapters';
export { ARC1_CHAPTERS_16_30 } from './arc1Chapters16to30';

import type { StoryChapter } from './types';
import { STORY_CHAPTERS, STORY_CHAPTERS_EXPANSION } from './chapters';
import { ARC1_CHAPTERS_16_30 } from './arc1Chapters16to30';

export const ALL_CHAPTERS: StoryChapter[] = [
  ...STORY_CHAPTERS,
  ...STORY_CHAPTERS_EXPANSION,
  ...ARC1_CHAPTERS_16_30,
];

export function getChapterById(id: string): StoryChapter | undefined {
  return ALL_CHAPTERS.find((chapter) => chapter.id === id);
}

export function getChapterByNumber(number: number): StoryChapter | undefined {
  return ALL_CHAPTERS.find((chapter) => chapter.number === number);
}

export function getTotalChapters(): number {
  return ALL_CHAPTERS.length;
}

export function getMissionById(id: string): import('./types').StoryMission | undefined {
  for (const chapter of ALL_CHAPTERS) {
    const mission = chapter.missions.find((item) => item.id === id);
    if (mission) return mission;
  }
  return undefined;
}
