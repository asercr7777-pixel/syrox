import type { StoryChapter, StoryMission } from './types';

const ARC_THEMES = [
  'awakening', 'signal', 'consequence', 'memory', 'seals', 'control',
  'judgment', 'debt', 'obedience', 'truth', 'reflection', 'identity',
  'memory', 'resistance', 'truth', 'war', 'alliances', 'hope',
  'threshold', 'choice', 'machine', 'patterns', 'submission', 'origin',
  'identity', 'history', 'freedom', 'independence', 'consequence', 'choice',
] as const;

const MISSION_BEATS = [
  ['Scout', 'Find the first crack in the lie.'],
  ['Signal', 'Turn a small action into proof that you are still in control.'],
  ['Vow', 'Keep the promise when the easier option is available.'],
  ['Trial', 'Strengthen yourself before the next confrontation.'],
  ['Reveal', 'Recover one piece of the hidden record.'],
  ['Decision', 'Choose what you will protect when the path becomes unclear.'],
] as const;

const BOSS_STAGES = ['Read the pattern.', 'Break the pattern.', 'Make the choice.'];

function enrichMission(mission: StoryMission, chapter: StoryChapter, index: number): StoryMission {
  const [beat, instruction] = MISSION_BEATS[index];
  const theme = ARC_THEMES[chapter.number - 1] ?? 'choice';
  const target = mission.type === 'tasks' ? Math.max(2, Math.min(5, mission.target)) : mission.target;
  return {
    ...mission,
    target,
    title: `${beat} · ${mission.title}`,
    description: `${instruction} ${mission.description}`,
    cutsceneBefore: [
      ...mission.cutsceneBefore,
      { speaker: 'Shadow', voice: 'mentor', text: `This chapter is about ${theme}. Do not chase perfection. Prove that you can act on purpose.`, emotion: 'mysterious' },
    ],
    cutsceneAfter: [
      ...mission.cutsceneAfter,
      { speaker: 'Narrator', voice: 'narrator', text: `The record marks this as a ${theme} decision. One action is now part of the story.`, emotion: 'neutral' },
    ],
  };
}

export function enhanceStoryChapters(chapters: StoryChapter[]): StoryChapter[] {
  return chapters.map((chapter) => ({
    ...chapter,
    description: `${chapter.description} Every mission now advances a distinct narrative beat instead of functioning as a disconnected checklist.`,
    missions: chapter.missions.map((mission, index) => enrichMission(mission, chapter, index)),
    boss: {
      ...chapter.boss,
      dialogue: [
        ...chapter.boss.dialogue,
        ...BOSS_STAGES.map((stage, index) => ({
          speaker: 'Boss',
          voice: 'boss' as const,
          text: `${stage} Phase ${index + 1}: your habits have become predictable.`,
          emotion: index === 2 ? 'angry' as const : 'serious' as const,
        })),
      ],
      defeatDialogue: [
        ...chapter.boss.defeatDialogue,
        { speaker: 'Shadow', voice: 'mentor', text: `The ${chapter.boss.name} is defeated. But the pattern it exposed is still yours to change.`, emotion: 'mysterious' },
      ],
    },
  }));
}
