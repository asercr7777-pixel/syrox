export interface Milestone {
  id: string;
  name: string;
  description: string;
  emoji: string;
  type: "tasks" | "streak" | "dungeons" | "xp" | "workouts";
  threshold: number;
  reward: {
    coins: number;
    xp: number;
    badgeId?: string;
    auraId?: string;
  };
}

export const MILESTONES: Milestone[] = [
  {
    id: "tasks_10",
    name: "First Steps",
    description: "Complete 10 tasks",
    emoji: "🐣",
    type: "tasks",
    threshold: 10,
    reward: {
      coins: 100,
      xp: 50
    }
  },
  {
    id: "tasks_100",
    name: "Momentum Builder",
    description: "Complete 100 tasks",
    emoji: "⚡",
    type: "tasks",
    threshold: 100,
    reward: {
      coins: 500,
      xp: 200
    }
  },
  {
    id: "tasks_1000",
    name: "Unstoppable Force",
    description: "Complete 1000 tasks",
    emoji: "🌪️",
    type: "tasks",
    threshold: 1000,
    reward: {
      coins: 5000,
      xp: 2000
    }
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    emoji: "🔥",
    type: "streak",
    threshold: 7,
    reward: {
      coins: 300,
      xp: 150,
      badgeId: "week_streak"
    }
  },
  {
    id: "streak_30",
    name: "Monthly Legend",
    description: "Maintain a 30-day streak",
    emoji: "👑",
    type: "streak",
    threshold: 30,
    reward: {
      coins: 1000,
      xp: 500,
      badgeId: "month_streak"
    }
  },
  {
    id: "streak_100",
    name: "Century Champion",
    description: "Maintain a 100-day streak",
    emoji: "💎",
    type: "streak",
    threshold: 100,
    reward: {
      coins: 5000,
      xp: 2000
    }
  },
  {
    id: "dungeons_10",
    name: "Dungeon Explorer",
    description: "Clear 10 dungeons",
    emoji: "🗝️",
    type: "dungeons",
    threshold: 10,
    reward: {
      coins: 500,
      xp: 200
    }
  },
  {
    id: "dungeons_50",
    name: "Dungeon Master",
    description: "Clear 50 dungeons",
    emoji: "🏰",
    type: "dungeons",
    threshold: 50,
    reward: {
      coins: 2000,
      xp: 1000
    }
  },
  {
    id: "dungeons_100",
    name: "Abyss Conqueror",
    description: "Clear 100 dungeons",
    emoji: "⚔️",
    type: "dungeons",
    threshold: 100,
    reward: {
      coins: 5000,
      xp: 3000
    }
  },
  {
    id: "xp_10000",
    name: "Rapid Ascender",
    description: "Earn 10,000 XP",
    emoji: "🌟",
    type: "xp",
    threshold: 10000,
    reward: {
      coins: 1000,
      xp: 500
    }
  },
  {
    id: "xp_100000",
    name: "Power Surge",
    description: "Earn 100,000 XP",
    emoji: "⭐",
    type: "xp",
    threshold: 100000,
    reward: {
      coins: 5000,
      xp: 2000
    }
  },
  {
    id: "xp_1000000",
    name: "Cosmic Being",
    description: "Earn 1,000,000 XP",
    emoji: "🌌",
    type: "xp",
    threshold: 1000000,
    reward: {
      coins: 20000,
      xp: 10000,
      auraId: "cosmic"
    }
  }
];

export function getMilestoneById(id: string): Milestone | undefined {
  return MILESTONES.find(milestone => milestone.id === id);
}
