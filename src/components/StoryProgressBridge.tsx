import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { ALL_CHAPTERS } from '../data/story';
import type { StoryMission } from '../data/story/types';

const SHADOW_STATE_KEY = 'stryven-story-shadow-state-v1';

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function progressForMission(state: ReturnType<typeof useStore>['state'], mission: StoryMission) {
  switch (mission.type) {
    case 'tasks':
      return Math.min(mission.target, Object.values(state.coreCompleted).filter(Boolean).length + Object.values(state.customCompleted).filter(Boolean).length);
    case 'workout': {
      const today = todayKey();
      const sessionsToday = state.workoutSessions.filter((session) => todayKeyFromTimestamp(session.completedAt) === today).length;
      return Math.min(mission.target, Math.max(state.workoutsCompletedToday, sessionsToday));
    }
    case 'pray': return state.coreCompleted.pray ? 1 : 0;
    case 'water': return state.coreCompleted.water ? 1 : 0;
    case 'sleep': return state.coreCompleted.sleep ? 1 : 0;
    case 'read_quran': return state.coreCompleted.read_quran ? 1 : 0;
    case 'read_book': return state.coreCompleted.read ? 1 : 0;
    case 'streak': return Math.min(mission.target, state.streak);
    case 'dungeon': return Math.min(mission.target, state.dungeonsCleared);
    case 'discipline_score': {
      const enabled = state.mainTasks.filter((task) => task.enabled);
      const done = enabled.filter((task) => state.coreCompleted[task.id]).length;
      return enabled.length ? Math.round((done / enabled.length) * 100) : 0;
    }
    default: return 0;
  }
}

function todayKeyFromTimestamp(timestamp: number) {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function shadowStateForEvent(type: StoryMission['type'], value: number) {
  if (type === 'workout') return value > 1 ? 'power' : 'observing';
  if (type === 'streak') return value >= 7 ? 'revelation' : 'ready';
  if (type === 'dungeon') return 'threat';
  if (type === 'discipline_score' && value >= 80) return 'command';
  if (type === 'tasks') return value >= 5 ? 'power' : 'observing';
  return 'idle';
}

export function StoryProgressBridge() {
  const { state, completeStoryMission } = useStore();

  useEffect(() => {
    const currentNumber = Math.min(state.storyChapter + 1, 30);
    const chapter = ALL_CHAPTERS.find((item) => item.number === currentNumber);
    if (!chapter) return;

    const completedNow: string[] = [];
    for (const mission of chapter.missions) {
      if (state.storyCompletedMissions[mission.id]) continue;
      const progress = progressForMission(state, mission);
      if (progress >= mission.target) {
        completeStoryMission(mission.id, { xp: mission.xpReward, coins: mission.coinReward });
        completedNow.push(mission.id);

        const event = {
          id: `${mission.id}:${todayKey()}`,
          missionId: mission.id,
          chapterId: chapter.id,
          type: mission.type,
          value: progress,
          at: Date.now(),
          shadowState: shadowStateForEvent(mission.type, progress),
        };
        try {
          const raw = localStorage.getItem(SHADOW_STATE_KEY);
          const history = raw ? JSON.parse(raw) : [];
          const safeHistory = Array.isArray(history) ? history : [];
          const withoutDuplicate = safeHistory.filter((item: any) => item?.id !== event.id).slice(-49);
          localStorage.setItem(SHADOW_STATE_KEY, JSON.stringify([...withoutDuplicate, event]));
        } catch {
          // Story progression must never fail because local event history is unavailable.
        }
        window.dispatchEvent(new CustomEvent('stryven-story-event', { detail: event }));
      }
    }

    if (completedNow.length > 0) {
      window.dispatchEvent(new CustomEvent('stryven-story-progress-updated', {
        detail: { chapter: currentNumber, missions: completedNow },
      }));
    }
  }, [state, completeStoryMission]);

  return null;
}

export default StoryProgressBridge;
