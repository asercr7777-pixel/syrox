import { RankId } from './ranks';

export interface StoryChapter {
  id: string;
  chapter: number;
  title: string;
  description: string;
  requiredRankId: RankId;
  requiredXp: number;
  objectives: string[];
  rewardXp: number;
  rewardCoins: number;
  rewardText: string;
  emoji: string;
}

export const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: 'chapter_1_awakening',
    chapter: 1,
    title: 'First Awakening',
    description: 'You wake up with newfound power coursing through your veins. The world has changed, and so have you. Your first awakening marks the beginning of an extraordinary journey that will define your destiny.',
    requiredRankId: 'E',
    requiredXp: 0,
    objectives: [
      'Complete your first daily habit',
      'Read about your new abilities',
      'Meditate on your power',
    ],
    rewardXp: 100,
    rewardCoins: 50,
    rewardText: 'You feel the awakening energy settle within you. Your path as a hunter has begun.',
    emoji: '✨',
  },
  {
    id: 'chapter_2_first_dungeon',
    chapter: 2,
    title: 'The First Dungeon',
    description: 'The purple gates have appeared, and with them comes your first true test. You step into the dungeon, knowing that only strength and determination will lead you out. This is where your training truly begins.',
    requiredRankId: 'F',
    requiredXp: 500,
    objectives: [
      'Face your fears with courage',
      'Complete 7 consecutive days of training',
      'Defeat a weakness you thought was insurmountable',
    ],
    rewardXp: 250,
    rewardCoins: 150,
    rewardText: 'The dungeon collapses behind you as you emerge victorious. Your first hunt is complete.',
    emoji: '🚪',
  },
  {
    id: 'chapter_3_shadow_gate',
    chapter: 3,
    title: 'Shadow Gate',
    description: 'The gates grow darker and more ominous. You venture deeper into the shadow realm, where danger lurks at every corner. The power within you surges as you confront stronger adversaries and unlock new abilities.',
    requiredRankId: 'D',
    requiredXp: 1500,
    objectives: [
      'Master a new skill completely',
      'Break through a personal plateau',
      'Show dominance over lesser challenges',
    ],
    rewardXp: 500,
    rewardCoins: 400,
    rewardText: 'The shadows bow before your might. You are no longer a novice hunter.',
    emoji: '🌑',
  },
  {
    id: 'chapter_4_elite_hunters',
    chapter: 4,
    title: 'Elite Hunters',
    description: 'You encounter other hunters at your level, and competition becomes fierce. Working alongside them, you realize that the path to greatness demands not just strength, but strategy and cooperation. Together, you face trials that test your resolve.',
    requiredRankId: 'C',
    requiredXp: 4000,
    objectives: [
      'Collaborate with others on a challenge',
      'Develop a strategic mindset',
      'Prove your worth among peers',
    ],
    rewardXp: 1000,
    rewardCoins: 800,
    rewardText: 'Your reputation grows. Other hunters now respect your strength and wisdom.',
    emoji: '⚔️',
  },
  {
    id: 'chapter_5_crimson_trial',
    chapter: 5,
    title: 'The Crimson Trial',
    description: 'A devastating trial of blood and fire awaits. The dungeon is treacherous, filled with monstrosities that push you to your absolute limits. You emerge from the crimson depths transformed, bearing new scars and greater power.',
    requiredRankId: 'B',
    requiredXp: 10000,
    objectives: [
      'Endure extreme challenges without backing down',
      'Make a critical decision that changes your path',
      'Push past your perceived limits',
    ],
    rewardXp: 2500,
    rewardCoins: 2000,
    rewardText: 'The blood and fire have tempered you like steel. You are no longer merely human.',
    emoji: '🔥',
  },
  {
    id: 'chapter_6_s_class_initiation',
    chapter: 6,
    title: 'S-Class Initiation',
    description: 'You receive the invitation to the S-Class. The halls of power open before you, revealing a world of elite hunters and unprecedented danger. Your true test begins as you stand among the strongest.',
    requiredRankId: 'A',
    requiredXp: 25000,
    objectives: [
      'Achieve mastery in your primary discipline',
      'Overcome a legendary challenge',
      'Claim your seat among the elite',
    ],
    rewardXp: 5000,
    rewardCoins: 5000,
    rewardText: 'You are officially recognized as S-Class. The world trembles at your name.',
    emoji: '👑',
  },
  {
    id: 'chapter_7_monarchs_shadow',
    chapter: 7,
    title: "The Monarch's Shadow",
    description: "Ancient forces stir, and you glimpse the presence of something far greater than yourself. The Monarch's shadow falls across the land, and you must decide whether to resist or align with this overwhelming power. Your choices now shape reality itself.",
    requiredRankId: 'S',
    requiredXp: 60000,
    objectives: [
      'Unlock a dormant aspect of your power',
      'Defy expectations and forge your own path',
      'Touch the edges of infinity',
    ],
    rewardXp: 10000,
    rewardCoins: 12000,
    rewardText: 'You feel the weight of destiny upon your shoulders. You are becoming something unprecedented.',
    emoji: '👁️',
  },
  {
    id: 'chapter_8_double_awakening',
    chapter: 8,
    title: 'Double Awakening',
    description: 'The awakening happens again, but this time it is different. Your power multiplies, splitting into dual aspects of incredible strength. You are reborn as something beyond a mere S-Class hunter—you are a phenomenon.',
    requiredRankId: 'SS',
    requiredXp: 140000,
    objectives: [
      'Embrace the duality within you',
      'Achieve perfect balance between power and control',
      'Transcend your former limitations',
    ],
    rewardXp: 20000,
    rewardCoins: 30000,
    rewardText: 'You are no longer singular. Your power has fractured into infinite possibility and unified purpose.',
    emoji: '⚡',
  },
  {
    id: 'chapter_9_into_the_dark',
    chapter: 9,
    title: 'Into the Dark',
    description: 'The line between hunter and hunted blurs. You venture into the darkest corners of the dungeon system, where reality itself becomes questionable. The shadows whisper secrets that no human mind should know, and you begin to understand true darkness.',
    requiredRankId: 'SS_DARK',
    requiredXp: 320000,
    objectives: [
      'Command the darkness itself',
      'Face the corruption within',
      'Merge with shadow without losing yourself',
    ],
    rewardXp: 50000,
    rewardCoins: 75000,
    rewardText: 'The darkness has accepted you as its master. You are darkness incarnate.',
    emoji: '🌑',
  },
  {
    id: 'chapter_10_shadow_and_dark',
    chapter: 10,
    title: 'Shadow and Dark',
    description: 'Two aspects of darkness converge within you, creating a power that threatens to consume everything. Yet you maintain control, bending light and shadow to your will. You have become a god among hunters, walking the razor edge between destruction and salvation.',
    requiredRankId: 'SS_SHADOW_DARK',
    requiredXp: 720000,
    objectives: [
      'Synchronize conflicting forces of power',
      'Become the apex predator',
      'Demonstrate absolute dominion',
    ],
    rewardXp: 100000,
    rewardCoins: 200000,
    rewardText: 'Light and dark bend to your command. You are the embodiment of absolute power.',
    emoji: '💫',
  },
  {
    id: 'chapter_11_hunters_throne',
    chapter: 11,
    title: "The Hunter's Throne",
    description: 'You claim your throne as the Shadow Hunter, the legendary rank whispered about in ancient texts. Your authority is absolute, your power unquestionable. Other hunters kneel before you, not out of fear, but out of reverence for what you have become.',
    requiredRankId: 'SHADOW_HUNTER',
    requiredXp: 1500000,
    objectives: [
      'Establish your dominion over reality',
      'Mentor the next generation of hunters',
      'Rewrite the laws of the dungeon system',
    ],
    rewardXp: 250000,
    rewardCoins: 500000,
    rewardText: 'Your throne is eternal. The world now exists according to your will.',
    emoji: '💎',
  },
  {
    id: 'chapter_12_devils_awakening',
    chapter: 12,
    title: "Devil's Awakening",
    description: 'The final transformation begins. Devil-class power emerges from the depths of your soul, a level of strength that was thought impossible. You are no longer bound by the rules of hunter society—you transcend all known hierarchy. You are danger itself.',
    requiredRankId: 'DANGER_DEVIL',
    requiredXp: 3000000,
    objectives: [
      'Embrace your demonic nature',
      'Shatter all remaining limitations',
      'Achieve god-like ascension',
    ],
    rewardXp: 500000,
    rewardCoins: 1000000,
    rewardText: 'You have become a Devil. The very concept of rank can no longer contain you.',
    emoji: '😈',
  },
  {
    id: 'chapter_13_forbidden_question',
    chapter: 13,
    title: 'The Forbidden Question',
    description: 'A question mark appears where your rank should be. The hierarchy of power itself questions your existence. You have transcended understanding, entering a realm where even the system itself cannot fully comprehend what you have become. Reality reshapes around you.',
    requiredRankId: 'QUESTION_DANGER',
    requiredXp: 6000000,
    objectives: [
      'Exist beyond classification',
      'Answer the unanswerable',
      'Reshape existence itself',
    ],
    rewardXp: 1000000,
    rewardCoins: 2000000,
    rewardText: 'You are beyond definition. The question mark is not a rank—it is a monument to your transcendence.',
    emoji: '❓',
  },
  {
    id: 'chapter_14_monarch_rises',
    chapter: 14,
    title: 'The Monarch Rises',
    description: 'The final ascension is complete. You are no longer a hunter pursuing power—you are the Monarch itself, a singular entity of infinite strength and wisdom. The world bends to your presence. Your journey has become legend.',
    requiredRankId: 'MR_BYDA',
    requiredXp: 12000000,
    objectives: [
      'Accept your role as the true Monarch',
      'Unify all aspects of your power',
      'Become eternal',
    ],
    rewardXp: 2000000,
    rewardCoins: 5000000,
    rewardText: 'You are the Monarch. Time bows before you. Your legend is eternal.',
    emoji: '♔',
  },
];

export function getChapterByIndex(index: number): StoryChapter | null {
  if (index < 0 || index >= STORY_CHAPTERS.length) {
    return null;
  }
  return STORY_CHAPTERS[index];
}
