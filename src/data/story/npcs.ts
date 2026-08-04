import type { StoryNPC } from './types';

export const STORY_NPCS: StoryNPC[] = [
  {
    id: 'npc_shadow',
    name: 'Shadow',
    role: 'mentor',
    personality: 'Mysterious, wise, patient. Speaks in measured tones with hidden warmth.',
    backstory: 'A remnant of the old world, Shadow survived the collapse by binding himself to the System. He guides those who seek to restore discipline.',
    voice: 'mentor',
    chapter: 1,
    dialogue: [
      { emotion: 'mysterious', text: 'You are not the first to awaken here. But you may be the last hope this world has.' },
      { emotion: 'serious', text: 'Discipline is not punishment. It is freedom — the freedom to become who you were meant to be.' },
      { emotion: 'happy', text: 'I see fire in you. Good. You will need it where we are going.' },
    ],
  },
  {
    id: 'npc_kael',
    name: 'Kael the Merchant',
    role: 'merchant',
    personality: 'Shrewd but fair. Values hard work over coin. Always has a deal for the disciplined.',
    backstory: 'Once a wealthy trader, Kael lost everything in the collapse. Now he trades knowledge and items to those who prove their worth.',
    voice: 'merchant',
    chapter: 2,
    dialogue: [
      { emotion: 'neutral', text: 'Coin is easy to spend, hard to earn. Discipline? The opposite. Hard to build, easy to lose.' },
      { emotion: 'happy', text: 'You have been consistent. That is worth more than gold in these times.' },
      { emotion: 'excited', text: 'I have something special for you today. Consider it an investment in your future.' },
    ],
  },
  {
    id: 'npc_lyra',
    name: 'Lyra the Warrior',
    role: 'warrior',
    personality: 'Fierce, direct, honorable. Respects action over words.',
    backstory: 'A former soldier who fought the darkness alone for years. She now trains those willing to fight back.',
    voice: 'warrior',
    chapter: 3,
    dialogue: [
      { emotion: 'serious', text: 'Talk is cheap. Show me your discipline, and I will show you how to fight.' },
      { emotion: 'excited', text: 'You completed every task today? Now THAT is a warrior I can respect.' },
      { emotion: 'angry', text: 'Laziness killed more people than any monster. Do not become another casualty.' },
    ],
  },
  {
    id: 'npc_oren',
    name: 'Oren the Survivor',
    role: 'survivor',
    personality: 'Cautious, grateful, quietly brave. Has seen too much but still hopes.',
    backstory: 'Trapped in the Shadow District for months, Oren survived on scraps and sheer willpower before being found.',
    voice: 'survivor',
    chapter: 4,
    dialogue: [
      { emotion: 'sad', text: 'I thought I was the last one. Seeing you here... it gives me hope again.' },
      { emotion: 'happy', text: 'You actually came back. Most people make promises and disappear. You are different.' },
      { emotion: 'fear', text: 'The Tower... something lives at the top. Something that feeds on temptation. Be careful.' },
    ],
  },
  {
    id: 'npc_malakai',
    name: 'Malakai the Corrupted',
    role: 'corrupted',
    personality: 'Bitter, seductive, dangerous. Tries to pull others into darkness.',
    backstory: 'A once-great scholar who surrendered to indiscipline. Now he spreads temptation to others.',
    voice: 'corrupted',
    chapter: 5,
    dialogue: [
      { emotion: 'neutral', text: 'Why struggle? Rest. Relax. The world is ending anyway — why not enjoy it?' },
      { emotion: 'angry', text: 'You think your little habits will save you? I was like you once. It changes nothing.' },
      { emotion: 'mysterious', text: 'I can give you power without effort. All you have to do... is stop trying.' },
    ],
  },
  {
    id: 'npc_sage',
    name: 'The Ancient Guardian',
    role: 'guardian',
    personality: 'Ancient, powerful, solemn. Speaks in riddles and truths.',
    backstory: 'A guardian of the World Core, the last bastion of light. Has watched over the world since before the collapse.',
    voice: 'guardian',
    chapter: 10,
    dialogue: [
      { emotion: 'serious', text: 'You have walked far, child of discipline. But the final path is the hardest.' },
      { emotion: 'mysterious', text: 'The world was not destroyed by one great evil. It was destroyed by a million small surrenders.' },
      { emotion: 'excited', text: 'You have proven yourself worthy. The World Core recognizes you. Go — restore what was lost.' },
    ],
  },
];

export function getNPCById(id: string): StoryNPC | undefined {
  return STORY_NPCS.find((n) => n.id === id);
}

export function getNPCsByChapter(chapter: number): StoryNPC[] {
  return STORY_NPCS.filter((n) => n.chapter === chapter);
}
