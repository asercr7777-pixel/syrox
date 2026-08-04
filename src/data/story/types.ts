export type Emotion = 'neutral' | 'happy' | 'serious' | 'excited' | 'mysterious' | 'angry' | 'sad' | 'fear';

export type VoiceProfile =
  | 'narrator'
  | 'mentor'
  | 'merchant'
  | 'warrior'
  | 'survivor'
  | 'corrupted'
  | 'guardian'
  | 'boss'
  | 'player';

export interface DialogueLine {
  speaker: string;
  voice: VoiceProfile;
  text: string;
  emotion?: Emotion;
  sfx?: string;
}

export interface StoryChoice {
  id: string;
  label: string;
  consequence: string;
  reward?: { type: 'coins' | 'xp' | 'title' | 'lore' | 'achievement'; value: string | number };
}

export interface StoryMission {
  id: string;
  chapterId: string;
  title: string;
  description: string;
  type: 'workout' | 'pray' | 'water' | 'sleep' | 'read_quran' | 'read_book' | 'streak' | 'dungeon' | 'tasks' | 'discipline_score';
  target: number;
  xpReward: number;
  coinReward: number;
  cutsceneBefore: DialogueLine[];
  cutsceneAfter: DialogueLine[];
  choices?: StoryChoice[];
  unlocks?: string | null;
}

export interface StoryBoss {
  id: string;
  name: string;
  title: string;
  emoji: string;
  description: string;
  hp: number;
  dialogue: DialogueLine[];
  defeatDialogue: DialogueLine[];
  xpReward: number;
  coinReward: number;
  rewardTitle?: string;
  rewardLore?: string;
}

export interface StoryChapter {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  emoji: string;
  bgGradient: string;
  musicTheme: string;
  description: string;
  introCutscene: DialogueLine[];
  missions: StoryMission[];
  boss: StoryBoss;
  region: { name: string; x: number; y: number };
}

export interface StoryNPC {
  id: string;
  name: string;
  role: 'mentor' | 'merchant' | 'warrior' | 'survivor' | 'corrupted' | 'guardian';
  personality: string;
  backstory: string;
  voice: VoiceProfile;
  dialogue: { emotion: Emotion; text: string }[];
  chapter: number;
}
