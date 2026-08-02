import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Play, Lock, CheckCircle2, ChevronRight, ChevronLeft, Swords, Sparkles,
  Coins, Zap, Eye, Heart, Crosshair, Skull, MessageSquare, ScrollText,
  MapPin, Star, Award, Bot, Users, Shield, Crown, BookOpen,
  Trophy, Sun, Moon,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { toast } from '../components/ui/Toast';
import { triggerConfetti } from '../components/ui/Confetti';
import { STORY_CHAPTERS, STORY_REGIONS, getRegionByChapter, type StoryChapter } from '../data/storyData';
import { computeAIStoryState, getDynamicNPCDialogue } from '../lib/aiStoryteller';
import { STORY_NPCS, getNpcById } from '../data/storyNpcs';
import { FACTIONS } from '../data/storySystems';
import { WORLD_EVENTS, STORY_DUNGEONS, STORY_ACHIEVEMENTS, LORE_ENTRIES, generateAICoachAdvice, NG_PLUS_CONFIG, ENDGAME_ACTIVITIES } from '../data/storyExpansion';
import { useImmersion, getTimeLabel, getWeatherLabel, getWeatherEmoji } from '../lib/storyImmersion';

type Tab = 'world' | 'npcs' | 'factions' | 'dungeons' | 'lore' | 'endgame' | 'achievements' | 'coach';
type Screen = 'tabs' | 'chapter' | 'cinematic' | 'dialogue' | 'boss' | 'treasure' | 'reward' | 'log' | 'npc_detail' | 'event_detail';

export default function StoryMode() {
  const { state } = useStore();
  const [tab, setTab] = useState<Tab>('world');
  const [screen, setScreen] = useState<Screen>('tabs');
  const [selectedChapter, setSelectedChapter] = useState(state.storyChapterIndex);
  const [selectedNpc, setSelectedNpc] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <StoryHeader tab={tab} setTab={setTab} />
      {screen === 'tabs' && tab === 'world' && <WorldTab setScreen={setScreen} selectedChapter={selectedChapter} setSelectedChapter={setSelectedChapter} />}
      {screen === 'tabs' && tab === 'npcs' && <NpcsTab setSelectedNpc={(id) => { setSelectedNpc(id); setScreen('npc_detail'); }} />}
      {screen === 'tabs' && tab === 'factions' && <FactionsTab />}
      {screen === 'tabs' && tab === 'dungeons' && <DungeonsTab />}
      {screen === 'tabs' && tab === 'lore' && <LoreTab />}
      {screen === 'tabs' && tab === 'endgame' && <EndgameTab />}
      {screen === 'tabs' && tab === 'achievements' && <StoryAchievementsTab />}
      {screen === 'tabs' && tab === 'coach' && <CoachTab />}

      {screen === 'chapter' && <ChapterDetailScreen chapterIdx={selectedChapter} setScreen={setScreen} />}
      {screen === 'npc_detail' && selectedNpc && <NpcDetailScreen npcId={selectedNpc} onBack={() => setScreen('tabs')} />}
      {screen === 'cinematic' && <CinematicWrapper chapterIdx={selectedChapter} setScreen={setScreen} />}
      {screen === 'reward' && <RewardWrapper chapterIdx={selectedChapter} setScreen={setScreen} />}
      {screen === 'log' && <StoryLogScreen onBack={() => setScreen('tabs')} />}
    </div>
  );
}

// ============ HEADER + TABS ============

