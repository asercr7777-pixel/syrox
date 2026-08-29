import type { RankId } from '../data/ranks';
import type { Rarity } from '../data/collections';

export interface CustomTask { id: string; label: string; emoji: string; points: number; createdAt: number; }
export interface MainTask { id: string; label: string; emoji: string; points: number; description?: string; category: 'body' | 'mind' | 'spirit' | 'work'; enabled: boolean; order: number; }
export type WorkoutDayId = 'day1' | 'day2' | 'day3' | 'day4' | 'day5' | 'day6';
export interface ExerciseEntry { id: string; name: string; sets: number; reps: string; section: 'stretching' | 'main' | 'plyometric'; completed: boolean; }
export interface WorkoutDayState { dayId: WorkoutDayId; name: string; emoji: string; exercises: ExerciseEntry[]; }
export interface ScheduleSlot { id: string; start: string; end: string; label: string; color: string; completed: boolean; }
export interface InventoryItem { id: string; type: 'aura' | 'weapon' | 'title' | 'shield' | 'frame' | 'background' | 'badge'; obtainedAt: number; favorite: boolean; }
export interface DayRecord { date: string; coreCompleted: Record<string, boolean>; customCompleted: Record<string, boolean>; xpGained: number; pointsGained: number; workoutCompleted: boolean; dungeonCleared: boolean; allMainDone: boolean; disciplineScore: number; }
export interface AchievementState { id: string; unlockedAt: number; }
export interface ChatMessage { id: string; role: 'user' | 'ai'; text: string; at: number; }
export interface Friend { id: string; name: string; level: number; rankId: RankId; streak: number; xp: number; auraColor: string; }
export interface NotificationSettings { workout: boolean; water: boolean; sleep: boolean; reading: boolean; prayer: boolean; tasks: boolean; }
export interface WorkoutSessionRecord { id: string; type: string; durationSeconds: number; completedAt: number; }
export type BackgroundType = 'default' | 'image' | 'video' | 'animated';
export type SiteTheme = 'shadow' | 'ember' | 'frost' | 'ocean' | 'emerald' | 'crimson' | 'royal' | 'gold';

export interface AppState {
  username: string; avatar: string; avatarColor: string; bannerColor: string; nameColor: string; theme: SiteTheme;
  xp: number; level: number; coins: number; totalPoints: number; streak: number; bestStreak: number; lastActiveDate: string | null; streakShield: number;
  coreCompleted: Record<string, boolean>; customCompleted: Record<string, boolean>; dailyXp: number; dailyPoints: number; dailyCap: number; lastDailyResetDate: string | null;
  mainTasks: MainTask[]; customTasks: CustomTask[];
  workouts: Record<WorkoutDayId, WorkoutDayState>; workoutsCompletedToday: number; workoutRewardsClaimedToday: Record<WorkoutDayId, boolean>; lastWorkoutDate: string | null; workoutSessions: WorkoutSessionRecord[]; totalWorkoutSeconds: number;
  schedule: ScheduleSlot[];
  dungeonClearedToday: boolean; lastDungeonDate: string | null; dungeonsCleared: number; secretDungeonAvailable: boolean; secretDungeonId: string | null; secretDungeonExpiresAt: number | null;
  lastLoginClaimDate: string | null; loginStreak: number; lastSpinDate: string | null; lastSpinRewardId: string | null;
  dailyChallengeIds: string[]; dailyChallengeCompleted: Record<string, boolean>; dailyChallengeDate: string | null; weeklyMissionIds: string[]; weeklyMissionCompleted: Record<string, boolean>; weeklyMissionWeek: string | null;
  inventory: InventoryItem[]; equipped: { aura: string | null; weapon: string | null; title: string | null; shield: string | null; frame: string | null; background: string | null; };
  backgroundType: BackgroundType; customBackground: string | null; backgroundVideo: string | null; backgroundBlur: number; backgroundDarken: number; backgroundBrightness: number; selectedBackgroundId: string | null;
  achievements: AchievementState[]; history: DayRecord[]; notes: Record<string, string>; chat: ChatMessage[]; friends: Friend[];
  soundEnabled: boolean; notifications: NotificationSettings; seasonXp: number; seasonId: string; doubleXpUntil: number | null; easterEggsFound: string[]; createdAt: number;
  storyChapter: number; storyMission: number; storyChoices: Record<string, string>; storyCompletedMissions: Record<string, boolean>; storyBossDefeated: Record<string, boolean>; storyNpcReputation: Record<string, number>; storyLoreUnlocked: string[]; storyAchievements: string[];
  activeBossId: string | null; bossHpRemaining: Record<string, number>; bossDefeated: Record<string, boolean>; chestInventory: Record<string, number>;
  petId: string | null; petLevel: number; petXp: number; battlePassTier: number; battlePassXp: number; battlePassPremium: boolean; battlePassClaimedFree: number[]; battlePassClaimedPremium: number[];
  lastFortuneDate: string | null; lastFortuneLuck: number; lastFortuneQuote: string; milestoneClaimed: string[]; prestigeLevel: number; prestigeMultiplier: number;
  dailyShopSeed: string | null; dailyShopDate: string | null; secretShopAvailable: boolean; secretShopExpiresAt: number | null; searchHistory: string[]; rankRewardsClaimed: string[];
}

export type DropType = 'aura' | 'weapon' | 'title' | 'shield' | 'frame' | 'background' | 'badge' | 'coins' | 'xp' | 'shards' | 'chest';
export interface DropResult { type: DropType; itemId?: string; rarity?: Rarity; amount?: number; label: string; }
