import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getShadowImage, getShadowReaction, type ShadowState, type StoryEventType } from '../lib/story/shadowReactions';
import { useStore } from '../store/useStore';
import { ALL_CHAPTERS } from '../data/story';
import type { StoryMission } from '../data/story/types';

const SHADOW_STATE_KEY = 'stryven-story-shadow-state-v1';

type ShadowEvent = { id: string; missionId: string; chapterId: string; type: StoryMission['type']; value: number; at: number; shadowState: ShadowState };

function todayKey() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function todayKeyFromTimestamp(timestamp: number) { const d = new Date(timestamp); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

function progressForMission(state: ReturnType<typeof useStore>['state'], mission: StoryMission) {
  switch (mission.type) {
    case 'tasks': return Math.min(mission.target, Object.values(state.coreCompleted).filter(Boolean).length + Object.values(state.customCompleted).filter(Boolean).length);
    case 'workout': { const today = todayKey(); const sessionsToday = state.workoutSessions.filter((session) => todayKeyFromTimestamp(session.completedAt) === today).length; return Math.min(mission.target, Math.max(state.workoutsCompletedToday, sessionsToday)); }
    case 'pray': return state.coreCompleted.pray ? 1 : 0;
    case 'water': return state.coreCompleted.water ? 1 : 0;
    case 'sleep': return state.coreCompleted.sleep ? 1 : 0;
    case 'read_quran': return state.coreCompleted.read_quran ? 1 : 0;
    case 'read_book': return state.coreCompleted.read ? 1 : 0;
    case 'streak': return Math.min(mission.target, state.streak);
    case 'dungeon': return Math.min(mission.target, state.dungeonsCleared);
    case 'discipline_score': { const enabled = state.mainTasks.filter((task) => task.enabled); const done = enabled.filter((task) => state.coreCompleted[task.id]).length; return enabled.length ? Math.round((done / enabled.length) * 100) : 0; }
    default: return 0;
  }
}

function shadowStateForEvent(type: StoryMission['type'], value: number): ShadowState {
  if (type === 'workout') return value > 1 ? 'power' : 'observing';
  if (type === 'streak') return value >= 7 ? 'revelation' : 'ready';
  if (type === 'dungeon') return 'threat';
  if (type === 'discipline_score' && value >= 80) return 'command';
  if (type === 'tasks') return value >= 5 ? 'power' : 'observing';
  if (type === 'pray' || type === 'water' || type === 'sleep' || type === 'read_quran' || type === 'read_book') return 'ready';
  return 'idle';
}

function toReactionEvent(type: StoryMission['type']): StoryEventType {
  if (type === 'workout') return 'workout_completed';
  if (type === 'streak') return 'streak_increased';
  if (type === 'dungeon') return 'dungeon_cleared';
  if (type === 'tasks' || type === 'pray' || type === 'water' || type === 'sleep' || type === 'read_quran' || type === 'read_book') return 'task_completed';
  return 'milestone_reached';
}

export function StoryProgressBridge() {
  const { state, completeStoryMission } = useStore();
  const [latestEvent, setLatestEvent] = useState<ShadowEvent | null>(() => {
    try { const raw = localStorage.getItem(SHADOW_STATE_KEY); const history = raw ? JSON.parse(raw) : []; return Array.isArray(history) && history.length ? history[history.length - 1] : null; } catch { return null; }
  });
  const [storyVisible, setStoryVisible] = useState(false);

  useEffect(() => {
    const syncView = () => setStoryVisible(new URLSearchParams(window.location.search).get('view') === 'story');
    syncView();
    window.addEventListener('popstate', syncView);
    window.addEventListener('stryven-view-change', syncView);
    return () => { window.removeEventListener('popstate', syncView); window.removeEventListener('stryven-view-change', syncView); };
  }, []);

  useEffect(() => {
    const onEvent = (event: Event) => { const detail = (event as CustomEvent<ShadowEvent>).detail; if (detail) setLatestEvent(detail); };
    window.addEventListener('stryven-story-event', onEvent);
    return () => window.removeEventListener('stryven-story-event', onEvent);
  }, []);

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
        const event: ShadowEvent = { id: `${mission.id}:${todayKey()}`, missionId: mission.id, chapterId: chapter.id, type: mission.type, value: progress, at: Date.now(), shadowState: shadowStateForEvent(mission.type, progress) };
        try { const raw = localStorage.getItem(SHADOW_STATE_KEY); const history = raw ? JSON.parse(raw) : []; const safeHistory = Array.isArray(history) ? history : []; const withoutDuplicate = safeHistory.filter((item: any) => item?.id !== event.id).slice(-49); localStorage.setItem(SHADOW_STATE_KEY, JSON.stringify([...withoutDuplicate, event])); } catch { /* local history is optional */ }
        setLatestEvent(event);
        window.dispatchEvent(new CustomEvent('stryven-story-event', { detail: event }));
      }
    }
    if (completedNow.length > 0) window.dispatchEvent(new CustomEvent('stryven-story-progress-updated', { detail: { chapter: currentNumber, missions: completedNow } }));
  }, [state, completeStoryMission]);

  const reaction = useMemo(() => latestEvent ? getShadowReaction(toReactionEvent(latestEvent.type)) : getShadowReaction('workout_completed'), [latestEvent]);
  const image = getShadowImage(latestEvent?.shadowState ?? 'idle');
  if (!storyVisible) return null;

  return <AnimatePresence mode="wait"><motion.aside key={`${latestEvent?.id ?? 'idle'}:${latestEvent?.shadowState ?? 'idle'}`} initial={{ opacity: 0, y: 18, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.2 }} className="pointer-events-none fixed bottom-4 left-4 right-4 z-40 mx-auto w-auto max-w-[380px] overflow-hidden rounded-2xl border border-violet-500/25 bg-[#07070d]/95 shadow-[0_20px_60px_rgba(0,0,0,.5)] sm:bottom-5 sm:left-auto sm:right-5 sm:mx-0 sm:w-[min(340px,calc(100vw-2rem))]" aria-label="Shadow story reaction"><div className="flex items-stretch"><div className="w-24 shrink-0 overflow-hidden border-r border-violet-500/20 bg-black/60 sm:w-28"><img key={image} src={image} alt={`Shadow, ${latestEvent?.shadowState ?? 'idle'} state`} loading="eager" decoding="async" className="h-full min-h-28 w-full object-cover object-center" onError={(event) => { if (event.currentTarget.src.endsWith('/shadow_standing.png.jpg')) return; event.currentTarget.src = getShadowImage('standing'); }} /></div><div className="min-w-0 flex-1 p-3.5"><div className="flex items-center justify-between gap-2"><div className="text-[9px] font-bold uppercase tracking-[0.25em] text-violet-300">{reaction.title}</div><div className="h-1.5 w-1.5 rounded-full bg-violet-300" /></div><p className="mt-2 text-xs leading-5 text-ink-100 sm:text-sm">{reaction.lines[0]}</p><p className="mt-1 text-[11px] leading-4 text-ink-400">{reaction.lines[1]}</p><div className="mt-2 text-[9px] font-mono uppercase tracking-widest text-violet-400/60">STATE · {latestEvent?.shadowState ?? 'idle'}</div></div></div></motion.aside></AnimatePresence>;
}

export default StoryProgressBridge;