function StoryHeader({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const { state } = useStore();
  const immersion = useImmersion();
  const aiState = useMemo(() => computeAIStoryState(state), [state.history, state.streak]);

  const tabs: { id: Tab; label: string; icon: typeof MapPin }[] = [
    { id: 'world', label: 'World', icon: MapPin },
    { id: 'npcs', label: 'NPCs', icon: Users },
    { id: 'factions', label: 'Factions', icon: Shield },
    { id: 'dungeons', label: 'Dungeons', icon: Swords },
    { id: 'lore', label: 'Lore', icon: BookOpen },
    { id: 'endgame', label: 'Endgame', icon: Crown },
    { id: 'achievements', label: 'Awards', icon: Trophy },
    { id: 'coach', label: 'AI Coach', icon: Bot },
  ];

  return (
    <div className="space-y-4">
      {/* Cinematic header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-2xl border border-purple-500/20 overflow-hidden">
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${immersion.ambientColor}20, rgba(10,12,20,0.9))` }} />
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.5) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        {/* Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="absolute rounded-full" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, width: `${1 + (i % 3)}px`, height: `${1 + (i % 3)}px`, background: immersion.ambientColor, opacity: 0.3, animation: `floatParticle ${3 + (i % 4)}s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
        <div className="relative p-5 md:p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-white tracking-wide">Story Mode</h1>
              <p className="text-sm text-purple-200/70 mt-1">Chapter {state.storyChapterIndex + 1} of {STORY_CHAPTERS.length} · {STORY_REGIONS[Math.min(Math.floor(state.storyChapterIndex / 3), 15)].name}</p>
            </div>
            {/* Time / Weather indicator */}
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/10">
                {immersion.isNight ? <Moon size={14} className="text-purple-300" /> : <Sun size={14} className="text-amber-300" />}
                {getTimeLabel(immersion.timeOfDay)}
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/10">
                {getWeatherEmoji(immersion.weather)}
                {getWeatherLabel(immersion.weather)}
              </span>
            </div>
          </div>

          {/* AI storyteller summary bar */}
          <div className="mt-4 flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-purple-300">World Brightness</span>
                <span className="text-purple-200 tabular-nums">{aiState.worldBrightness}%</span>
              </div>
              <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                <motion.div animate={{ width: `${aiState.worldBrightness}%` }} className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #7c3aed, #facc15)' }} />
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-rose-300">Enemy Strength</span>
                <span className="text-rose-200 tabular-nums">{aiState.enemyStrength}%</span>
              </div>
              <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                <motion.div animate={{ width: `${aiState.enemyStrength}%` }} className="h-full rounded-full bg-gradient-to-r from-rose-600 to-rose-400" />
              </div>
            </div>
          </div>
          {state.activeWorldEvent && (
            <div className="mt-3 px-3 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-200 flex items-center gap-2">
              <Sparkles size={14} className="text-amber-400" /> World Event Active: {WORLD_EVENTS.find((e) => e.id === state.activeWorldEvent)?.name ?? 'Unknown'}
            </div>
          )}
        </div>
      </motion.div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-ink-950/60 rounded-xl border border-white/5 overflow-x-auto scrollbar-thin">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${tab === t.id ? 'bg-purple-500/20 text-purple-300' : 'text-ink-300 hover:bg-white/5'}`}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>
      <style>{`@keyframes floatParticle { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; } 50% { transform: translateY(-30px) scale(1.5); opacity: 0.8; } }`}</style>
    </div>
  );
}

// ============ WORLD TAB ============

function WorldTab({ setScreen, setSelectedChapter }: { setScreen: (s: Screen) => void; selectedChapter: number; setSelectedChapter: (n: number) => void }) {
  const { state } = useStore();
  const aiState = useMemo(() => computeAIStoryState(state), [state.history, state.streak]);
  const currentChapter = STORY_CHAPTERS[state.storyChapterIndex];
  const currentRegion = getRegionByChapter(state.storyChapterIndex + 1);

  const handleStartChapter = (idx: number) => {
    if (idx > state.storyChapterIndex) { toast({ title: 'Chapter Locked', message: 'Complete the current chapter first.', type: 'info' }); return; }
    setSelectedChapter(idx);
    setScreen('cinematic');
  };

  return (
    <div className="space-y-5">
      {/* AI Storyteller */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-purple-950/40 backdrop-blur-xl p-5 overflow-hidden">
        <div className="relative flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(124,58,237,0.1))', boxShadow: '0 0 20px rgba(168,85,247,0.3)' }}>
            <Bot size={20} className="text-purple-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-lg font-bold text-purple-100">AI Storyteller</h2>
            <p className="text-xs text-purple-300/70 mb-2">{aiState.narratorTone === 'hopeful' ? 'The world is bright' : aiState.narratorTone === 'dark' ? 'Darkness spreads' : 'The world holds its breath'}</p>
            <p className="text-sm text-purple-100/80 leading-relaxed">{aiState.dynamicDialogue}</p>
            <p className="mt-2 text-xs text-purple-200/60 italic border-l-2 border-purple-500/30 pl-3">{getDynamicNPCDialogue(state, currentRegion.name)}</p>
          </div>
        </div>
      </motion.div>

      {/* Region map */}
      <div className="space-y-3">
        <h2 className="section-title flex items-center gap-2"><MapPin size={18} className="text-purple-400" /> World Map · {STORY_REGIONS.length} Regions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {STORY_REGIONS.map((region) => {
            const chapters = STORY_CHAPTERS.filter((c) => c.regionId === region.id);
            const completed = chapters.filter((c) => state.storyCompletedChapters.includes(c.chapter - 1)).length;
            const isUnlocked = state.storyChapterIndex + 1 >= region.chapterRange[0];
            const isCurrent = state.storyChapterIndex + 1 >= region.chapterRange[0] && state.storyChapterIndex + 1 <= region.chapterRange[1];
            return (
              <motion.button key={region.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: isUnlocked ? 1 : 0.4, scale: 1 }} whileHover={isUnlocked ? { scale: 1.02 } : {}} onClick={() => { if (isUnlocked) { setSelectedChapter(region.chapterRange[0] - 1); setScreen('chapter'); } }} className={`relative rounded-2xl border p-4 text-left overflow-hidden transition-all ${isCurrent ? 'border-purple-500/40' : 'border-white/5'}`} style={{ background: `linear-gradient(135deg, ${region.color}15, transparent)` }}>
                {!isUnlocked && <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center"><Lock size={20} className="text-ink-500" /></div>}
                <div className="text-3xl mb-2">{region.emoji}</div>
                <p className="font-display text-sm font-bold" style={{ color: region.color }}>{region.name}</p>
                <p className="text-xs text-ink-400 mt-1 line-clamp-2">{region.description}</p>
                <div className="mt-2 flex items-center justify-between text-xs"><span className="text-ink-400">{completed}/{chapters.length} chapters</span>{isCurrent && <span className="chip bg-purple-500/20 text-purple-300 text-[10px]">Current</span>}</div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Current chapter */}
      <div className="card-premium p-5 border-purple-500/30">
        <div className="flex items-center gap-4">
          <div className="text-5xl">{currentChapter.emoji}</div>
          <div className="flex-1"><p className="text-xs text-purple-400 uppercase tracking-wider">Current Chapter {currentChapter.chapter}</p><h3 className="font-display text-xl font-bold">{currentChapter.title}</h3><p className="text-xs text-ink-300 mt-1 line-clamp-1">{currentChapter.description}</p></div>
          <button onClick={() => handleStartChapter(state.storyChapterIndex)} className="btn-primary text-sm flex items-center gap-2"><Play size={16} /> Play</button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StoryStatCard label="Chapters Cleared" value={state.storyCompletedChapters.length} color="#a855f7" />
        <StoryStatCard label="Bosses Defeated" value={Object.keys(state.storyBossDefeated).length} color="#f43f5e" />
        <StoryStatCard label="Side Quests" value={Object.values(state.storySideQuestsCompleted).filter(Boolean).length} color="#fbbf24" />
        <StoryStatCard label="Lore Found" value={state.loreUnlocked.length} color="#06b6d4" />
      </div>

      <button onClick={() => setScreen('log')} className="btn-ghost w-full text-sm flex items-center justify-center gap-2"><ScrollText size={16} /> View Story Timeline</button>
    </div>
  );
}

// ============ NPC TAB ============

function NpcsTab({ setSelectedNpc }: { setSelectedNpc: (id: string) => void }) {
  const { state } = useStore();
  return (
    <div className="space-y-4">
      <h2 className="section-title flex items-center gap-2"><Users size={18} className="text-purple-400" /> NPCs · {STORY_NPCS.length} Characters</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {STORY_NPCS.map((npc) => {
          const rep = state.npcReputation[npc.id] ?? 0;
          return (
            <motion.button key={npc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileHover={{ scale: 1.02 }} onClick={() => setSelectedNpc(npc.id)} className="relative rounded-2xl border border-white/5 p-4 text-left overflow-hidden hover:border-purple-500/30 transition-all" style={{ background: `linear-gradient(135deg, ${npc.color}10, transparent)` }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${npc.color}20`, border: `1px solid ${npc.color}40` }}>{npc.emoji}</div>
                <div className="flex-1 min-w-0"><p className="font-display text-sm font-bold truncate" style={{ color: npc.color }}>{npc.name}</p><p className="text-xs text-ink-400 truncate">{npc.title}</p></div>
              </div>
              <p className="text-xs text-ink-300 line-clamp-2">{npc.backstory}</p>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-ink-400">Rep: {rep}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: `${npc.color}20`, color: npc.color }}>{npc.role}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function NpcDetailScreen({ npcId, onBack }: { npcId: string; onBack: () => void }) {
  const { state, interactNPC, completeNPCQuest, advanceNPCDialogue } = useStore();
  const npc = getNpcById(npcId);
  const [dialogueIdx, setDialogueIdx] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  if (!npc) return null;
  const rep = state.npcReputation[npcId] ?? 0;
  const dialogueNode = npc.dialogueTree[dialogueIdx];

  const handleChoice = (choice: { id: string; reply: string; repChange?: number }) => {
    setSelectedChoice(choice.id);
    if (choice.repChange) interactNPC(npcId, choice.repChange);
    setTimeout(() => {
      if (dialogueIdx < npc.dialogueTree.length - 1) { setDialogueIdx(dialogueIdx + 1); setSelectedChoice(null); advanceNPCDialogue(npcId); }
    }, 2000);
  };

  const handleQuestComplete = (questId: string, label: string, xp: number, coins: number) => {
    if (state.npcQuestsCompleted[questId]) return;
    completeNPCQuest(questId);
    toast({ title: 'Quest Complete!', message: `${label} +${xp} XP +${coins} coins`, type: 'reward', icon: '📜' });
  };

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="btn-ghost text-sm flex items-center gap-2"><ChevronLeft size={16} /> Back to NPCs</button>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative rounded-2xl border overflow-hidden p-6" style={{ borderColor: `${npc.color}40`, background: `linear-gradient(135deg, ${npc.color}15, rgba(10,12,20,0.8))` }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0" style={{ background: `${npc.color}20`, border: `2px solid ${npc.color}` }}>{npc.emoji}</div>
          <div><h2 className="font-display text-2xl font-bold" style={{ color: npc.color }}>{npc.name}</h2><p className="text-sm text-ink-300">{npc.title}</p><p className="text-xs text-ink-400 mt-1">{npc.role}</p></div>
        </div>
        <p className="text-sm text-ink-200 italic leading-relaxed">{npc.backstory}</p>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-ink-400">Relationship</span>
          <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, rep)}%`, background: npc.color }} /></div>
          <span className="text-xs tabular-nums font-bold" style={{ color: npc.color }}>{rep}</span>
        </div>
      </motion.div>

      {/* Dialogue */}
      <div className="card-premium p-5">
        <h3 className="section-title flex items-center gap-2 mb-3"><MessageSquare size={16} style={{ color: npc.color }} /> Dialogue</h3>
        {dialogueNode && !selectedChoice && (
          <div className="rounded-xl border p-4" style={{ borderColor: `${npc.color}30`, background: `${npc.color}05` }}>
            <p className="text-sm text-ink-100 leading-relaxed mb-3">"{dialogueNode.text}"</p>
            <div className="space-y-2">
              {dialogueNode.choices.map((c) => (
                <button key={c.id} onClick={() => handleChoice(c)} className="w-full text-left p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/15 hover:border-purple-500/40 transition text-sm text-purple-200">{c.text}</button>
              ))}
            </div>
          </div>
        )}
        {selectedChoice && (
          <div className="rounded-xl border p-4" style={{ borderColor: `${npc.color}30`, background: `${npc.color}05` }}>
            <p className="text-sm text-ink-200 italic">"{npc.dialogueTree[dialogueIdx].choices.find((c) => c.id === selectedChoice)?.reply}"</p>
          </div>
        )}
        {dialogueIdx >= npc.dialogueTree.length - 1 && selectedChoice && (
          <p className="text-xs text-ink-400 mt-3 text-center">End of conversation. Come back later for more.</p>
        )}
      </div>

      {/* Personal Quests */}
      <div className="card-premium p-5">
        <h3 className="section-title flex items-center gap-2 mb-3"><ScrollText size={16} className="text-gold-400" /> Personal Quests</h3>
        <div className="space-y-2">
          {npc.personalQuests.map((q) => {
            const done = !!state.npcQuestsCompleted[q.id];
            return (
              <div key={q.id} className={`p-3 rounded-xl border flex items-center justify-between ${done ? 'bg-emerald2-500/10 border-emerald2-500/20' : 'bg-ink-950/40 border-white/5'}`}>
                <div className="flex-1"><p className={`text-sm font-medium ${done ? 'text-emerald2-400 line-through' : ''}`}>{q.label}</p><p className="text-xs text-ink-400 mt-0.5">{q.description}</p><p className="text-xs text-gold-400 mt-1">+{q.rewardXp} XP · +{q.rewardCoins} coins</p></div>
                {!done && <button onClick={() => handleQuestComplete(q.id, q.label, q.rewardXp, q.rewardCoins)} className="btn-ghost text-xs flex-shrink-0 ml-2">Claim</button>}
                {done && <CheckCircle2 size={16} className="text-emerald2-400 flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Unique Rewards */}
      <div className="card-premium p-5">
        <h3 className="section-title flex items-center gap-2 mb-3"><Sparkles size={16} className="text-purple-400" /> Unique Rewards</h3>
        <div className="space-y-2">
          {npc.uniqueRewards.map((r, i) => (
            <div key={i} className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 flex items-center gap-3">
              <Star size={16} className="text-purple-400" />
              <div><p className="text-sm font-medium text-purple-200">{r.label}</p><p className="text-xs text-ink-400">{r.description}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ FACTIONS TAB ============

function FactionsTab() {
  const { state, joinFaction, leaveFaction } = useStore();
  return (
    <div className="space-y-4">
      <h2 className="section-title flex items-center gap-2"><Shield size={18} className="text-purple-400" /> Factions</h2>
      {state.joinedFaction && (
        <div className="card-premium p-4 border-emerald2-500/30 flex items-center justify-between">
          <p className="text-sm text-emerald2-300">Current Faction: <span className="font-bold">{FACTIONS.find((f) => f.id === state.joinedFaction)?.name}</span></p>
          <button onClick={() => { leaveFaction(); toast({ title: 'Left faction', type: 'info' }); }} className="btn-ghost text-xs">Leave</button>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {FACTIONS.map((f) => {
          const isJoined = state.joinedFaction === f.id;
          return (
            <motion.div key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`rounded-2xl border p-5 overflow-hidden ${isJoined ? 'border-emerald2-500/40' : 'border-white/5'}`} style={{ background: `linear-gradient(135deg, ${f.color}10, transparent)` }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="text-4xl">{f.emoji}</div>
                <div><h3 className="font-display text-lg font-bold" style={{ color: f.color }}>{f.name}</h3><p className="text-xs text-ink-400 italic">"{f.motto}"</p></div>
              </div>
              <p className="text-sm text-ink-200 mb-3">{f.description}</p>
              <div className="space-y-1 mb-3">
                <p className="text-xs text-ink-400 uppercase tracking-wider">Join Requirement</p>
                <p className="text-xs text-ink-200">{f.joinRequirement}</p>
              </div>
              <div className="space-y-1 mb-3">
                <p className="text-xs text-ink-400 uppercase tracking-wider">Perks</p>
                {f.perks.map((p, i) => <p key={i} className="text-xs text-ink-200 flex items-center gap-1"><Sparkles size={10} style={{ color: f.color }} /> {p}</p>)}
              </div>
              <div className="space-y-1 mb-4">
                <p className="text-xs text-ink-400 uppercase tracking-wider">Unique Quests</p>
                {f.uniqueQuests.map((q) => <p key={q.id} className="text-xs text-ink-200">• {q.label}: <span className="text-ink-400">{q.rewardText}</span></p>)}
              </div>
              {!isJoined && <button onClick={() => { joinFaction(f.id); triggerConfetti(40); toast({ title: `Joined ${f.name}!`, type: 'reward', icon: f.emoji }); }} className="btn-primary w-full text-sm">Join Faction</button>}
              {isJoined && <div className="w-full py-2 rounded-xl bg-emerald2-500/10 border border-emerald2-500/30 text-center text-xs font-semibold text-emerald2-400 flex items-center justify-center gap-1.5"><CheckCircle2 size={14} /> Joined</div>}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ============ DUNGEONS TAB ============

function DungeonsTab() {
  const { state, clearStoryDungeon } = useStore();
  const difficultyColors: Record<string, string> = { Easy: '#10b981', Normal: '#3b82f6', Hard: '#f59e0b', Elite: '#a855f7', Nightmare: '#dc2626', Mythic: '#fbbf24', Secret: '#7c3aed' };
  return (
    <div className="space-y-4">
      <h2 className="section-title flex items-center gap-2"><Swords size={18} className="text-purple-400" /> Story Dungeons</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {STORY_DUNGEONS.map((d) => {
          const cleared = !!state.storyDungeonsCleared[d.id];
          const color = difficultyColors[d.difficulty];
          return (
            <motion.div key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border p-5" style={{ borderColor: `${color}30`, background: `linear-gradient(135deg, ${color}08, transparent)` }}>
              <div className="flex items-start gap-3 mb-3">
                <div className="text-3xl">{d.emoji}</div>
                <div className="flex-1"><h3 className="font-display text-base font-bold" style={{ color }}>{d.name}</h3><span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1" style={{ background: `${color}20`, color }}>{d.difficulty}</span></div>
                {cleared && <CheckCircle2 size={18} className="text-emerald2-400" />}
              </div>
              <p className="text-xs text-ink-300 mb-2">{d.description}</p>
              <div className="flex items-center gap-3 text-xs text-ink-400 mb-3">
                <span>Rec. Lv {d.recommendedLevel}</span><span>•</span><span>Boss: {d.bossEmoji} {d.bossName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gold-400">+{d.rewardXp} XP · +{d.rewardCoins} coins</span>
                {!cleared && <button onClick={() => { clearStoryDungeon(d.id); toast({ title: 'Dungeon Cleared!', message: d.name, type: 'reward', icon: d.emoji }); }} className="btn-primary text-xs">Clear</button>}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ============ LORE TAB ============

function LoreTab() {
  const { state, unlockLore } = useStore();
  const [category, setCategory] = useState<string>('all');
  const categories = ['all', 'regions', 'npcs', 'bosses', 'weapons', 'shields', 'auras', 'titles', 'artifacts', 'history'];
  const filtered = category === 'all' ? LORE_ENTRIES : LORE_ENTRIES.filter((e) => e.category === category);
  return (
    <div className="space-y-4">
      <h2 className="section-title flex items-center gap-2"><BookOpen size={18} className="text-purple-400" /> Lore Library · {state.loreUnlocked.length}/{LORE_ENTRIES.length}</h2>
      <div className="flex gap-1 flex-wrap">
        {categories.map((c) => <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${category === c ? 'bg-purple-500/20 text-purple-300' : 'text-ink-300 hover:bg-white/5'}`}>{c}</button>)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((entry) => {
          const unlocked = state.loreUnlocked.includes(entry.id);
          return (
            <motion.div key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`rounded-2xl border p-4 ${unlocked ? 'border-purple-500/20' : 'border-white/5'}`} style={{ background: 'rgba(10,12,20,0.6)' }}>
              {unlocked ? (
                <div>
                  <div className="flex items-center gap-2 mb-2"><span className="text-2xl">{entry.emoji}</span><div><p className="font-display text-sm font-bold text-purple-200">{entry.name}</p><p className="text-xs text-ink-400">{entry.title}</p></div></div>
                  <p className="text-xs text-ink-300 leading-relaxed">{entry.text}</p>
                </div>
              ) : (
                <div className="flex items-center gap-3 py-2">
                  <Lock size={20} className="text-ink-500" />
                  <div><p className="text-sm text-ink-400">Locked</p><p className="text-xs text-ink-500">{entry.unlockCondition}</p></div>
                  <button onClick={() => { unlockLore(entry.id); toast({ title: 'Lore Unlocked!', message: entry.name, type: 'info' }); }} className="btn-ghost text-xs ml-auto">Unlock</button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ============ ENDGAME TAB ============

function EndgameTab() {
  const { state, climbInfiniteTower, defeatDailyBoss, dealRaidDamage, defeatWeeklyRaid } = useStore();
  const todayKey = new Date().toISOString().slice(0, 10);
  const dailyAvailable = state.dailyBossDate !== todayKey;
  const raidAvailable = !state.weeklyRaidDefeated;

  return (
    <div className="space-y-4">
      <h2 className="section-title flex items-center gap-2"><Crown size={18} className="text-purple-400" /> Endgame Content</h2>
      {!state.storyCompletedChapters.includes(49) && (
        <div className="card-premium p-4 border-amber-500/30 flex items-center gap-3"><Lock size={18} className="text-amber-400" /><p className="text-sm text-ink-200">Complete the campaign (Chapter 50) to unlock all endgame content. Some activities are available now.</p></div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {ENDGAME_ACTIVITIES.map((a) => {
          const isTower = a.type === 'tower';
          const isDaily = a.type === 'daily_boss';
          const isRaid = a.type === 'weekly_raid';
          return (
            <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border p-5" style={{ borderColor: `${a.color}30`, background: `linear-gradient(135deg, ${a.color}08, transparent)` }}>
              <div className="flex items-start gap-3 mb-3">
                <div className="text-3xl">{a.emoji}</div>
                <div className="flex-1"><h3 className="font-display text-base font-bold" style={{ color: a.color }}>{a.name}</h3><p className="text-xs text-ink-300 mt-1">{a.description}</p></div>
              </div>
              <p className="text-xs text-ink-400 mb-3">{a.details}</p>
              <div className="flex items-center justify-between text-xs text-gold-400 mb-3">+{a.rewardXp} XP · +{a.rewardCoins} coins</div>
              {isTower && <div className="space-y-2"><p className="text-xs text-ink-400">Current Floor: <span className="font-bold text-purple-300">{state.infiniteTowerFloor}</span></p><button onClick={() => { climbInfiniteTower(state.infiniteTowerFloor + 1); toast({ title: `Floor ${state.infiniteTowerFloor + 1} cleared!`, type: 'reward', icon: '🗼' }); }} className="btn-primary w-full text-sm">Climb Next Floor</button></div>}
              {isDaily && <button disabled={!dailyAvailable} onClick={() => { defeatDailyBoss(); toast({ title: 'Daily Boss Defeated!', type: 'reward', icon: '📅' }); }} className="btn-primary w-full text-sm disabled:opacity-40">{dailyAvailable ? 'Fight Daily Boss' : 'Defeated Today'}</button>}
              {isRaid && <div className="space-y-2"><div className="h-2 bg-black/40 rounded-full overflow-hidden"><div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, state.weeklyRaidDamage / 100)}%` }} /></div><p className="text-xs text-ink-400">Damage: {state.weeklyRaidDamage}/100</p><div className="flex gap-2"><button onClick={() => { dealRaidDamage(10 + Math.random() * 20); toast({ title: 'Raid damage dealt!', type: 'success' }); }} className="btn-ghost text-xs flex-1">Attack (+10-30 dmg)</button><button disabled={!raidAvailable || state.weeklyRaidDamage < 100} onClick={() => { defeatWeeklyRaid(); triggerConfetti(80); toast({ title: 'Weekly Raid Defeated!', type: 'reward', icon: '⚔️' }); }} className="btn-primary text-xs disabled:opacity-40">Finish</button></div></div>}
              {(a.type === 'legendary_hunt' || a.type === 'secret_dimension') && <button onClick={() => toast({ title: 'Activity started!', message: a.name, type: 'info' })} className="btn-primary w-full text-sm">Begin</button>}
            </motion.div>
          );
        })}
      </div>
      {/* NG+ */}
      <div className="card-premium p-5 border-purple-500/30">
        <div className="flex items-center gap-3 mb-3"><Crown size={20} className="text-purple-400" /><h3 className="font-display text-lg font-bold text-purple-300">New Game+</h3></div>
        <p className="text-sm text-ink-300 mb-3">After completing the campaign, unlock New Game+ for stronger enemies, better rewards, new dialogue, hidden bosses, and secret chapters.</p>
        {state.ngPlusActive ? (
          <div className="space-y-2"><p className="text-xs text-emerald2-400 flex items-center gap-1"><CheckCircle2 size={14} /> New Game+ Active</p>{NG_PLUS_CONFIG.hiddenBosses.map((b) => <div key={b.id} className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5"><p className="text-sm font-semibold text-rose-300">{b.emoji} {b.name}</p><p className="text-xs text-ink-400">{b.description}</p></div>)}</div>
        ) : state.ngPlusUnlocked ? (
          <button onClick={() => toast({ title: 'NG+ activation', message: 'Use the store action to activate.', type: 'info' })} className="btn-primary w-full text-sm">Activate New Game+</button>
        ) : (
          <p className="text-xs text-ink-400 flex items-center gap-1"><Lock size={12} /> Complete all 50 chapters to unlock</p>
        )}
      </div>
    </div>
  );
}

// ============ ACHIEVEMENTS TAB ============

function StoryAchievementsTab() {
  const { state, unlockStoryAchievement } = useStore();
  return (
    <div className="space-y-4">
      <h2 className="section-title flex items-center gap-2"><Trophy size={18} className="text-purple-400" /> Story Achievements · {state.storyAchievementsUnlocked.length}/{STORY_ACHIEVEMENTS.length}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {STORY_ACHIEVEMENTS.map((a) => {
          const unlocked = state.storyAchievementsUnlocked.includes(a.id);
          return (
            <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`rounded-2xl border p-4 ${unlocked ? 'border-gold-500/30 bg-gold-500/5' : 'border-white/5'}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`text-2xl ${unlocked ? '' : 'grayscale opacity-50'}`}>{a.emoji}</div>
                <div className="flex-1"><p className={`text-sm font-bold ${unlocked ? 'text-gold-400' : 'text-ink-400'}`}>{a.name}</p><p className="text-xs text-ink-400">{a.description}</p></div>
                {unlocked && <CheckCircle2 size={16} className="text-gold-400" />}
              </div>
              <p className="text-xs text-gold-400/70 mb-2">+{a.rewardXp} XP · +{a.rewardCoins} coins</p>
              {!unlocked && <button onClick={() => { unlockStoryAchievement(a.id); triggerConfetti(40); toast({ title: 'Achievement Unlocked!', message: a.name, type: 'reward', icon: a.emoji }); }} className="btn-ghost text-xs">Unlock</button>}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ============ AI COACH TAB ============

function CoachTab() {
  const { state } = useStore();
  const advice = useMemo(() => generateAICoachAdvice(state), [state]);
  const priorityColors = { high: '#f43f5e', medium: '#f59e0b', low: '#10b981' };
  return (
    <div className="space-y-4">
      <h2 className="section-title flex items-center gap-2"><Bot size={18} className="text-purple-400" /> AI Coach</h2>
      <div className="card-premium p-5 border-purple-500/20">
        <div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(124,58,237,0.1))', boxShadow: '0 0 20px rgba(168,85,247,0.3)' }}><Bot size={24} className="text-purple-300" /></div><div><p className="font-display text-lg font-bold text-purple-100">NOVA AI Coach</p><p className="text-xs text-purple-300/70">Analyzing your real progress to provide daily advice</p></div></div>
        <p className="text-sm text-ink-200 mb-4">{advice[0]?.message ?? 'All habits on track.'}</p>
      </div>
      <div className="space-y-3">
        {advice.map((a) => (
          <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="card-premium p-4 border-l-4" style={{ borderLeftColor: priorityColors[a.priority] }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ background: `${priorityColors[a.priority]}20`, color: priorityColors[a.priority] }}>{a.priority}</span>
              <span className="text-xs text-ink-400">{a.category}</span>
            </div>
            <p className="text-sm font-semibold text-ink-100">{a.title}</p>
            <p className="text-xs text-ink-300 mt-1">{a.message}</p>
            <p className="text-xs text-purple-300 mt-2">{a.action}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============ CHAPTER DETAIL ============

function ChapterDetailScreen({ chapterIdx, setScreen }: { chapterIdx: number; setScreen: (s: Screen) => void }) {
  const { state, toggleStoryObjective, completeStorySideQuest, unlockStorySecretQuest, defeatStoryBoss } = useStore();
  const chapter = STORY_CHAPTERS[chapterIdx];
  const region = getRegionByChapter(chapterIdx + 1);
  const objectiveKey = `${chapterIdx}-0`;
  const missionCompleted = !!state.storyObjectivesCompleted[objectiveKey];
  const bossDefeated = !!state.storyBossDefeated[chapter.finalBoss.id];
  const [secretRevealed, setSecretRevealed] = useState(false);

  return (
    <div className="space-y-5">
      <button onClick={() => setScreen('tabs')} className="btn-ghost text-sm flex items-center gap-2"><ChevronLeft size={16} /> Back to World</button>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-2xl border border-purple-500/30 overflow-hidden p-6" style={{ background: `linear-gradient(135deg, ${region.color}20, rgba(10,12,20,0.8))` }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="text-6xl">{chapter.emoji}</div>
          <div><p className="text-xs text-purple-400 uppercase tracking-wider font-mono">Chapter {String(chapter.chapter).padStart(2, '0')} · {region.name}</p><h2 className="font-display text-2xl md:text-3xl font-bold text-white">{chapter.title}</h2></div>
        </div>
        <p className="text-ink-200 text-sm italic leading-relaxed max-w-2xl">{chapter.description}</p>
      </motion.div>

      <div className="card-premium p-5"><h3 className="section-title flex items-center gap-2 mb-3"><Crosshair size={16} className="text-ember-400" /> Main Mission</h3><div className={`p-4 rounded-xl border ${missionCompleted ? 'bg-emerald2-500/10 border-emerald2-500/30' : 'bg-ink-950/40 border-white/5'}`}><div className="flex items-center justify-between"><div className="flex-1"><p className={`font-semibold ${missionCompleted ? 'text-emerald2-400' : ''}`}>{chapter.mainMission.label}</p><p className="text-xs text-ink-400 mt-1">{chapter.mainMission.description}</p></div>{missionCompleted ? <CheckCircle2 size={24} className="text-emerald2-400" /> : <button onClick={() => { toggleStoryObjective(chapterIdx, 0); toast({ title: 'Mission Complete!', message: chapter.mainMission.label, type: 'success' }); }} className="btn-primary text-sm flex items-center gap-2"><Zap size={14} /> Complete</button>}</div></div></div>

      <div className="card-premium p-5"><h3 className="section-title flex items-center gap-2 mb-3"><ScrollText size={16} className="text-gold-400" /> Side Quests ({chapter.sideQuests.length})</h3><div className="space-y-2">{chapter.sideQuests.map((sq) => { const done = !!state.storySideQuestsCompleted[sq.id]; return <div key={sq.id} className={`p-3 rounded-xl border flex items-center justify-between ${done ? 'bg-emerald2-500/10 border-emerald2-500/20' : 'bg-ink-950/40 border-white/5'}`}><div className="flex-1 min-w-0"><p className={`text-sm font-medium truncate ${done ? 'text-emerald2-400 line-through' : ''}`}>{sq.label}</p><p className="text-xs text-ink-400 truncate">{sq.condition}</p><p className="text-xs text-gold-400 mt-0.5">+{sq.rewardXp} XP · +{sq.rewardCoins} coins</p></div>{!done && <button onClick={() => { completeStorySideQuest(sq.id); toast({ title: 'Side Quest Complete!', message: sq.label, type: 'reward', icon: '📜' }); }} className="btn-ghost text-xs flex-shrink-0 ml-2">Claim</button>}{done && <CheckCircle2 size={16} className="text-emerald2-400 flex-shrink-0" />}</div>; })}</div></div>

      <div className="card-premium p-5 border-purple-500/20"><h3 className="section-title flex items-center gap-2 mb-3"><Eye size={16} className="text-purple-400" /> Secret Quest</h3>{!secretRevealed && !state.storySecretQuestsUnlocked[chapter.secretQuest.id] ? <button onClick={() => setSecretRevealed(true)} className="w-full p-4 rounded-xl border border-dashed border-purple-500/30 text-center text-sm text-purple-300/60 hover:bg-purple-500/5 transition"><Sparkles size={20} className="mx-auto mb-2 text-purple-400" />A hidden quest lies dormant. Reveal it?</button> : <div className={`p-4 rounded-xl border ${state.storySecretQuestsUnlocked[chapter.secretQuest.id] ? 'bg-purple-500/10 border-purple-500/30' : 'bg-ink-950/40 border-white/5'}`}><p className="font-semibold text-purple-300">{chapter.secretQuest.label}</p><p className="text-xs text-ink-300 mt-1">{chapter.secretQuest.description}</p><p className="text-xs text-purple-400 mt-2">Unlock: {chapter.secretQuest.unlockCondition}</p><p className="text-xs text-gold-400 mt-1">+{chapter.secretQuest.rewardXp} XP · +{chapter.secretQuest.rewardCoins} coins</p>{!state.storySecretQuestsUnlocked[chapter.secretQuest.id] && <button onClick={() => { unlockStorySecretQuest(chapter.secretQuest.id); toast({ title: 'Secret Quest Unlocked!', type: 'reward', icon: '🔍' }); }} className="btn-ghost text-xs mt-2">Attempt Unlock</button>}{state.storySecretQuestsUnlocked[chapter.secretQuest.id] && <p className="text-xs text-emerald2-400 mt-2 flex items-center gap-1"><CheckCircle2 size={12} /> Unlocked</p>}</div>}</div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card-premium p-4"><h4 className="text-xs text-ember-400 uppercase tracking-wider mb-2">Elite Enemy</h4><div className="text-2xl mb-1">{chapter.eliteEnemy.emoji}</div><p className="text-sm font-semibold">{chapter.eliteEnemy.name}</p><p className="text-xs text-ink-400 mt-1">{chapter.eliteEnemy.description}</p><div className="mt-2 flex items-center gap-2"><Heart size={12} className="text-rose-400" /><div className="flex-1 h-2 bg-ink-950 rounded-full overflow-hidden"><div className="h-full bg-rose-500 rounded-full" style={{ width: '100%' }} /></div><span className="text-xs text-ink-300 tabular-nums">{chapter.eliteEnemy.hp}</span></div></div>
        <div className="card-premium p-4"><h4 className="text-xs text-ember-400 uppercase tracking-wider mb-2">Mini Boss</h4><div className="text-2xl mb-1">{chapter.miniBoss.emoji}</div><p className="text-sm font-semibold">{chapter.miniBoss.name}</p><p className="text-xs text-ink-400 mt-1">{chapter.miniBoss.description}</p><div className="mt-2 flex items-center gap-2"><Heart size={12} className="text-rose-400" /><div className="flex-1 h-2 bg-ink-950 rounded-full overflow-hidden"><div className="h-full bg-rose-500 rounded-full" style={{ width: '100%' }} /></div><span className="text-xs text-ink-300 tabular-nums">{chapter.miniBoss.hp}</span></div></div>
      </div>

      <BossPanel chapter={chapter} defeated={bossDefeated} onFight={() => { defeatStoryBoss(chapter.finalBoss.id); triggerConfetti(60); toast({ title: 'Boss Defeated!', message: chapter.finalBoss.name, type: 'reward', icon: chapter.finalBoss.emoji }); }} />

      <div className="card-premium p-5 border-gold-500/20"><h3 className="section-title flex items-center gap-2 mb-3"><Star size={16} className="text-gold-400" /> Treasure Room</h3><p className="text-xs text-ink-300 mb-3">{chapter.treasureRoom.description}</p>{!missionCompleted ? <div className="text-center py-4 text-sm text-ink-400"><Lock size={20} className="mx-auto mb-2" /> Complete the main mission to unlock</div> : <div className="space-y-2">{chapter.treasureRoom.rewards.map((r, i) => <div key={i} className="flex items-center gap-3 p-2 rounded-xl border border-gold-500/20 bg-gold-500/5">{r.type === 'coins' && <Coins size={16} className="text-gold-400" />}{r.type === 'xp' && <Zap size={16} className="text-ember-400" />}{(r.type === 'aura' || r.type === 'title' || r.type === 'weapon' || r.type === 'shield') && <Sparkles size={16} className="text-purple-400" />}<span className="text-xs font-medium text-gold-300">{r.label}</span></div>)}</div>}</div>

      <button onClick={() => setScreen('cinematic')} className="btn-primary w-full text-sm flex items-center justify-center gap-2"><Play size={16} /> Replay Cinematic</button>
    </div>
  );
}

function BossPanel({ chapter, defeated, onFight }: { chapter: StoryChapter; defeated: boolean; onFight: () => void }) {
  const boss = chapter.finalBoss;
  return <div className="card-premium p-5 border-rose-500/20" style={{ boxShadow: `0 0 30px ${boss.arenaColor}20` }}><h3 className="section-title flex items-center gap-2 mb-3"><Skull size={16} className="text-rose-400" /> Final Boss</h3><div className="flex items-start gap-4"><div className="text-5xl">{boss.emoji}</div><div className="flex-1"><p className="font-display text-lg font-bold text-rose-300">{boss.name}</p><p className="text-xs text-ink-400">{boss.title}</p><p className="text-xs text-ink-300 mt-1">{boss.description}</p><div className="flex items-center gap-2 mt-2"><Swords size={12} className="text-ember-400" /><span className="text-xs text-ink-400">Arena: {boss.arenaName}</span></div></div></div>{defeated ? <div className="mt-3 p-3 rounded-xl bg-emerald2-500/10 border border-emerald2-500/30 text-center text-sm text-emerald2-400 flex items-center justify-center gap-2"><CheckCircle2 size={16} /> Boss Defeated</div> : <button onClick={onFight} className="btn-danger w-full mt-3 text-sm flex items-center justify-center gap-2"><Swords size={16} /> Engage Boss</button>}</div>;
}

// ============ CINEMATIC ============

function CinematicWrapper({ chapterIdx, setScreen }: { chapterIdx: number; setScreen: (s: Screen) => void }) {
  const chapter = STORY_CHAPTERS[chapterIdx];
  const region = getRegionByChapter(chapterIdx + 1);
  const [phase] = useState<'opening' | 'ending'>('opening');
  const [done, setDone] = useState(false);
  const [displayed, setDisplayed] = useState('');
  const text = phase === 'opening' ? chapter.openingCinematic : chapter.endingCinematic;

  useEffect(() => {
    setDisplayed(''); setDone(false);
    let i = 0;
    const interval = setInterval(() => { if (i < text.length) { setDisplayed(text.slice(0, i + 1)); i++; } else { setDone(true); clearInterval(interval); } }, 30);
    return () => clearInterval(interval);
  }, [text]);

  const handleDone = () => {
    if (phase === 'opening') setScreen('chapter');
    else { setScreen('reward'); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: `radial-gradient(circle at 50% 50%, ${region.color}10, rgba(5,6,10,0.98))` }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">{Array.from({ length: 30 }, (_, i) => <div key={i} className="absolute rounded-full" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, width: `${1 + (i % 3)}px`, height: `${1 + (i % 3)}px`, background: region.color, opacity: 0.3, animation: `floatParticle ${3 + (i % 4)}s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }} />)}</div>
      <div className="relative max-w-2xl text-center">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }} className="text-6xl mb-6">{region.emoji}</motion.div>
        <p className="text-xs uppercase tracking-[0.3em] mb-4" style={{ color: region.color }}>{phase === 'opening' ? 'Opening Cinematic' : 'Ending Cinematic'} · Chapter {chapterIdx + 1}</p>
        <p className="text-lg text-ink-100 leading-relaxed min-h-[120px]">{displayed}<span className="animate-pulse">|</span></p>
        {done && <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={handleDone} className="btn-primary mt-8 text-sm flex items-center gap-2 mx-auto">{phase === 'opening' ? <><Play size={16} /> Begin Chapter</> : <><ChevronRight size={16} /> Continue</>}</motion.button>}
        {!done && <button onClick={() => { setDisplayed(text); setDone(true); }} className="mt-8 text-xs text-ink-400 hover:text-ink-200 underline">Skip</button>}
      </div>
      <style>{`@keyframes floatParticle { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; } 50% { transform: translateY(-30px) scale(1.5); opacity: 0.8; } }`}</style>
    </motion.div>
  );
}

// ============ REWARD ============

function RewardWrapper({ chapterIdx, setScreen }: { chapterIdx: number; setScreen: (s: Screen) => void }) {
  const { advanceStory } = useStore();
  const chapter = STORY_CHAPTERS[chapterIdx];
  const [claimed, setClaimed] = useState(false);
  const handleContinue = () => { if (!claimed) { advanceStory(); setClaimed(true); triggerConfetti(80); } setScreen('tabs'); };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }} className="relative w-full max-w-md text-center">
        <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ delay: 0.3, duration: 0.5 }} className="text-7xl mb-4">{chapter.emoji}</motion.div>
        <h2 className="font-display text-2xl font-bold text-purple-300 mb-2">Chapter {chapter.chapter} Complete!</h2>
        <p className="text-sm text-ink-300 mb-6 italic">{chapter.endingCinematic}</p>
        <div className="space-y-2 mb-6">{chapter.rewards.map((r, i) => <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="flex items-center gap-3 p-3 rounded-xl border border-purple-500/20 bg-purple-500/5"><Award size={20} className="text-purple-400" /><span className="text-sm font-medium text-purple-200">{r.label}</span></motion.div>)}</div>
        <button onClick={handleContinue} className="btn-primary text-sm flex items-center gap-2 mx-auto"><ChevronRight size={16} /> Return to World</button>
      </motion.div>
    </motion.div>
  );
}

// ============ STORY LOG ============

function StoryLogScreen({ onBack }: { onBack: () => void }) {
  const { state } = useStore();
  const log = state.storyLog;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="section-title flex items-center gap-2"><ScrollText size={18} className="text-purple-400" /> Story Timeline</h2><button onClick={onBack} className="btn-ghost text-sm">Back</button></div>
      {log.length === 0 ? <div className="card p-12 text-center"><ScrollText size={32} className="mx-auto text-ink-400 mb-3" /><p className="text-sm text-ink-300">No story events recorded yet.</p></div> : <div className="space-y-2">{log.slice().reverse().map((entry, i) => { const ch = STORY_CHAPTERS.find((c) => c.id === entry.chapterId); const icon = entry.type === 'boss' ? <Skull size={14} className="text-rose-400" /> : entry.type === 'dialogue' ? <MessageSquare size={14} className="text-frost-400" /> : <Play size={14} className="text-purple-400" />; return <div key={i} className="card p-3 flex items-center gap-3">{icon}<div className="flex-1"><p className="text-sm font-medium">{ch?.title ?? entry.chapterId}</p><p className="text-xs text-ink-400 capitalize">{entry.type}</p></div><span className="text-xs text-ink-400">{new Date(entry.timestamp).toLocaleDateString()}</span></div>; })}</div>}
    </div>
  );
}

// ============ HELPERS ============

function StoryStatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return <div className="card-premium p-4"><p className="text-xs text-ink-400 uppercase tracking-wider mb-1">{label}</p><p className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</p></div>;
}
