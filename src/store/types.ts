import type { RankId } from '../data/ranks';
import type { Rarity } from '../data/collections';

export interface CustomTask {
  id: string;
  label: string;
  emoji: string;
  points: number;
  createdAt: number;
}

export interface MainTask {
  id: string;
  label: string;
  emoji: string;
  points: number;
  description?: string;
  category: 'body' | 'mind' | 'spirit' | 'work';
  enabled: boolean;
  order: number;
}

export interface ExerciseEntry {
  id: string;
  name: string;
  sets: number;
  reps: string;
  section: 'stretching' | 'main' | 'plyometric';
  completed: boolean;
}

export interface WorkoutDayState {
  dayId: 'push' | 'pull' | 'leg';
  exercises: ExerciseEntry[];
}

export interface ScheduleSlot {
  id: string;
  start: string;
  end: string;
  label: string;
  color: string;
  completed: boolean;
}

export interface InventoryItem {
  id: string;
  type: 'aura' | 'weapon' | 'title' | 'shield' | 'frame' | 'background' | 'badge';
  obtainedAt: number;
  favorite: boolean;
}

export interface DayRecord {
  date: string;
  coreCompleted: Record<string, boolean>;
  customCompleted: Record<string, boolean>;
  xpGained: number;
  pointsGained: number;
  workoutCompleted: boolean;
  dungeonCleared: boolean;
  allMainDone: boolean;
  /** Discipline score for this day: (mainTasksDone + extraTasksDone) / totalPossible * 100 */
  disciplineScore: number;
}

export interface AchievementState {
  id: string;
  unlockedAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  at: number;
}

export interface Friend {
  id: string;
  name: string;
  level: number;
  rankId: RankId;
  streak: number;
  xp: number;
  auraColor: string;
}

export interface NotificationSettings {
  workout: boolean;
  water: boolean;
  sleep: boolean;
  reading: boolean;
  prayer: boolean;
  tasks: boolean;
}

export interface WorkoutSessionRecord {
  id: string;
  type: 'push' | 'pull' | 'legs' | 'cardio' | 'boxing' | 'custom';
  durationSeconds: number;
  completedAt: number;
}

export type BackgroundType = 'default' | 'image' | 'video' | 'animated';

export interface AppState {
  // Profile
  username: string;
  avatar: string;
  avatarColor: string;
  bannerColor: string;
  nameColor: string;
  theme: 'shadow' | 'ember' | 'frost' | 'gold';

  // Progression
  xp: number;
  level: number;
  coins: number;
  totalPoints: number;
  streak: number;
  bestStreak: number;
  lastActiveDate: string | null;
  streakShield: number;

  // Daily tracking
  coreCompleted: Record<string, boolean>;
  customCompleted: Record<string, boolean>;
  dailyXp: number;
  dailyPoints: number;
  dailyCap: number;
  lastDailyResetDate: string | null;

  // Tasks
  mainTasks: MainTask[];
  customTasks: CustomTask[];

  // Workout
  workouts: Record<'push' | 'pull' | 'leg', ExerciseEntry[]>;
  workoutsCompletedToday: number;
  workoutRewardsClaimedToday: Record<'push' | 'pull' | 'leg', boolean>;
  lastWorkoutDate: string | null;
  workoutSessions: WorkoutSessionRecord[];
  totalWorkoutSeconds: number;

  // Schedule
  schedule: ScheduleSlot[];

  // Dungeons
  dungeonClearedToday: boolean;
  lastDungeonDate: string | null;
  dungeonsCleared: number;
  secretDungeonAvailable: boolean;
  secretDungeonId: string | null;
  secretDungeonExpiresAt: number | null;

  // Rewards
  lastLoginClaimDate: string | null;
  loginStreak: number;
  lastSpinDate: string | null;
  lastSpinRewardId: string | null;

  // Challenges
  dailyChallengeIds: string[];
  dailyChallengeCompleted: Record<string, boolean>;
  dailyChallengeDate: string | null;
  weeklyMissionIds: string[];
  weeklyMissionCompleted: Record<string, boolean>;
  weeklyMissionWeek: string | null;

  // Inventory
  inventory: InventoryItem[];
  equipped: {
    aura: string | null;
    weapon: string | null;
    title: string | null;
    shield: string | null;
    frame: string | null;
    background: string | null;
  };

  // Background customization
  backgroundType: BackgroundType;
  customBackground: string | null;
  backgroundVideo: string | null;
  backgroundBlur: number;
  backgroundDarken: number;
  backgroundBrightness: number;
  selectedBackgroundId: string | null;

  // Achievements
  achievements: AchievementState[];

  // History
  history: DayRecord[];
  notes: Record<string, string>;

  // AI
  chat: ChatMessage[];

  // Friends
  friends: Friend[];

  // Settings
  soundEnabled: boolean;
  notifications: NotificationSettings;

  // Seasonal
  seasonXp: number;
  seasonId: string;

  // Misc
  doubleXpUntil: number | null;
  easterEggsFound: string[];
  createdAt: number;

  // Story Mode
  storyChapter: number;
  storyMission: number;
  storyChoices: Record<string, string>;
  storyCompletedMissions: Record<string, boolean>;
  storyBossDefeated: Record<string, boolean>;
  storyNpcReputation: Record<string, number>;
  storyLoreUnlocked: string[];
  storyAchievements: string[];

  // Boss Battles
  activeBossId: string | null;
  bossHpRemaining: Record<string, number>;
  bossDefeated: Record<string, boolean>;

  // Chests
  chestInventory: Record<string, number>;

  // Pets
  petId: string | null;
  petLevel: number;
  petXp: number;

  // Battle Pass
  battlePassTier: number;
  battlePassXp: number;
  battlePassPremium: boolean;
  battlePassClaimedFree: number[];
  battlePassClaimedPremium: number[];

  // Daily Fortune
  lastFortuneDate: string | null;
  lastFortuneLuck: number;
  lastFortuneQuote: string;

  // Milestones
  milestoneClaimed: string[];

  // Prestige
  prestigeLevel: number;
  prestigeMultiplier: number;

  // Daily Shop
  dailyShopSeed: string | null;
  dailyShopDate: string | null;

  // Secret Shop
  secretShopAvailable: boolean;
  secretShopExpiresAt: number | null;

  // Global Search
  searchHistory: string[];

  // Rank rewards claimed
  rankRewardsClaimed: string[];
}

export type DropType = 'aura' | 'weapon' | 'title' | 'shield' | 'frame' | 'background' | 'badge' | 'coins' | 'xp' | 'shards' | 'chest';

export interface DropResult {
  type: DropType;
  itemId?: string;
  rarity?: Rarity;
  amount?: number;
  label: string;
}
