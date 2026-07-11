export interface Boss {
  id: string;
  name: string;
  emoji: string;
  title: string;
  hp: number;
  rankRequired: string;
  description: string;
  attacks: Array<{
    name: string;
    damage: number;
    description: string;
  }>;
  rewards: {
    xp: number;
    coins: number;
    weaponId?: string;
    auraId?: string;
    titleId?: string;
  };
  weakness: string;
}

export const BOSSES: Boss[] = [
  {
    id: 'goblin_king',
    name: 'Goblin King',
    emoji: '👑',
    title: 'King of the Goblins',
    hp: 300,
    rankRequired: 'E',
    description: 'A mischievous goblin ruler who leads a small band of troublemakers. Defeat him by staying focused on your daily tasks.',
    attacks: [
      {
        name: 'Goblin Slash',
        damage: 25,
        description: 'A wild slash with a rusty blade',
      },
      {
        name: 'Distracting Screech',
        damage: 15,
        description: 'An ear-piercing shriek that breaks your concentration',
      },
      {
        name: 'Goblin Rush',
        damage: 30,
        description: 'A chaotic charge forward',
      },
    ],
    rewards: {
      xp: 500,
      coins: 250,
      weaponId: 'iron_sword',
    },
    weakness: 'Consistency',
  },
  {
    id: 'frost_giant',
    name: 'Frost Giant',
    emoji: '❄️',
    title: 'Keeper of the Eternal Winter',
    hp: 800,
    rankRequired: 'D',
    description: 'A towering giant wrapped in perpetual ice. Melt through his defenses with productive weeks and social engagement.',
    attacks: [
      {
        name: 'Frostbite Strike',
        damage: 45,
        description: 'Freezes you in place with icy spikes',
      },
      {
        name: 'Blizzard Storm',
        damage: 60,
        description: 'A devastating whirlwind of snow and ice',
      },
      {
        name: 'Glacier Slam',
        damage: 50,
        description: 'Crushes the ground with a massive icy fist',
      },
      {
        name: 'Frozen Prison',
        damage: 40,
        description: 'Traps you in crystalline ice',
      },
    ],
    rewards: {
      xp: 1500,
      coins: 800,
      weaponId: 'steel_axe',
      auraId: 'frost',
    },
    weakness: 'Social Connection',
  },
  {
    id: 'dragon_lord',
    name: 'Dragon Lord',
    emoji: '🐉',
    title: 'Master of the Skies',
    hp: 2000,
    rankRequired: 'B',
    description: 'An ancient dragon who rules from his mountain fortress. Defeat him through consistent physical training and mental discipline.',
    attacks: [
      {
        name: 'Inferno Breath',
        damage: 120,
        description: 'Unleashes a torrent of dragonfire',
      },
      {
        name: 'Tail Whip',
        damage: 85,
        description: 'A devastating sweep of its massive tail',
      },
      {
        name: 'Dragon Claw',
        damage: 110,
        description: 'Rakes with razor-sharp claws',
      },
      {
        name: 'Sky Dive',
        damage: 95,
        description: 'Plummets from the sky with crushing force',
      },
    ],
    rewards: {
      xp: 4000,
      coins: 2500,
      weaponId: 'dragon_slayer',
      auraId: 'flame',
      titleId: 'dragon_slayer',
    },
    weakness: 'Physical Training',
  },
  {
    id: 'demon_monarch',
    name: 'Demon Monarch',
    emoji: '👹',
    title: 'Lord of the Abyss',
    hp: 5000,
    rankRequired: 'A',
    description: 'A powerful demon lord who feeds on despair and procrastination. Overcome him through unwavering determination and self-improvement.',
    attacks: [
      {
        name: 'Abyssal Curse',
        damage: 180,
        description: 'Curses you with paralyzing doubt',
      },
      {
        name: 'Hellfire Barrage',
        damage: 160,
        description: 'Rains down dark flames across the battlefield',
      },
      {
        name: 'Soul Drain',
        damage: 140,
        description: 'Drains your very life force',
      },
      {
        name: 'Demonic Roar',
        damage: 150,
        description: 'A terrifying cry that shakes your resolve',
      },
    ],
    rewards: {
      xp: 10000,
      coins: 6000,
      weaponId: 'excalibur',
      auraId: 'darkness',
      titleId: 'demon_slayer',
    },
    weakness: 'Mental Resilience',
  },
  {
    id: 'shadow_beast',
    name: 'Shadow Beast',
    emoji: '🌑',
    title: 'Devourer of Light',
    hp: 12000,
    rankRequired: 'S',
    description: 'A creature born from darkness itself, consuming all light in its path. Only the most disciplined warriors can challenge it.',
    attacks: [
      {
        name: 'Void Vortex',
        damage: 250,
        description: 'Opens a portal of pure nothingness',
      },
      {
        name: 'Shadow Clone',
        damage: 200,
        description: 'Creates dark duplicates to overwhelm you',
      },
      {
        name: 'Darkness Surge',
        damage: 280,
        description: 'A wave of consuming shadow engulfs everything',
      },
      {
        name: 'Entropy Strike',
        damage: 220,
        description: 'Unravels the fabric of reality itself',
      },
    ],
    rewards: {
      xp: 25000,
      coins: 15000,
      weaponId: 'blade_of_dawn',
      auraId: 'shadow',
      titleId: 'shadow_warrior',
    },
    weakness: 'Purpose and Goals',
  },
  {
    id: 'abyss_king',
    name: 'Abyss King',
    emoji: '👿',
    title: 'Eternal Emperor of the Void',
    hp: 30000,
    rankRequired: 'SHADOW_HUNTER',
    description: 'The ultimate manifestation of laziness and failure. Only legends speak of those who have defeated this primordial evil. Are you worthy?',
    attacks: [
      {
        name: 'Cataclysm',
        damage: 400,
        description: 'Destroys everything in a massive explosion',
      },
      {
        name: 'Oblivion Gaze',
        damage: 350,
        description: 'A stare that erases existence',
      },
      {
        name: 'Infinite Despair',
        damage: 380,
        description: 'Unleashes unlimited negativity',
      },
      {
        name: 'Void Annihilation',
        damage: 420,
        description: 'Returns all things to nothingness',
      },
    ],
    rewards: {
      xp: 50000,
      coins: 30000,
      weaponId: 'void_breaker',
      auraId: 'eternal_light',
      titleId: 'abyss_king_slayer',
    },
    weakness: 'Complete Life Mastery',
  },
];

export function getBossById(id: string): Boss | undefined {
  return BOSSES.find(boss => boss.id === id);
}
