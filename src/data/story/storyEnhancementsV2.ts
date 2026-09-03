import type { StoryChapter, StoryMission } from './types';

const MISSION_LABELS: Record<StoryMission['type'], string> = {
  workout: 'TRAIN',
  pray: 'PRAY',
  water: 'DRINK WATER',
  sleep: 'SLEEP',
  read_quran: 'READ QURAN',
  read_book: 'READ QURAN',
  streak: 'KEEP STREAK',
  dungeon: 'CLEAR DUNGEON',
  tasks: 'COMPLETE TASKS',
  discipline_score: 'REACH SCORE',
};

const MISSION_ACTIONS: Record<StoryMission['type'], string> = {
  workout: 'Finish today’s workout.',
  pray: 'Complete your prayer.',
  water: 'Drink the required water.',
  sleep: 'Get enough sleep.',
  read_quran: 'Read today’s Quran pages.',
  read_book: 'Read today’s Quran pages.',
  streak: 'Keep your streak alive.',
  dungeon: 'Clear the required dungeon.',
  tasks: 'Complete the required tasks.',
  discipline_score: 'Reach the required score.',
};

/**
 * Keeps the existing cinematic story, but makes every objective a clean,
 * one-line gameplay task. No extra mission narration is injected here.
 */
export function directStory(chapters: StoryChapter[]): StoryChapter[] {
  return chapters.map((chapter) => ({
    ...chapter,
    missions: chapter.missions.map((mission) => ({
      ...mission,
      type: mission.type === 'read_book' ? 'read_quran' : mission.type,
      title: MISSION_LABELS[mission.type],
      description: MISSION_ACTIONS[mission.type],
      choices: mission.choices?.map((choice) => ({ ...choice })),
    })),
  }));
}
