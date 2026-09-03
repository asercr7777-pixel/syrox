import { useMemo, useState } from 'react';
import { ArrowLeft, Check, ChevronRight, Coins, Lock, Map, Skull, Swords, Target, Trophy, Volume2, VolumeX, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ALL_CHAPTERS } from '../data/story';
import type { StoryChapter, StoryMission } from '../data/story/types';
import { isMusicEnabled, setMusicEnabled } from '../lib/audioEngine';
import { toast } from '../components/ui/Toast';
import { triggerConfetti } from '../components/ui/Confetti';

type Screen = 'world' | 'chapter' | 'boss' | 'reward';
const chapters = [...ALL_CHAPTERS].sort((a, b) => a.number - b.number).slice(0, 30);

// 30 chapters arranged in a deliberate snake path: left → right, then right → left.
// Five rows keep the route readable while giving every chapter room around the artwork.
const MAP_W = 2700;
const MAP_H = 900;
const nodes: [number, number][] = [
  [170, 135], [640, 135], [1110, 135], [1590, 135], [2060, 135], [2530, 135],
  [2530, 315], [2060, 315], [1590, 315], [1110, 315], [640, 315], [170, 315],
  [170, 495], [640, 495], [1110, 495], [1590, 495], [2060, 495], [2530, 495],
  [2530, 675], [2060, 675], [1590, 675], [1110, 675], [640, 675], [170, 675],
  [170, 825], [640, 825], [1110, 825], [1590, 825], [2060, 825], [2530, 825]
];

function smoothPath(points: [number, number][]) {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i += 1) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    d += ` Q ${cx} ${cy} ${x1} ${y1}`;
  }
  return d;
}

const routeD = smoothPath(nodes);
const dateKey = (t: number) => new Date(t).toISOString().slice(0, 10);

function progress(state: ReturnType<typeof useStore>['state'], m: StoryMission) {
  switch (m.type) {
    case 'tasks': return Math.min(m.target, Object.values(state.coreCompleted).filter(Boolean).length + Object.values(state.customCompleted).filter(Boolean).length);
    case 'workout': {
      const today = dateKey(Date.now());
      const sessions = state.workoutSessions.filter(s => dateKey(s.completedAt) === today).length;
      const history = state.history.some(d => d.date === today && d.workoutCompleted);
      return Math.min(m.target, Math.max(state.workoutsCompletedToday, sessions, history ? 1 : 0));
    }
    case 'pray': return state.coreCompleted.pray ? 1 : 0;
    case 'water': return state.coreCompleted.water ? 1 : 0;
    case 'sleep': return state.coreCompleted.sleep ? 1 : 0;
    case 'read_quran': return state.coreCompleted.read_quran ? 1 : 0;
    case 'read_book': return state.coreCompleted.read ? 1 : 0;
    case 'streak': return Math.min(m.target, state.streak);
    case 'dungeon': return Math.min(m.target, state.dungeonsCleared);
    case 'discipline_score': {
      const enabled = state.mainTasks.filter(t => t.enabled);
      const done = enabled.filter(t => state.coreCompleted[t.id]).length;
      return enabled.length ? Math.round(done / enabled.length * 100) : 0;
    }
    default: return 0;
  }
}

