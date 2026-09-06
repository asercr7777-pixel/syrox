import { useMemo, useState } from 'react';
import { ArrowLeft, Check, ChevronRight, Lock, Map, Skull, Swords, Target, Trophy, Volume2, VolumeX, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ALL_CHAPTERS } from '../data/story';
import type { StoryChapter, StoryMission } from '../data/story/types';
import { isMusicEnabled, setMusicEnabled } from '../lib/audioEngine';
import { toast } from '../components/ui/Toast';
import { triggerConfetti } from '../components/ui/Confetti';

type Screen = 'world' | 'chapter' | 'boss' | 'reward';
const chapters = [...ALL_CHAPTERS].sort((a, b) => a.number - b.number).slice(0, 30);
const MAP_W = 3200;
const MAP_H = 520;
const nodes: [number, number][] = [
  [201, 78], [758, 78], [1316, 78], [1884, 78], [2437, 78], [2996, 78],
  [2996, 182], [2437, 182], [1884, 182], [1316, 182], [758, 182], [201, 182],
  [201, 286], [758, 286], [1316, 286], [1884, 286], [2437, 286], [2996, 286],
  [2996, 390], [2437, 390], [1884, 390], [1316, 390], [758, 390], [201, 390],
  [201, 476], [758, 476], [1316, 476], [1884, 476], [2437, 476], [2996, 476]
];
function smoothPath(points: [number, number][]) {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i += 1) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    d += ` Q ${(x0 + x1) / 2} ${(y0 + y1) / 2} ${x1} ${y1}`;
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
  const [music, setMusic] = useState(isMusicEnabled());
  const [reward, setReward] = useState<{ xp: number; title?: string; lore?: string } | null>(null);
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
      toast({ title: 'Mission not complete', message: `Complete: ${m.title}`, type: 'info', icon: '◈' });
      return;
    }
    completeStoryMission(m.id, { xp: m.xpReward });
    toast({ title: 'Mission complete', message: `+${m.xpReward} XP`, type: 'success', icon: '✓' });
  };
  const hitBoss = () => {
    if (bossPhase < 2) { setBossPhase(v => v + 1); return; }
    const b = selected.boss;
    if (state.storyBossDefeated[b.id]) { setScreen('world'); return; }
    defeatStoryBoss(b.id);
    if (b.rewardTitle) unlockStoryAchievement(b.rewardTitle);
    if (b.rewardLore) unlockLore(b.rewardLore);
    completeStoryMission(`boss_${b.id}`, { xp: b.xpReward });
    setReward({ xp: b.xpReward, title: b.rewardTitle, lore: b.rewardLore });
    triggerConfetti(30);
    setScreen('reward');
  };
  const claim = () => {
    setReward(null);
    if (selected.number === current && selected.number < 30) advanceStoryChapter();
    setScreen('world');
  };

  if (screen === 'reward' && reward) return (
    <section className="relative min-h-[78vh] overflow-hidden rounded-[2rem] border border-white/10 bg-[#050607] p-6 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.11),transparent_44%)]" />
      <div className="relative mx-auto flex min-h-[68vh] max-w-xl flex-col items-center justify-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-amber-200/30 bg-amber-100/[.06] shadow-[0_0_55px_rgba(255,210,120,.14)]"><Trophy size={38} /></div>
        <div className="mt-6 text-[10px] font-black uppercase tracking-[.45em] text-amber-100/55">TERRITORY CONQUERED</div>
        <h1 className="mt-3 text-4xl font-black tracking-tight">{selected.title}</h1>
        <div className="my-7 rounded-xl border border-white/10 bg-white/[.06] px-5 py-3 font-black"><Zap size={15} className="mr-2 inline" />+{reward.xp} XP</div>
        {reward.title && <div className="mb-6 rounded-xl border border-amber-200/15 bg-amber-200/[.04] px-5 py-3"><b>{reward.title}</b><span className="ml-2 text-xs text-white/40">Achievement unlocked</span></div>}
        {reward.lore && <p className="mb-6 max-w-md text-xs leading-5 text-white/35">{reward.lore}</p>}
        <button onClick={claim} className="rounded-xl bg-white px-7 py-3 font-black text-black shadow-[0_8px_30px_rgba(255,255,255,.12)]">Return to World <ChevronRight size={17} className="ml-1 inline" /></button>
      </div>
    </section>
  );

  if (screen === 'boss') return (
    <section className="min-h-[78vh] rounded-[2rem] border border-white/10 bg-[#050607] p-5 text-white">
      <button onClick={() => setScreen('chapter')} className="mb-6 flex items-center gap-2 text-xs font-bold text-white/45 transition hover:text-white"><ArrowLeft size={15} /> Chapter</button>
      <div className="relative mx-auto max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-black/55 p-7 text-center shadow-2xl">
        <div className="relative flex justify-center"><div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/[.04] shadow-[0_0_45px_rgba(255,255,255,.08)]"><Skull size={42} /></div></div>
        <div className="mt-5 text-[10px] font-black uppercase tracking-[.38em] text-white/35">BOSS CITADEL · PHASE {bossPhase + 1}/3</div>
        <h1 className="mt-3 text-4xl font-black">{selected.boss.name}</h1>
        <p className="mt-2 text-sm text-white/40">{['Hold your ground.', 'Break the pattern.', 'Finish the fight.'][bossPhase]}</p>
        <div className="my-7 flex gap-2">{[0, 1, 2].map(i => <span key={i} className={`h-1.5 flex-1 rounded-full ${bossPhase >= i ? 'bg-white' : 'bg-white/10'}`} />)}</div>
        <button onClick={hitBoss} className="w-full rounded-xl bg-white py-4 font-black text-black shadow-[0_8px_30px_rgba(255,255,255,.1)]">{bossPhase === 2 ? 'DEFEAT BOSS' : 'COMPLETE PHASE'} <ChevronRight size={17} className="ml-1 inline" /></button>
      </div>
    </section>
  );

  if (screen === 'chapter') return (
    <section className="min-h-[78vh] text-white">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => setScreen('world')} className="flex items-center gap-2 text-xs font-bold text-white/45 transition hover:text-white"><ArrowLeft size={15} /> World Map</button>
        <button onClick={() => { const n = !music; setMusic(n); setMusicEnabled(n); }} aria-label="Toggle music" className="rounded-xl border border-white/10 bg-white/[.04] p-2 transition hover:bg-white/[.09]">{music ? <Volume2 size={16} /> : <VolumeX size={16} />}</button>
      </div>
      <div className="mb-4 overflow-hidden rounded-[2rem] border border-white/10 bg-black/40 p-5 shadow-xl sm:p-6">
        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.32em] text-amber-100/45"><span className="h-1.5 w-1.5 rounded-full bg-amber-200" /> {selected.region.name} · CHAPTER {String(selected.number).padStart(2, '0')}</div>
        <div className="mt-3 flex items-end justify-between gap-4"><div><h1 className="text-3xl font-black tracking-tight sm:text-4xl">{selected.title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">{selected.description}</p></div><div className="text-right"><div className="text-3xl font-black">{Math.round(done / Math.max(1, rows.length) * 100)}%</div><div className="text-[8px] font-black uppercase tracking-[.2em] text-white/25">complete</div></div></div>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[.07]"><div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${done / Math.max(1, rows.length) * 100}%` }} /></div>
      </div>
      <div className="rounded-[2rem] border border-white/10 bg-black/40 p-4 shadow-xl sm:p-6">
        <div className="mb-4 flex items-center justify-between"><div><div className="text-[9px] font-black uppercase tracking-[.3em] text-white/25">MISSION LOG</div><b className="mt-1 block text-lg">Objectives</b></div><span className="rounded-lg border border-white/10 bg-white/[.04] px-2.5 py-1 text-xs font-black text-white/50">{done}/{rows.length}</span></div>
        <div className="space-y-2">{rows.map(({ m, p, done: d }) => <button key={m.id} onClick={() => complete(m)} className={`group flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition ${d ? 'border-white/10 bg-white/[.055] opacity-60' : 'border-white/10 bg-white/[.025] hover:border-white/20 hover:bg-white/[.05]'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${d ? 'border-white/20 bg-white/10' : 'border-white/10 bg-black/20'}`}>{d ? <Check size={15} /> : <Target size={15} />}</span><span className="min-w-0 flex-1"><b className="block truncate">{m.title}</b><span className="mt-0.5 block text-[10px] text-white/25">{d ? 'Objective secured' : 'Tap to claim when complete'}</span></span><span className="text-xs font-black text-white/45">{d ? 'DONE' : `${p}/${m.target}`}</span></button>)}</div>
        {done === rows.length ? <button onClick={() => { setBossPhase(0); setScreen('boss'); }} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-4 font-black text-black shadow-[0_8px_30px_rgba(255,255,255,.08)]"><Swords size={17} /> ENTER BOSS CITADEL</button> : <div className="mt-4 rounded-xl border border-white/5 bg-white/[.02] px-4 py-3 text-[10px] font-bold uppercase tracking-[.18em] text-white/25">Complete every objective to reveal the Boss Citadel.</div>}
      </div>
    </section>
  );

  return <WorldMap current={current} completed={state.storyChapter} level={state.level} open={open} />;
}

function WorldMap({ current, completed, level, open }: { current: number; completed: number; level: number; open: (c: StoryChapter) => void }) {
  const activeCount = Math.max(1, Math.min(30, completed + 1));
  const activeRoute = smoothPath(nodes.slice(0, activeCount));
  return (
    <section className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#050607] text-white shadow-2xl">
      <header className="relative z-30 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-black/65 px-4 py-3.5 backdrop-blur-xl sm:px-5">
        <div className="min-w-0"><div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[.38em] text-amber-100/55"><Map size={12} /> SYROX · THE SHATTERED REALM</div><div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1"><h1 className="text-2xl font-black tracking-tight sm:text-3xl">World Map</h1><span className="text-[9px] font-bold uppercase tracking-[.2em] text-white/25">30 Territories</span></div></div>
        <div className="flex items-center gap-2"><div className="min-w-[78px] rounded-xl border border-white/10 bg-white/[.035] px-3 py-2 text-right"><div className="text-[7px] font-black uppercase tracking-[.22em] text-white/30">Progress</div><div className="mt-0.5 text-base font-black">{completed}<span className="text-white/25">/30</span></div></div><div className="min-w-[88px] rounded-xl border border-amber-200/15 bg-amber-200/[.035] px-3 py-2 text-right"><div className="text-[7px] font-black uppercase tracking-[.22em] text-amber-100/40">Shadow</div><div className="mt-0.5 flex items-center justify-end gap-1 text-base font-black"><Zap size={12} /> {level}</div></div></div>
      </header>
      <div className="relative z-20 px-2.5 pt-2.5 sm:px-4 sm:pt-3.5">
        <div className="mb-2 flex items-center justify-between px-1 text-[8px] font-black uppercase tracking-[.24em] text-white/25"><span>THE SHATTERED REALM</span><span>SCROLL HORIZONTALLY</span></div>
        <div className="relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-black/60 shadow-[inset_0_0_50px_rgba(0,0,0,.45)]">
          <div className="pointer-events-none absolute left-0 top-0 z-20 h-full w-8 bg-gradient-to-r from-black/55 to-transparent" /><div className="pointer-events-none absolute right-0 top-0 z-20 h-full w-8 bg-gradient-to-l from-black/55 to-transparent" />
          <div className="syrox-map-scroll">
            <div className="syrox-map-canvas relative" style={{ width: MAP_W, height: MAP_H }}>
              <img src="/world-map-aaa-anime.webp.jpg" alt="Syrox World Map" draggable={false} loading="eager" decoding="async" className="syrox-map-image absolute inset-0 h-full w-full select-none object-cover" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_38%,rgba(0,0,0,.18)_70%,rgba(0,0,0,.5)_100%)]" />
              <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true" preserveAspectRatio="none">
                <defs>
                  <filter id="syrox-route-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                  <linearGradient id="syrox-route-gradient" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#b87925" /><stop offset="45%" stopColor="#e8b85a" /><stop offset="78%" stopColor="#fff0bb" /><stop offset="100%" stopColor="#ffffff" /></linearGradient>
                </defs>
                <path d={routeD} fill="none" stroke="rgba(0,0,0,.72)" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
                <path d={routeD} fill="none" stroke="rgba(255,213,120,.2)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
                <path d={routeD} fill="none" stroke="url(#syrox-route-gradient)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="18 10" />
                <path d={activeRoute} fill="none" stroke="rgba(255,255,255,.96)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" filter="url(#syrox-route-glow)" />
              </svg>
              {nodes.map(([x, y], index) => {
                const number = index + 1;
                const unlocked = number <= current;
                const conquered = number <= completed;
                const currentNode = number === current;
                const isFinal = number === 30;
                return <button key={number} onClick={() => unlocked && open(chapters[index])} disabled={!unlocked} aria-label={`Chapter ${number}${!unlocked ? ', locked' : ''}`} className="absolute z-10 -translate-x-1/2 -translate-y-1/2 disabled:cursor-not-allowed" style={{ left: x, top: y }}>
                  <span className={`relative flex h-[52px] w-[52px] items-center justify-center rounded-full border shadow-[0_7px_22px_rgba(0,0,0,.62)] transition duration-200 ${currentNode ? 'scale-125 border-white bg-black/95 ring-2 ring-white/25 shadow-[0_0_32px_rgba(255,255,255,.2)]' : conquered ? 'border-amber-200/90 bg-black/90 hover:scale-110 hover:shadow-[0_0_24px_rgba(255,210,120,.18)]' : unlocked ? 'border-white/65 bg-black/80 hover:scale-110' : 'border-white/15 bg-black/75 opacity-65'}`}>
                    {currentNode && <><span className="absolute inset-[-10px] animate-pulse rounded-full border border-white/65" /><span className="absolute inset-[-17px] rounded-full border border-white/10" /></>}
                    {isFinal && !conquered && <span className="absolute inset-[-5px] rounded-full border border-white/20" />}
                    <span className="absolute inset-[4px] rounded-full border border-white/10" />
                    {conquered ? <Check size={18} strokeWidth={3} /> : unlocked ? <span className="text-[13px] font-black tracking-tight">{String(number).padStart(2, '0')}</span> : <Lock size={15} />}
                    <span className={`absolute -bottom-5 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[7px] font-black tracking-[.14em] shadow-[0_4px_15px_rgba(0,0,0,.65)] ${currentNode ? 'border-white bg-white text-black' : conquered ? 'border-amber-200/25 bg-black/90 text-amber-100' : 'border-white/10 bg-black/85 text-white/55'}`}>{isFinal ? 'FINAL' : `CH ${String(number).padStart(2, '0')}`}</span>
                  </span>
                </button>;
              })}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between px-1 pb-1 pt-1.5 text-[8px] font-black uppercase tracking-[.2em] text-white/25"><span>30 CHAPTERS · ONE PATH</span><span>← DRAG →</span></div>
      </div>
      <footer className="relative z-20 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-black/55 px-4 py-2.5 text-[8px] font-black uppercase tracking-[.18em] text-white/30 sm:px-5"><span><span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-200" /> {completed}/30 conquered</span><span>Chapter {current}/30</span><span className="flex items-center gap-1.5"><Skull size={11} /> Boss Citadels await</span></footer>
    </section>
  );
}
