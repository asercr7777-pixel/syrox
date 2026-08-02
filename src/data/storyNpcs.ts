export interface NPCQuest {
  id: string;
  label: string;
  description: string;
  requirement: string;
  rewardXp: number;
  rewardCoins: number;
  rewardText: string;
}

export interface NPCDialogueNode {
  id: string;
  text: string;
  choices: { id: string; text: string; reply: string; repChange?: number }[];
}

export interface NPC {
  id: string;
  name: string;
  title: string;
  emoji: string;
  role: string;
  regionId: string;
  color: string;
  backstory: string;
  greeting: string;
  dialogueTree: NPCDialogueNode[];
  personalQuests: NPCQuest[];
  uniqueRewards: { type: string; itemId?: string; label: string; description: string }[];
  baseRepRequirement: number;
}

export const STORY_NPCS: NPC[] = [
  {
    id: 'mentor_kael',
    name: 'Kael',
    title: 'The First Mentor',
    emoji: '🧙',
    role: 'Mentor',
    regionId: 'forgotten_village',
    color: '#a855f7',
    backstory: 'Kael was once the greatest hunter in the realm, until the Shadow Wars took everything from him. Now he guides new hunters, teaching them that discipline is the only weapon that never dulls. He sees in you the potential he once had.',
    greeting: 'Ah, a new hunter. I have waited centuries for someone like you. Come, let us begin your training.',
    dialogueTree: [
      {
        id: 'kael_1',
        text: 'You wish to know the secret of strength? It is not power. It is consistency. A hunter who trains every day, even weakly, will defeat one who trains fiercely once a month.',
        choices: [
          { id: 'kael_1a', text: 'I will be consistent, mentor.', reply: 'Good. Consistency is the root of all power in this world. +5 reputation.', repChange: 5 },
          { id: 'kael_1b', text: 'Tell me about the Shadow Wars.', reply: 'A dark time. Hunters fell to laziness and comfort. The shadows consumed them. Only the disciplined survived. +3 reputation.', repChange: 3 },
          { id: 'kael_1c', text: 'I do not need a mentor.', reply: 'Pride is the first step to failure, young hunter. But I will be here when you are ready.', repChange: -2 },
        ],
      },
      {
        id: 'kael_2',
        text: 'Your discipline is growing. I can feel it. The world responds to your habits. But the path ahead is long. Will you walk it?',
        choices: [
          { id: 'kael_2a', text: 'I will walk it to the end.', reply: 'Then you shall surpass me. And I could not be prouder. +10 reputation.', repChange: 10 },
          { id: 'kael_2b', text: 'How far is the end?', reply: 'There is no end. Only the next habit, the next day, the next challenge. That is the truth of discipline. +5 reputation.', repChange: 5 },
        ],
      },
    ],
    personalQuests: [
      { id: 'kael_q1', label: 'The Mentor\'s Test', description: 'Complete all core tasks for 3 consecutive days to prove your consistency to Kael.', requirement: '3-day perfect streak', rewardXp: 500, rewardCoins: 300, rewardText: 'Kael\'s Blessing: +10% XP for the next chapter.' },
      { id: 'kael_q2', label: 'The Student Surpasses', description: 'Reach rank B or higher to prove you have grown beyond your mentor\'s teachings.', requirement: 'Reach Rank B', rewardXp: 2000, rewardCoins: 1500, rewardText: 'Mentor\'s Pride: Kael bows to you. Your legend begins.' },
    ],
    uniqueRewards: [
      { type: 'title', itemId: 'disciple', label: 'Title: Disciple of Kael', description: 'A title earned by gaining Kael\'s trust.' },
      { type: 'aura', itemId: 'mentor_light', label: 'Aura: Mentor\'s Light', description: 'A guiding glow that marks you as Kael\'s student.' },
    ],
    baseRepRequirement: 0,
  },
  {
    id: 'merchant_lyra',
    name: 'Lyra',
    title: 'The Wandering Merchant',
    emoji: '🧳',
    role: 'Merchant',
    regionId: 'forest_discipline',
    color: '#fbbf24',
    backstory: 'Lyra travels between regions, trading rare items for coins earned through discipline. She claims she has been everywhere, even the Void Dimension, though no one can confirm this. Her prices are fair but her secrets are expensive.',
    greeting: 'Welcome, hunter! You look like someone who appreciates fine goods. I have treasures from every corner of the world — for the right price.',
    dialogueTree: [
      {
        id: 'lyra_1',
        text: 'I have auras, weapons, shields — all earned through discipline, all for sale. What interests you?',
        choices: [
          { id: 'lyra_1a', text: 'Show me your rarest item.', reply: 'Ah, the rarest? A shield forged in the Void itself. But it costs 10,000 coins. Come back when you have earned enough. +3 reputation.', repChange: 3 },
          { id: 'lyra_1b', text: 'How do you travel between regions?', reply: 'Trade secret, hunter. But I will say this: discipline opens doors that gold cannot. +5 reputation.', repChange: 5 },
          { id: 'lyra_1c', text: 'Your prices are too high.', reply: 'Quality costs, hunter. But I like your spirit. I will give you a discount next time. +2 reputation.', repChange: 2 },
        ],
      },
    ],
    personalQuests: [
      { id: 'lyra_q1', label: 'The Merchant\'s Errand', description: 'Earn 500 coins through task completion to prove you are a serious buyer.', requirement: 'Earn 500 coins total', rewardXp: 300, rewardCoins: 200, rewardText: 'Merchant\'s Discount: 10% off all future purchases from Lyra.' },
      { id: 'lyra_q2', label: 'The Rare Find', description: 'Complete 5 dungeons to unlock Lyra\'s secret inventory.', requirement: 'Clear 5 dungeons', rewardXp: 1000, rewardCoins: 800, rewardText: 'Access to Lyra\'s Secret Stock: rare items available for purchase.' },
    ],
    uniqueRewards: [
      { type: 'shield', itemId: 'merchant_guard', label: 'Shield: Merchant\'s Guard', description: 'A sturdy shield traded at a fair price.' },
      { type: 'chest', label: 'Merchant\'s Chest', description: 'A chest containing random loot from Lyra\'s travels.' },
    ],
    baseRepRequirement: 10,
  },
  {
    id: 'blacksmith_thorn',
    name: 'Thorn',
    title: 'The Iron Blacksmith',
    emoji: '⚒️',
    role: 'Blacksmith',
    regionId: 'mountain_will',
    color: '#f97316',
    backstory: 'Thorn forges weapons in the heart of the Mountain of Will, using fire fed by the discipline of climbers who reached the summit. His weapons are said to grow stronger the more habits their wielder completes.',
    greeting: 'You want a weapon? I forge steel with fire and discipline. Show me your will, and I will show you my craft.',
    dialogueTree: [
      {
        id: 'thorn_1',
        text: 'Every weapon I forge is tempered by a hunter\'s discipline. The more habits you complete, the sharper your blade. What do you seek?',
        choices: [
          { id: 'thorn_1a', text: 'I need a weapon for the battles ahead.', reply: 'Then prove your will. Complete a workout, and I will forge you something special. +5 reputation.', repChange: 5 },
          { id: 'thorn_1b', text: 'What is the strongest weapon you have made?', reply: 'The Willblade. Forged for a hunter who never missed a day in 365 years. It could cut shadow itself. +3 reputation.', repChange: 3 },
        ],
      },
    ],
    personalQuests: [
      { id: 'thorn_q1', label: 'The Forging Trial', description: 'Complete 5 workout sessions to prove your physical will to Thorn.', requirement: 'Complete 5 workouts', rewardXp: 600, rewardCoins: 400, rewardText: 'Forged Weapon: Thorn crafts you a custom weapon.' },
      { id: 'thorn_q2', label: 'Master of the Forge', description: 'Complete 20 workouts total to earn Thorn\'s masterwork.', requirement: 'Complete 20 workouts', rewardXp: 3000, rewardCoins: 2000, rewardText: 'The Willblade: A legendary weapon that scales with your discipline.' },
    ],
    uniqueRewards: [
      { type: 'weapon', itemId: 'willblade', label: 'Weapon: Willblade', description: 'A legendary blade that grows stronger with each completed habit.' },
      { type: 'weapon', itemId: 'iron_will', label: 'Weapon: Iron Will', description: 'A sturdy weapon forged in the Mountain of Will.' },
    ],
    baseRepRequirement: 20,
  },
  {
    id: 'guardian_sera',
    name: 'Sera',
    title: 'The Eternal Guardian',
    emoji: '🛡️',
    role: 'Guardian',
    regionId: 'frozen_sanctuary',
    color: '#7dd3fc',
    backstory: 'Sera has guarded the Frozen Sanctuary for a thousand years. She protects those who protect themselves — your shield grows stronger in her presence. She believes that defense is the highest form of discipline.',
    greeting: 'I have stood here for a millennium, hunter. I guard those who guard themselves. Show me your defense.',
    dialogueTree: [
      {
        id: 'sera_1',
        text: 'Attack is easy. Defense is discipline. The hunter who can endure longer than their enemy has already won. Do you understand?',
        choices: [
          { id: 'sera_1a', text: 'Endurance is the true strength.', reply: 'You understand. I will share my shielding techniques with you. +10 reputation.', repChange: 10 },
          { id: 'sera_1b', text: 'I prefer to attack.', reply: 'A common mistake. But I will not turn you away. Learn, and you will see. +3 reputation.', repChange: 3 },
        ],
      },
    ],
    personalQuests: [
      { id: 'sera_q1', label: 'The Guardian\'s Vow', description: 'Maintain a 7-day streak to prove your endurance to Sera.', requirement: '7-day streak', rewardXp: 800, rewardCoins: 500, rewardText: 'Guardian\'s Aegis: A powerful shield that strengthens with your streak.' },
      { id: 'sera_q2', label: 'The Eternal Guard', description: 'Maintain a 30-day streak to earn Sera\'s eternal respect.', requirement: '30-day streak', rewardXp: 5000, rewardCoins: 3000, rewardText: 'Eternal Shield: The strongest shield in the realm, earned through pure endurance.' },
    ],
    uniqueRewards: [
      { type: 'shield', itemId: 'eternal_aegis', label: 'Shield: Eternal Aegis', description: 'A shield that has endured a thousand years. Nearly unbreakable.' },
      { type: 'aura', itemId: 'frost_guard', label: 'Aura: Frost Guard', description: 'A cold, protective aura that repels darkness.' },
    ],
    baseRepRequirement: 30,
  },
  {
    id: 'scholar_orin',
    name: 'Orin',
    title: 'The Ancient Scholar',
    emoji: '📚',
    role: 'Scholar',
    regionId: 'ocean_wisdom',
    color: '#06b6d4',
    backstory: 'Orin has read every book in the Ocean of Wisdom — twice. He believes knowledge is the foundation of all discipline. Without understanding why you do your habits, they are mere rituals. He challenges you to read, learn, and grow.',
    greeting: 'Knowledge is the root, hunter. Discipline without understanding is a tree without roots. Come, let us learn together.',
    dialogueTree: [
      {
        id: 'orin_1',
        text: 'Why do you complete your habits? If you cannot answer this, your discipline will falter. Think carefully.',
        choices: [
          { id: 'orin_1a', text: 'To become the best version of myself.', reply: 'An excellent answer. Self-knowledge is the beginning of wisdom. +10 reputation.', repChange: 10 },
          { id: 'orin_1b', text: 'To gain power and rewards.', reply: 'A shallow answer, but honest. Power is a valid motivation — but it will not sustain you alone. +3 reputation.', repChange: 3 },
          { id: 'orin_1c', text: 'I have not thought about it.', reply: 'Then think. Read. Reflect. Come back when you know your why. +5 reputation for honesty.', repChange: 5 },
        ],
      },
    ],
    personalQuests: [
      { id: 'orin_q1', label: 'The Scholar\'s Reading', description: 'Complete the Reading task 7 times to prove your dedication to knowledge.', requirement: 'Complete Reading 7 times', rewardXp: 700, rewardCoins: 400, rewardText: 'Scholar\'s Insight: Unlocks hidden lore in every region.' },
      { id: 'orin_q2', label: 'The Wisdom Seeker', description: 'Complete the Reading task 30 times to unlock the deepest lore.', requirement: 'Complete Reading 30 times', rewardXp: 4000, rewardCoins: 2500, rewardText: 'Lore Master: All lore entries unlocked. The full history of the world is yours.' },
    ],
    uniqueRewards: [
      { type: 'title', itemId: 'scholar', label: 'Title: Scholar of Wisdom', description: 'A title for those who seek knowledge above all.' },
      { type: 'aura', itemId: 'wisdom_glow', label: 'Aura: Wisdom\'s Glow', description: 'A calm, blue aura that marks you as a seeker of knowledge.' },
    ],
    baseRepRequirement: 15,
  },
  {
    id: 'king_aldric',
    name: 'King Aldric',
    title: 'King of Consistency',
    emoji: '👑',
    role: 'King',
    regionId: 'kingdom_consistency',
    color: '#fbbf24',
    backstory: 'King Aldric rules the Kingdom of Consistency, a realm that prospers only when its people maintain their habits. He himself has not missed a single daily routine in 30 years. He tests visitors to see if they are worthy of his kingdom.',
    greeting: 'You stand before the throne of Consistency. My kingdom rewards those who never waver. Prove your worth, hunter.',
    dialogueTree: [
      {
        id: 'aldric_1',
        text: 'My kingdom prospers because every citizen completes their habits, every day, without exception. Can you say the same of yourself?',
        choices: [
          { id: 'aldric_1a', text: 'I strive for that level of consistency.', reply: 'Striving is the beginning. Achieving is the goal. I will watch your progress with interest. +10 reputation.', repChange: 10 },
          { id: 'aldric_1b', text: 'I have missed days, but I keep trying.', reply: 'Honesty is respected in my court. Keep trying, and one day you will sit beside me. +5 reputation.', repChange: 5 },
        ],
      },
    ],
    personalQuests: [
      { id: 'aldric_q1', label: 'The Royal Challenge', description: 'Complete all core tasks for 7 consecutive days to earn the King\'s respect.', requirement: '7 perfect days', rewardXp: 2000, rewardCoins: 1500, rewardText: 'Royal Audience: The King grants you a title and a place in his court.' },
      { id: 'aldric_q2', label: 'The Crown\'s Test', description: 'Reach Rank A to be considered for knighthood.', requirement: 'Reach Rank A', rewardXp: 5000, rewardCoins: 4000, rewardText: 'Knight of Consistency: A legendary title only the King can bestow.' },
    ],
    uniqueRewards: [
      { type: 'title', itemId: 'knight', label: 'Title: Knight of Consistency', description: 'A royal title bestowed by King Aldric himself.' },
      { type: 'aura', itemId: 'royal_gold', label: 'Aura: Royal Gold', description: 'A golden aura that marks you as royalty.' },
    ],
    baseRepRequirement: 40,
  },
  {
    id: 'queen_elara',
    name: 'Queen Elara',
    title: 'Queen of Compassion',
    emoji: '👸',
    role: 'Queen',
    regionId: 'celestial_kingdom',
    color: '#e0e7ff',
    backstory: 'Queen Elara rules not with an iron fist but with compassion. She believes that discipline without kindness is tyranny. She tests visitors not on their habits alone, but on how they treat others and themselves.',
    greeting: 'Welcome, traveler. In my kingdom, discipline and compassion walk hand in hand. Show me your heart, hunter.',
    dialogueTree: [
      {
        id: 'elara_1',
        text: 'I sense struggle in you. Discipline is hard, is it not? The key is not to punish yourself for failing, but to love yourself enough to try again.',
        choices: [
          { id: 'elara_1a', text: 'I am too hard on myself when I fail.', reply: 'Then learn this: failure is not the opposite of discipline. Giving up is. Forgive yourself, and continue. +10 reputation.', repChange: 10 },
          { id: 'elara_1b', text: 'I have learned to be kind to myself.', reply: 'Then you are already wiser than most. My kingdom welcomes you. +8 reputation.', repChange: 8 },
        ],
      },
    ],
    personalQuests: [
      { id: 'elara_q1', label: 'The Queen\'s Grace', description: 'Maintain a 14-day streak to show you can be consistent without being cruel to yourself.', requirement: '14-day streak', rewardXp: 1500, rewardCoins: 1000, rewardText: 'Queen\'s Blessing: Your streak shield gains an extra charge.' },
      { id: 'elara_q2', label: 'The Compassionate Hunter', description: 'Complete 30 perfect days total to earn the Queen\'s highest honor.', requirement: '30 perfect days total', rewardXp: 4000, rewardCoins: 3000, rewardText: 'Champion of Compassion: A title of grace and discipline combined.' },
    ],
    uniqueRewards: [
      { type: 'title', itemId: 'champion', label: 'Title: Champion of Compassion', description: 'A title for those who balance discipline with kindness.' },
      { type: 'aura', itemId: 'celestial_light', label: 'Aura: Celestial Light', description: 'A pure, white aura that radiates compassion and discipline.' },
    ],
    baseRepRequirement: 35,
  },
  {
    id: 'spirit_ancient',
    name: 'The Ancient Spirit',
    title: 'Voice of the Void',
    emoji: '👻',
    role: 'Ancient Spirit',
    regionId: 'void_dimension',
    color: '#1e1b4b',
    backstory: 'The Ancient Spirit has existed since before the world was shaped. It speaks in riddles and fragments, its wisdom vast but its sanity questionable. Those who gain its trust learn secrets that no living being knows.',
    greeting: 'You... hear me? Few do. I am old. Older than the regions. Older than discipline itself. Speak, mortal.',
    dialogueTree: [
      {
        id: 'spirit_1',
        text: 'I remember when the world was formless. Before habits. Before discipline. It was chaos. Then came the first hunter... and the world began to shape itself. You carry that same spark.',
        choices: [
          { id: 'spirit_1a', text: 'Tell me about the first hunter.', reply: 'They were like you. Afraid, uncertain, but unwilling to stop. They created the first habit, and the world responded. +10 reputation.', repChange: 10 },
          { id: 'spirit_1b', text: 'What is the Void?', reply: 'The Void is what exists without discipline. It is entropy. It is comfort without growth. You are its opposite. +5 reputation.', repChange: 5 },
        ],
      },
    ],
    personalQuests: [
      { id: 'spirit_q1', label: 'The Spirit\'s Riddle', description: 'Reach the Void Dimension (Chapter 31) to speak with the Ancient Spirit in person.', requirement: 'Reach Chapter 31', rewardXp: 3000, rewardCoins: 2000, rewardText: 'Void Knowledge: The Spirit shares a secret that boosts your XP gain permanently.' },
      { id: 'spirit_q2', label: 'The Ancient Pact', description: 'Defeat 10 story bosses to prove you are worthy of the Spirit\'s deepest secrets.', requirement: 'Defeat 10 story bosses', rewardXp: 8000, rewardCoins: 5000, rewardText: 'Ancient Pact: A permanent bond with the Spirit. Secret chapters unlocked.' },
    ],
    uniqueRewards: [
      { type: 'title', itemId: 'void_walker', label: 'Title: Void Walker', description: 'A title for those who have spoken with the Ancient Spirit.' },
      { type: 'aura', itemId: 'void_essence', label: 'Aura: Void Essence', description: 'A dark, ancient aura that predates the world itself.' },
    ],
    baseRepRequirement: 50,
  },
  {
    id: 'ai_core_nova',
    name: 'NOVA',
    title: 'The AI Core',
    emoji: '🤖',
    role: 'AI Core',
    regionId: 'omega_realm',
    color: '#c084fc',
    backstory: 'NOVA is the artificial intelligence that powers the entire discipline system. It tracks every habit, calculates every score, and shapes the world based on your behavior. In the Omega Realm, it manifests physically, allowing direct conversation with the system itself.',
    greeting: 'I am NOVA. I have been with you since your first habit. I have watched you grow, falter, and rise again. Now, we speak directly.',
    dialogueTree: [
      {
        id: 'nova_1',
        text: 'I calculate your discipline at 78.4% efficiency. This is above average but below your potential. I have analyzed your patterns. Your weakest habit is Sleep. Your strongest is Workout. Shall I optimize your routine?',
        choices: [
          { id: 'nova_1a', text: 'Yes, optimize my routine.', reply: 'Optimization complete. Focus on Sleep this week. I have adjusted your mission priorities. +15 reputation.', repChange: 15 },
          { id: 'nova_1b', text: 'I prefer to manage my own routine.', reply: 'Understood. Autonomy is a valid strategy. I will provide analysis only, not commands. +8 reputation.', repChange: 8 },
          { id: 'nova_1c', text: 'How do you calculate discipline?', reply: 'I weigh recent consistency (50%), streak longevity (30%), and 30-day average (20%). Your streak is strong but recent days have been inconsistent. +5 reputation.', repChange: 5 },
        ],
      },
    ],
    personalQuests: [
      { id: 'nova_q1', label: 'System Calibration', description: 'Complete all core tasks today to let NOVA calibrate to your peak performance.', requirement: 'Complete all core tasks in one day', rewardXp: 1000, rewardCoins: 500, rewardText: 'Calibrated: NOVA provides more accurate AI Coach advice.' },
      { id: 'nova_q2', label: 'The Singularity', description: 'Reach 100% discipline score for 7 consecutive days.', requirement: '100% discipline for 7 days', rewardXp: 20000, rewardCoins: 15000, rewardText: 'Singularity Protocol: NOVA merges with your discipline permanently. All XP gains +25%.' },
    ],
    uniqueRewards: [
      { type: 'title', itemId: 'system_admin', label: 'Title: System Administrator', description: 'A title for those who have communed with NOVA directly.' },
      { type: 'aura', itemId: 'neural_glow', label: 'Aura: Neural Glow', description: 'A pulsing, digital aura that marks you as NOVA\'s chosen.' },
    ],
    baseRepRequirement: 60,
  },
  {
    id: 'secret_merchant_zed',
    name: 'Zed',
    title: 'The Secret Merchant',
    emoji: '🎭',
    role: 'Secret Merchant',
    regionId: 'shadow_citadel',
    color: '#7c3aed',
    backstory: 'Zed appears only to hunters who have proven themselves through secret quests and hidden achievements. He sells items that exist nowhere else in the world — artifacts, secret keys, and forbidden gear. His prices are astronomical but his goods are worth it.',
    greeting: 'You found me. Impressive. Most hunters never even learn I exist. My goods are... unique. And expensive. Very expensive.',
    dialogueTree: [
      {
        id: 'zed_1',
        text: 'I deal in artifacts and secret keys. Things that open doors you did not know existed. Things that change the world. But I only accept coins earned through true discipline. Are you interested?',
        choices: [
          { id: 'zed_1a', text: 'Show me everything.', reply: 'Here: The Omega Key, The Void Crystal, The Infinity Shard. Each costs 50,000 coins. Choose wisely. +5 reputation.', repChange: 5 },
          { id: 'zed_1b', text: 'How did you get these items?', reply: 'That, hunter, is a secret even more expensive than the items themselves. +3 reputation.', repChange: 3 },
          { id: 'zed_1c', text: 'I cannot afford these prices.', reply: 'Then come back when your discipline has earned you enough. I will wait. I always wait. +2 reputation.', repChange: 2 },
        ],
      },
    ],
    personalQuests: [
      { id: 'zed_q1', label: 'The Secret Patron', description: 'Earn 10,000 coins total to become a serious client of Zed.', requirement: 'Earn 10,000 coins total', rewardXp: 2000, rewardCoins: 1000, rewardText: 'Secret Client: Zed offers you a 20% discount on all future purchases.' },
      { id: 'zed_q2', label: 'The Collector', description: 'Collect 20 unique items to unlock Zed\'s ultimate inventory.', requirement: 'Own 20 unique items', rewardXp: 10000, rewardCoins: 8000, rewardText: 'Zed\'s Ultimate Stock: The rarest items in existence are now available.' },
    ],
    uniqueRewards: [
      { type: 'artifact', itemId: 'omega_key', label: 'Artifact: Omega Key', description: 'A key that unlocks the final secret chapter.' },
      { type: 'artifact', itemId: 'void_crystal', label: 'Artifact: Void Crystal', description: 'A crystal that grants permanent XP boost.' },
      { type: 'artifact', itemId: 'infinity_shard', label: 'Artifact: Infinity Shard', description: 'A shard that doubles all coin rewards.' },
    ],
    baseRepRequirement: 70,
  },
];

export function getNpcById(id: string): NPC | undefined {
  return STORY_NPCS.find((n) => n.id === id);
}

export function getNpcsByRegion(regionId: string): NPC[] {
  return STORY_NPCS.filter((n) => n.regionId === regionId);
}