export default function StoryModeSimpleV2() {
  const { state, completeStoryMission, defeatStoryBoss, advanceStoryChapter, unlockLore, unlockStoryAchievement } = useStore();
  const [screen, setScreen] = useState<Screen>('world');
  const [selected, setSelected] = useState<StoryChapter>(chapters[0]);
  const [bossPhase, setBossPhase] = useState(0);
  const [reward, setReward] = useState<{ xp: number; coins: number; title?: string; lore?: string } | null>(null);
  const [music, setMusic] = useState(isMusicEnabled());
  const current = Math.min(state.storyChapter + 1, 30);
  const rows = useMemo(() => selected.missions.map(m => ({ m, p: progress(state, m), done: Boolean(state.storyCompletedMissions[m.id]) })), [selected, state]);
  const done = rows.filter(x => x.done).length;

  const open = (c: StoryChapter) => {
    if (c.number > current) return;
    setSelected(c);
    setScreen('chapter');
  };

  const complete = (m: StoryMission) => {
    if (state.storyCompletedMissions[m.id]) return;
    const p = progress(state, m);
    if (p < m.target) {
      toast({ title: 'Mission not complete', message: `Do the objective first: ${m.title}`, type: 'info', icon: '◈' });
      return;
    }
    completeStoryMission(m.id, { xp: m.xpReward, coins: m.coinReward });
    toast({ title: 'Mission complete', message: `+${m.xpReward} XP · +${m.coinReward} coins`, type: 'success', icon: '✓' });
  };

  const hitBoss = () => {
    if (bossPhase < 2) {
      setBossPhase(v => v + 1);
      return;
    }
    const b = selected.boss;
    defeatStoryBoss(b.id);
    if (b.rewardTitle) unlockStoryAchievement(b.rewardTitle);
    if (b.rewardLore) unlockLore(b.rewardLore);
    completeStoryMission(`boss_${b.id}`, { xp: b.xpReward, coins: b.coinReward });
    setReward({ xp: b.xpReward, coins: b.coinReward, title: b.rewardTitle, lore: b.rewardLore });
    triggerConfetti(30);
    setScreen('reward');
  };

  const claim = () => {
    setReward(null);
    if (selected.number === current && selected.number < 30) advanceStoryChapter();
    setScreen('world');
  };

  if (screen === 'reward' && reward) return (
    <div className="relative min-h-[78vh] overflow-hidden rounded-[2rem] border border-white/10 bg-[#050607] p-6 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.1),transparent_45%)]" />
      <div className="relative mx-auto flex min-h-[68vh] max-w-xl flex-col items-center justify-center text-center">
        <Trophy size={44} />
        <div className="mt-5 text-xs font-black uppercase tracking-[.35em] text-white/40">TERRITORY CONQUERED</div>
        <h1 className="mt-3 text-4xl font-black">{selected.title}</h1>
        <div className="my-7 flex gap-3"><span className="rounded-xl bg-white/10 px-4 py-3 font-black"><Zap size={15} className="mr-2 inline" />+{reward.xp} XP</span><span className="rounded-xl bg-white/10 px-4 py-3 font-black"><Coins size={15} className="mr-2 inline" />+{reward.coins}</span></div>
        {reward.title && <div className="mb-6 rounded-xl border border-white/10 bg-white/5 px-5 py-3"><b>{reward.title}</b><span className="ml-2 text-xs text-white/40">Achievement unlocked</span></div>}
        <button onClick={claim} className="rounded-xl bg-white px-7 py-3 font-black text-black">Return to World <ChevronRight size={17} className="ml-1 inline" /></button>
      </div>
    </div>
  );

  if (screen === 'boss') return (
    <div className="min-h-[78vh] rounded-[2rem] border border-white/10 bg-[#050607] p-5 text-white">
      <button onClick={() => setScreen('chapter')} className="mb-6 flex items-center gap-2 text-xs font-bold text-white/45"><ArrowLeft size={15} /> World</button>
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-black/50 p-7 text-center">
        <Skull className="mx-auto" size={42} />
        <div className="mt-4 text-xs font-black uppercase tracking-[.35em] text-white/35">BOSS CITADEL · PHASE {bossPhase + 1}/3</div>
        <h1 className="mt-3 text-4xl font-black">{selected.boss.name}</h1>
        <p className="mt-2 text-sm text-white/40">{['Hold your ground.', 'Break the pattern.', 'Finish the fight.'][bossPhase]}</p>
        <div className="my-7 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-white transition-all" style={{ width: `${100 - bossPhase * 33.33}%` }} /></div>
        <button onClick={hitBoss} className="w-full rounded-xl bg-white py-4 font-black text-black">{bossPhase === 2 ? 'DEFEAT BOSS' : 'COMPLETE PHASE'} <ChevronRight size={17} className="ml-1 inline" /></button>
      </div>
    </div>
  );

  if (screen === 'chapter') return (
    <div className="min-h-[78vh] text-white">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => setScreen('world')} className="flex items-center gap-2 text-xs font-bold text-white/45"><ArrowLeft size={15} /> World Map</button>
        <button onClick={() => { const n = !music; setMusic(n); setMusicEnabled(n); }} className="rounded-xl border border-white/10 bg-white/5 p-2">{music ? <Volume2 size={16} /> : <VolumeX size={16} />}</button>
      </div>
      <div className="mb-4 rounded-[2rem] border border-white/10 bg-black/40 p-6"><div className="text-xs font-black uppercase tracking-[.3em] text-white/35">{selected.region.name} · CHAPTER {String(selected.number).padStart(2, '0')}</div><div className="mt-2 flex items-end justify-between gap-4"><div><h1 className="text-3xl font-black sm:text-4xl">{selected.title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">{selected.description}</p></div><div className="text-2xl font-black">{Math.round(done / Math.max(1, rows.length) * 100)}%</div></div><div className="mt-5 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-white" style={{ width: `${done / Math.max(1, rows.length) * 100}%` }} /></div></div>
      <div className="rounded-[2rem] border border-white/10 bg-black/40 p-4 sm:p-6"><div className="mb-4 flex items-center justify-between"><b className="text-lg">Objectives</b><span className="text-xs text-white/40">{done}/{rows.length}</span></div><div className="space-y-2">{rows.map(({ m, p, done: d }) => <button key={m.id} onClick={() => complete(m)} className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left ${d ? 'border-white/15 bg-white/10 opacity-60' : 'border-white/10 bg-white/[.03]'}`}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5">{d ? <Check size={15} /> : <Target size={15} />}</span><span className="min-w-0 flex-1"><b className="block">{m.title}</b></span><span className="text-xs font-black text-white/45">{d ? 'DONE' : `${p}/${m.target}`}</span></button>)}</div>{done === rows.length ? <button onClick={() => { setBossPhase(0); setScreen('boss'); }} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-4 font-black text-black"><Swords size={17} /> ENTER BOSS CITADEL</button> : <div className="mt-4 text-xs text-white/30">Complete every objective to reveal the Boss Citadel.</div>}</div>
    </div>
  );

  return <WorldMap current={current} completed={state.storyChapter} level={state.level} open={open} />;
}

function WorldMap({ current, completed, level, open }: { current: number; completed: number; level: number; open: (c: StoryChapter) => void }) {
  const activeCount = Math.max(1, Math.min(30, completed + 1));
  const activeRoute = smoothPath(nodes.slice(0, activeCount));

  return (
    <div className="relative min-h-[86vh] overflow-hidden rounded-[2rem] border border-white/10 bg-[#050607] text-white shadow-2xl">
      <style>{`
        .syrox-map-scroll{scrollbar-width:auto;scrollbar-color:rgba(255,255,255,.34) rgba(255,255,255,.06);-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain}
        .syrox-map-scroll::-webkit-scrollbar{height:12px}
        .syrox-map-scroll::-webkit-scrollbar-track{background:rgba(255,255,255,.055);border-radius:999px}
        .syrox-map-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,.34);border:3px solid rgba(255,255,255,.04);border-radius:999px}
        .syrox-map-canvas{contain:layout paint;isolation:isolate}
        .syrox-map-image{image-rendering:auto;backface-visibility:hidden;transform:translateZ(0);-webkit-transform:translateZ(0);filter:saturate(1.08) contrast(1.05)}
      `}</style>

      <header className="relative z-30 flex flex-wrap items-start justify-between gap-4 border-b border-white/10 bg-black/60 p-5 backdrop-blur-md sm:p-7">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.45em] text-amber-200/70"><Map size={14} /> SYROX WORLD MAP</div>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-6xl">The Shattered Realm</h1>
          <p className="mt-2 max-w-xl text-sm text-white/50">Chapter 01 → 30. Follow the connected road across the realm. The next territory unlocks as you progress.</p>
        </div>
        <div className="flex gap-2">
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-right"><div className="text-[9px] font-black uppercase tracking-[.3em] text-white/35">Progress</div><div className="mt-1 text-xl font-black">{completed}/30</div></div>
          <div className="rounded-xl border border-amber-200/20 bg-amber-200/[.06] px-4 py-3 text-right"><div className="text-[9px] font-black uppercase tracking-[.3em] text-amber-200/50">Shadow Level</div><div className="mt-1 flex items-center justify-end gap-2 text-xl font-black"><Zap size={15} /> {level}</div><div className="text-[8px] uppercase tracking-[.18em] text-white/25">Player Level</div></div>
        </div>
      </header>

      <div className="relative z-20 px-3 pt-3 sm:px-7 sm:pt-5">
        <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[.25em] text-white/35"><span>WORLD MAP · HORIZONTAL SCROLL</span><span>← DRAG / SHIFT →</span></div>
        <div className="syrox-map-scroll overflow-x-auto overflow-y-hidden rounded-[1.75rem] border border-amber-300/20 bg-black/50 shadow-inner">
          <div className="syrox-map-canvas relative" style={{ width: MAP_W, height: MAP_H }}>
            <img src="/world-map-aaa-anime.webp.jpg" alt="Syrox World Map" draggable={false} loading="eager" decoding="async" className="syrox-map-image absolute inset-0 h-full w-full select-none object-cover" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_36%,rgba(0,0,0,.18)_70%,rgba(0,0,0,.48)_100%)]" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/[.10] via-transparent to-black/[.20]" />

            <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true" preserveAspectRatio="none">
              <defs>
                <filter id="syrox-route-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                <filter id="syrox-route-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.5" /></filter>
                <linearGradient id="syrox-route-gradient" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#d39a34" /><stop offset="45%" stopColor="#f4c96b" /><stop offset="75%" stopColor="#fff0bb" /><stop offset="100%" stopColor="#ffffff" /></linearGradient>
              </defs>
              <path d={routeD} fill="none" stroke="rgba(0,0,0,.82)" strokeWidth="34" strokeLinecap="round" strokeLinejoin="round" />
              <path d={routeD} fill="none" stroke="rgba(255,213,120,.25)" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" filter="url(#syrox-route-soft)" />
              <path d={routeD} fill="none" stroke="url(#syrox-route-gradient)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="20 9" />
              <path d={activeRoute} fill="none" stroke="rgba(255,255,255,.96)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" filter="url(#syrox-route-glow)" />
            </svg>

            {nodes.map(([x, y], index) => {
              const number = index + 1;
              const unlocked = number <= current;
              const conquered = number <= completed;
              const currentNode = number === current;
              return (
                <button key={number} onClick={() => unlocked && open(chapters[index])} disabled={!unlocked} aria-label={`Chapter ${number}${!unlocked ? ', locked' : ''}`} className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ left: x, top: y }}>
                  <span className={`relative flex h-[66px] w-[66px] items-center justify-center rounded-full border shadow-[0_10px_30px_rgba(0,0,0,.7)] transition-transform duration-200 ${currentNode ? 'scale-125 border-white bg-black/95 ring-2 ring-white/30' : conquered ? 'border-amber-200/95 bg-black/90 hover:scale-110' : unlocked ? 'border-white/80 bg-black/85 hover:scale-110' : 'border-white/20 bg-black/80 opacity-70'}`}>
                    {currentNode && <span className="absolute inset-[-11px] animate-pulse rounded-full border border-white/70" />}
                    <span className="absolute inset-[5px] rounded-full border border-white/10" />
                    {conquered ? <Check size={22} strokeWidth={3} /> : unlocked ? <span className="text-[15px] font-black tracking-tight">{String(number).padStart(2, '0')}</span> : <Lock size={17} />}
                    <span className={`absolute -bottom-7 whitespace-nowrap rounded-md border px-2 py-1 text-[8px] font-black tracking-[.16em] shadow-[0_5px_18px_rgba(0,0,0,.7)] ${currentNode ? 'border-white bg-white text-black' : conquered ? 'border-amber-200/25 bg-black/90 text-amber-100' : 'border-white/10 bg-black/85 text-white/70'}`}>CH {String(number).padStart(2, '0')}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="px-1 pb-2 pt-2 text-[9px] font-black uppercase tracking-[.25em] text-white/30">Scrollbar is intentionally below the map · page itself remains vertically scrollable</div>
      </div>

      <footer className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-black/50 px-5 py-4 text-[9px] font-black uppercase tracking-[.25em] text-white/35 sm:px-7"><span><span className="mr-2 inline-block h-2 w-2 rounded-full bg-amber-200" /> {completed}/30 chapters conquered</span><span>Current Chapter {current}/30</span><span className="flex items-center gap-2"><Skull size={12} /> Complete the route to reach each Boss Citadel</span></footer>
    </div>
  );
}
