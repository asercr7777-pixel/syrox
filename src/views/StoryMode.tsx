import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Lock, CheckCircle2, ChevronRight, ChevronLeft, Swords, Sparkles,
  Coins, Zap, Eye, Heart, Crosshair, Skull, MessageSquare,
  ScrollText, MapPin, Star, Award, Bot,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { toast } from '../components/ui/Toast';
import { triggerConfetti } from '../components/ui/Confetti';
import { STORY_CHAPTERS, STORY_REGIONS, getRegionByChapter, type StoryChapter } from '../data/storyData';
import { computeAIStoryState, getDynamicNPCDialogue } from '../lib/aiStoryteller';

type Screen = 'world' | 'chapter' | 'cinematic' | 'dialogue' | 'mission' | 'boss' | 'treasure' | 'reward' | 'log';

export default function StoryMode() {
  const { state, advanceStory, toggleStoryObjective, setStoryChoice, completeStorySideQuest, unlockStorySecretQuest, defeatStoryBoss } = useStore();
  const [screen, setScreen] = useState<Screen>('world');
  const [selectedChapter, setSelectedChapter] = useState<number>(state.storyChapterIndex);
  const [cinematicText, setCinematicText] = useState('');
  const [cinematicType, setCinematicType] = useState<'opening' | 'ending'>('opening');
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [bossPhase, setBossPhase] = useState(0);
  const [bossHp, setBossHp] = useState(100);
  const [showChoices, setShowChoices] = useState(false);
  const [secretRevealed, setSecretRevealed] = useState(false);
  const [aiDialogue, setAiDialogue] = useState(false);

  const aiState = useMemo(() => computeAIStoryState(state), [state.history, state.streak]);
  const currentChapter = STORY_CHAPTERS[state.storyChapterIndex];
  const currentRegion = getRegionByChapter(state.storyChapterIndex + 1);
  const chapter = STORY_CHAPTERS[selectedChapter];

  // Auto-check secret quest unlock conditions
  useEffect(() => {
    if (state.streak >= 30) unlockStorySecretQuest('secret_30_streak');
    if (state.streak >= 100) unlockStorySecretQuest('secret_100_streak');
    const perfectDays = state.history.filter((h) => h.allMainDone).length;
    if (perfectDays >= 14) unlockStorySecretQuest('secret_14_perfect');
    if (perfectDays >= 50) unlockStorySecretQuest('secret_50_perfect');
  }, [state.streak, state.history, unlockStorySecretQuest]);

  const handleStartChapter = (idx: number) => {
    if (idx > state.storyChapterIndex) {
      toast({ title: 'Chapter Locked', message: 'Complete the current chapter first.', type: 'info' });
      return;
    }
    setSelectedChapter(idx);
    setCinematicType('opening');
    setCinematicText(STORY_CHAPTERS[idx].openingCinematic);
    setScreen('cinematic');
  };

  const handleCinematicDone = () => {
    if (cinematicType === 'opening') {
      setDialogueIndex(0);
      setShowChoices(false);
      setScreen('dialogue');
    } else {
      advanceStory();
      triggerConfetti(80);
      toast({ title: 'Chapter Complete!', message: 'Your story has been saved automatically.', type: 'reward', icon: '📖' });
      setScreen('reward');
    }
  };

  const handleDialogueNext = () => {
    const dialogues = chapter.dialogues;
    if (dialogueIndex < dialogues.length - 1) {
      const next = dialogueIndex + 1;
      setDialogueIndex(next);
      setShowChoices(!!dialogues[next].choices);
    } else {
      setScreen('chapter');
    }
  };

  const handleChoice = (choiceId: string) => {
    setStoryChoice(selectedChapter, choiceId);
    setShowChoices(false);
    setTimeout(() => handleDialogueNext(), 500);
  };

  const handleBossAttack = () => {
    const boss = chapter.finalBoss;
    const damage = 10 + Math.random() * 15;
    const newHp = Math.max(0, bossHp - damage);
    setBossHp(newHp);

    if (newHp <= 0 && bossPhase < boss.phases.length - 1) {
      setBossPhase(bossPhase + 1);
      setBossHp(boss.phases[bossPhase + 1].hp);
    } else if (newHp <= 0) {
      defeatStoryBoss(boss.id);
      setCinematicText(boss.defeatDialogue.join('\n\n'));
      setCinematicType('ending');
      setTimeout(() => setScreen('cinematic'), 1500);
    }
  };

  const handleCompleteMission = () => {
    toggleStoryObjective(selectedChapter, 0);
    toast({ title: 'Mission Complete!', message: chapter.mainMission.label, type: 'success' });
  };

  const handleCompleteSideQuest = (questId: string, label: string, rewardXp: number, rewardCoins: number) => {
    if (state.storySideQuestsCompleted[questId]) return;
    completeStorySideQuest(questId);
    toast({ title: 'Side Quest Complete!', message: `${label} +${rewardXp} XP +${rewardCoins} coins`, type: 'reward', icon: '📜' });
  };

  const objectiveKey = `${selectedChapter}-0`;
  const missionCompleted = !!state.storyObjectivesCompleted[objectiveKey];
  const bossDefeated = !!state.storyBossDefeated[chapter.finalBoss.id];

  // World map screen
  if (screen === 'world') {
    return (
      <div className="space-y-5">
        {/* AI Storyteller Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-purple-950/40 backdrop-blur-xl p-5 overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.5) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(124,58,237,0.1))', boxShadow: '0 0 20px rgba(168,85,247,0.3)' }}>
              <Bot size={20} className="text-purple-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-lg font-bold text-purple-100 tracking-wide">AI STORYTELLER</h2>
              <p className="text-xs text-purple-300/70 mb-2">
                {aiState.narratorTone === 'hopeful' ? '☀️ The world is bright' : aiState.narratorTone === 'dark' ? '🌑 Darkness spreads' : '🌫️ The world holds its breath'}
                {' · '}Brightness {aiState.worldBrightness}% · Enemies {aiState.enemyStrength}%
              </p>
              <p className="text-sm text-purple-100/80 leading-relaxed">{aiState.dynamicDialogue}</p>
              <button onClick={() => setAiDialogue(!aiDialogue)} className="mt-2 text-xs text-purple-400 hover:text-purple-300 underline">
                {aiDialogue ? 'Hide' : 'Show'} NPC dialogue
              </button>
              {aiDialogue && (
                <p className="mt-2 text-xs text-purple-200/60 italic border-l-2 border-purple-500/30 pl-3">
                  {getDynamicNPCDialogue(state, currentRegion.name)}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* World / Regions Map */}
        <div className="space-y-3">
          <h2 className="section-title flex items-center gap-2"><MapPin size={18} className="text-purple-400" /> World Map</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {STORY_REGIONS.map((region) => {
              const chapters = STORY_CHAPTERS.filter((c) => c.regionId === region.id);
              const completedInRegion = chapters.filter((c) => state.storyCompletedChapters.includes(c.chapter - 1)).length;
              const currentInRegion = state.storyChapterIndex + 1 >= region.chapterRange[0] && state.storyChapterIndex + 1 <= region.chapterRange[1];
              const isUnlocked = state.storyChapterIndex + 1 >= region.chapterRange[0];
              return (
                <motion.button
                  key={region.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: isUnlocked ? 1 : 0.4, scale: 1 }}
                  whileHover={isUnlocked ? { scale: 1.02 } : {}}
                  onClick={() => { if (isUnlocked) { setSelectedChapter(region.chapterRange[0] - 1); setScreen('chapter'); } }}
                  className={`relative rounded-2xl border p-4 text-left overflow-hidden transition-all ${currentInRegion ? 'border-purple-500/40' : 'border-white/5'} ${isUnlocked ? 'hover:border-purple-500/30' : ''}`}
                  style={{ background: `linear-gradient(135deg, ${region.color}15, transparent)` }}
                >
                  {!isUnlocked && <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center"><Lock size={20} className="text-ink-500" /></div>}
                  <div className="text-3xl mb-2">{region.emoji}</div>
                  <p className="font-display text-sm font-bold" style={{ color: region.color }}>{region.name}</p>
                  <p className="text-xs text-ink-400 mt-1 line-clamp-2">{region.description}</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-ink-400">{completedInRegion}/{chapters.length} chapters</span>
                    {currentInRegion && <span className="chip bg-purple-500/20 text-purple-300 text-[10px]">Current</span>}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Current Chapter Quick Access */}
        <div className="card-premium p-5 border-purple-500/30">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{currentChapter.emoji}</div>
            <div className="flex-1">
              <p className="text-xs text-purple-400 uppercase tracking-wider">Current Chapter {currentChapter.chapter}</p>
              <h3 className="font-display text-xl font-bold">{currentChapter.title}</h3>
              <p className="text-xs text-ink-300 mt-1 line-clamp-1">{currentChapter.description}</p>
            </div>
            <button onClick={() => handleStartChapter(state.storyChapterIndex)} className="btn-primary text-sm flex items-center gap-2">
              <Play size={16} /> Play
            </button>
          </div>
        </div>

        {/* Story Log */}
        <div className="flex items-center justify-between">
          <h2 className="section-title flex items-center gap-2"><ScrollText size={18} className="text-purple-400" /> Story Log</h2>
          <button onClick={() => setScreen('log')} className="btn-ghost text-sm">View Timeline</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4"><p className="text-xs text-ink-400 uppercase tracking-wider mb-1">Chapters Cleared</p><p className="text-2xl font-bold text-purple-400">{state.storyCompletedChapters.length}</p></div>
          <div className="card p-4"><p className="text-xs text-ink-400 uppercase tracking-wider mb-1">Bosses Defeated</p><p className="text-2xl font-bold text-rose-400">{Object.keys(state.storyBossDefeated).length}</p></div>
          <div className="card p-4"><p className="text-xs text-ink-400 uppercase tracking-wider mb-1">Side Quests</p><p className="text-2xl font-bold text-gold-400">{Object.keys(state.storySideQuestsCompleted).filter((k) => state.storySideQuestsCompleted[k]).length}</p></div>
        </div>
      </div>
    );
  }

  // Chapter detail screen
  if (screen === 'chapter') {
    return (
      <div className="space-y-5">
        <button onClick={() => setScreen('world')} className="btn-ghost text-sm flex items-center gap-2"><ChevronLeft size={16} /> World Map</button>
        <ChapterHeader chapter={chapter} region={currentRegion} />
        <ChapterMissionPanel chapter={chapter} missionCompleted={missionCompleted} onComplete={handleCompleteMission} />
        <SideQuestPanel chapter={chapter} completedMap={state.storySideQuestsCompleted} onComplete={handleCompleteSideQuest} />
        <SecretQuestPanel chapter={chapter} unlocked={!!state.storySecretQuestsUnlocked[chapter.secretQuest.id]} onUnlock={() => unlockStorySecretQuest(chapter.secretQuest.id)} revealed={secretRevealed} onReveal={() => setSecretRevealed(true)} />
        <EnemyPanel chapter={chapter} />
        <BossPanel chapter={chapter} defeated={bossDefeated} onFight={() => { setBossPhase(0); setBossHp(chapter.finalBoss.phases[0].hp); setScreen('boss'); }} />
        <TreasurePanel chapter={chapter} unlocked={missionCompleted} onOpen={() => setScreen('treasure')} />
        <button onClick={() => handleStartChapter(selectedChapter)} className="btn-primary w-full text-sm flex items-center justify-center gap-2"><Play size={16} /> Replay Cinematic</button>
      </div>
    );
  }

  // Cinematic screen
  if (screen === 'cinematic') {
    return (
      <CinematicScreen
        text={cinematicText}
        type={cinematicType}
        region={currentRegion}
        onDone={handleCinematicDone}
        chapterNum={selectedChapter + 1}
      />
    );
  }

  // Dialogue screen
  if (screen === 'dialogue') {
    const dialogue = chapter.dialogues[dialogueIndex];
    return (
      <DialogueScreen
        dialogue={dialogue}
        showChoices={showChoices}
        onChoice={handleChoice}
        onNext={handleDialogueNext}
        isLast={dialogueIndex >= chapter.dialogues.length - 1}
        onSkip={() => setScreen('chapter')}
      />
    );
  }

  // Boss battle screen
  if (screen === 'boss') {
    const boss = chapter.finalBoss;
    const phase = boss.phases[bossPhase];
    return (
      <BossBattleScreen
        boss={boss}
        phaseIndex={bossPhase}
        currentHp={bossHp}
        maxHp={phase.hp}
        onAttack={handleBossAttack}
        onFlee={() => setScreen('chapter')}
      />
    );
  }

  // Treasure room
  if (screen === 'treasure') {
    return (
      <TreasureScreen
        chapter={chapter}
        onContinue={() => setScreen('chapter')}
      />
    );
  }

  // Reward screen
  if (screen === 'reward') {
    return (
      <RewardScreen
        chapter={chapter}
        onContinue={() => setScreen('world')}
      />
    );
  }

  // Story log
  if (screen === 'log') {
    return (
      <StoryLogScreen
        onBack={() => setScreen('world')}
      />
    );
  }

  return null;
}

function ChapterHeader({ chapter, region }: { chapter: StoryChapter; region: ReturnType<typeof getRegionByChapter> }) {
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-2xl border border-purple-500/30 overflow-hidden p-6 md:p-8" style={{ background: `linear-gradient(135deg, ${region.color}20, rgba(10,12,20,0.8))` }}>
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.5) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <div className="relative">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-6xl">{chapter.emoji}</div>
          <div>
            <p className="text-xs text-purple-400 uppercase tracking-wider font-mono">Chapter {String(chapter.chapter).padStart(2, '0')} · {region.name}</p>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white">{chapter.title}</h2>
          </div>
        </div>
        <p className="text-ink-200 text-sm italic leading-relaxed max-w-2xl">{chapter.description}</p>
      </div>
    </motion.div>
  );
}

function ChapterMissionPanel({ chapter, missionCompleted, onComplete }: { chapter: StoryChapter; missionCompleted: boolean; onComplete: () => void }) {
  return (
    <div className="card-premium p-5">
      <h3 className="section-title flex items-center gap-2 mb-3"><Crosshair size={16} className="text-ember-400" /> Main Mission</h3>
      <div className={`p-4 rounded-xl border ${missionCompleted ? 'bg-emerald2-500/10 border-emerald2-500/30' : 'bg-ink-950/40 border-white/5'}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={`font-semibold ${missionCompleted ? 'text-emerald2-400' : ''}`}>{chapter.mainMission.label}</p>
            <p className="text-xs text-ink-400 mt-1">{chapter.mainMission.description}</p>
          </div>
          {missionCompleted ? (
            <CheckCircle2 size={24} className="text-emerald2-400 flex-shrink-0" />
          ) : (
            <button onClick={onComplete} className="btn-primary text-sm flex items-center gap-2"><Zap size={14} /> Complete</button>
          )}
        </div>
      </div>
    </div>
  );
}

function SideQuestPanel({ chapter, completedMap, onComplete }: { chapter: StoryChapter; completedMap: Record<string, boolean>; onComplete: (id: string, label: string, xp: number, coins: number) => void }) {
  return (
    <div className="card-premium p-5">
      <h3 className="section-title flex items-center gap-2 mb-3"><ScrollText size={16} className="text-gold-400" /> Side Quests ({chapter.sideQuests.length})</h3>
      <div className="space-y-2">
        {chapter.sideQuests.map((sq) => {
          const done = !!completedMap[sq.id];
          return (
            <div key={sq.id} className={`p-3 rounded-xl border flex items-center justify-between ${done ? 'bg-emerald2-500/10 border-emerald2-500/20' : 'bg-ink-950/40 border-white/5'}`}>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${done ? 'text-emerald2-400 line-through' : ''}`}>{sq.label}</p>
                <p className="text-xs text-ink-400 truncate">{sq.condition}</p>
                <p className="text-xs text-gold-400 mt-0.5">+{sq.rewardXp} XP · +{sq.rewardCoins} coins</p>
              </div>
              {!done && <button onClick={() => onComplete(sq.id, sq.label, sq.rewardXp, sq.rewardCoins)} className="btn-ghost text-xs flex-shrink-0 ml-2">Claim</button>}
              {done && <CheckCircle2 size={16} className="text-emerald2-400 flex-shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SecretQuestPanel({ chapter, unlocked, onUnlock, revealed, onReveal }: { chapter: StoryChapter; unlocked: boolean; onUnlock: () => void; revealed: boolean; onReveal: () => void }) {
  return (
    <div className="card-premium p-5 border-purple-500/20">
      <h3 className="section-title flex items-center gap-2 mb-3"><Eye size={16} className="text-purple-400" /> Secret Quest</h3>
      {!revealed && !unlocked ? (
        <button onClick={onReveal} className="w-full p-4 rounded-xl border border-dashed border-purple-500/30 text-center text-sm text-purple-300/60 hover:bg-purple-500/5 transition">
          <Sparkles size={20} className="mx-auto mb-2 text-purple-400" />
          A hidden quest lies dormant. Reveal it?
        </button>
      ) : (
        <div className={`p-4 rounded-xl border ${unlocked ? 'bg-purple-500/10 border-purple-500/30' : 'bg-ink-950/40 border-white/5'}`}>
          <p className="font-semibold text-purple-300">{chapter.secretQuest.label}</p>
          <p className="text-xs text-ink-300 mt-1">{chapter.secretQuest.description}</p>
          <p className="text-xs text-purple-400 mt-2">Unlock: {chapter.secretQuest.unlockCondition}</p>
          <p className="text-xs text-gold-400 mt-1">+{chapter.secretQuest.rewardXp} XP · +{chapter.secretQuest.rewardCoins} coins</p>
          {!unlocked && <button onClick={onUnlock} className="btn-ghost text-xs mt-2">Attempt Unlock</button>}
          {unlocked && <p className="text-xs text-emerald2-400 mt-2 flex items-center gap-1"><CheckCircle2 size={12} /> Unlocked</p>}
        </div>
      )}
    </div>
  );
}

function EnemyPanel({ chapter }: { chapter: StoryChapter }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="card-premium p-4">
        <h4 className="text-xs text-ember-400 uppercase tracking-wider mb-2">Elite Enemy</h4>
        <div className="text-2xl mb-1">{chapter.eliteEnemy.emoji}</div>
        <p className="text-sm font-semibold">{chapter.eliteEnemy.name}</p>
        <p className="text-xs text-ink-400 mt-1">{chapter.eliteEnemy.description}</p>
        <div className="mt-2 flex items-center gap-2">
          <Heart size={12} className="text-rose-400" />
          <div className="flex-1 h-2 bg-ink-950 rounded-full overflow-hidden"><div className="h-full bg-rose-500 rounded-full" style={{ width: '100%' }} /></div>
          <span className="text-xs text-ink-300 tabular-nums">{chapter.eliteEnemy.hp}</span>
        </div>
      </div>
      <div className="card-premium p-4">
        <h4 className="text-xs text-ember-400 uppercase tracking-wider mb-2">Mini Boss</h4>
        <div className="text-2xl mb-1">{chapter.miniBoss.emoji}</div>
        <p className="text-sm font-semibold">{chapter.miniBoss.name}</p>
        <p className="text-xs text-ink-400 mt-1">{chapter.miniBoss.description}</p>
        <div className="mt-2 flex items-center gap-2">
          <Heart size={12} className="text-rose-400" />
          <div className="flex-1 h-2 bg-ink-950 rounded-full overflow-hidden"><div className="h-full bg-rose-500 rounded-full" style={{ width: '100%' }} /></div>
          <span className="text-xs text-ink-300 tabular-nums">{chapter.miniBoss.hp}</span>
        </div>
      </div>
    </div>
  );
}

function BossPanel({ chapter, defeated, onFight }: { chapter: StoryChapter; defeated: boolean; onFight: () => void }) {
  const boss = chapter.finalBoss;
  return (
    <div className="card-premium p-5 border-rose-500/20" style={{ boxShadow: `0 0 30px ${boss.arenaColor}20` }}>
      <h3 className="section-title flex items-center gap-2 mb-3"><Skull size={16} className="text-rose-400" /> Final Boss</h3>
      <div className="flex items-start gap-4">
        <div className="text-5xl">{boss.emoji}</div>
        <div className="flex-1">
          <p className="font-display text-lg font-bold text-rose-300">{boss.name}</p>
          <p className="text-xs text-ink-400">{boss.title}</p>
          <p className="text-xs text-ink-300 mt-1">{boss.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <Swords size={12} className="text-ember-400" />
            <span className="text-xs text-ink-400">Arena: {boss.arenaName}</span>
            <span className="text-xs text-gold-400">+{boss.rewardXp} XP · +{boss.rewardCoins} coins</span>
          </div>
        </div>
      </div>
      {defeated ? (
        <div className="mt-3 p-3 rounded-xl bg-emerald2-500/10 border border-emerald2-500/30 text-center text-sm text-emerald2-400 flex items-center justify-center gap-2"><CheckCircle2 size={16} /> Boss Defeated</div>
      ) : (
        <button onClick={onFight} className="btn-danger w-full mt-3 text-sm flex items-center justify-center gap-2"><Swords size={16} /> Engage Boss</button>
      )}
    </div>
  );
}

function TreasurePanel({ chapter, unlocked, onOpen }: { chapter: StoryChapter; unlocked: boolean; onOpen: () => void }) {
  return (
    <div className="card-premium p-5 border-gold-500/20">
      <h3 className="section-title flex items-center gap-2 mb-3"><Star size={16} className="text-gold-400" /> Treasure Room</h3>
      <p className="text-xs text-ink-300 mb-3">{chapter.treasureRoom.description}</p>
      {!unlocked ? (
        <div className="text-center py-4 text-sm text-ink-400"><Lock size={20} className="mx-auto mb-2" /> Complete the main mission to unlock</div>
      ) : (
        <button onClick={onOpen} className="btn-primary w-full text-sm flex items-center justify-center gap-2"><Coins size={16} /> Open Treasure</button>
      )}
    </div>
  );
}

function CinematicScreen({ text, type, region, onDone, chapterNum }: { text: string; type: 'opening' | 'ending'; region: ReturnType<typeof getRegionByChapter>; onDone: () => void; chapterNum: number }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: `radial-gradient(circle at 50% 50%, ${region.color}10, rgba(5,6,10,0.98))` }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }, (_, i) => (
          <div key={i} className="absolute rounded-full" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, width: `${1 + (i % 3)}px`, height: `${1 + (i % 3)}px`, background: region.color, opacity: 0.3, animation: `floatParticle ${3 + (i % 4)}s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
      <div className="relative max-w-2xl text-center">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }} className="text-6xl mb-6">{region.emoji}</motion.div>
        <p className="text-xs uppercase tracking-[0.3em] mb-4" style={{ color: region.color }}>{type === 'opening' ? 'Opening Cinematic' : 'Ending Cinematic'} · Chapter {chapterNum}</p>
        <p className="text-lg text-ink-100 leading-relaxed min-h-[120px]">{displayed}<span className="animate-pulse">|</span></p>
        {done && (
          <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={onDone} className="btn-primary mt-8 text-sm flex items-center gap-2 mx-auto">
            {type === 'opening' ? <><Play size={16} /> Begin Chapter</> : <><ChevronRight size={16} /> Continue</>}
          </motion.button>
        )}
        {!done && <button onClick={() => { setDisplayed(text); setDone(true); }} className="mt-8 text-xs text-ink-400 hover:text-ink-200 underline">Skip</button>}
      </div>
    </motion.div>
  );
}

function DialogueScreen({ dialogue, showChoices, onChoice, onNext, isLast, onSkip }: { dialogue: any; showChoices: boolean; onChoice: (id: string) => void; onNext: () => void; isLast: boolean; onSkip: () => void }) {
  const isPlayer = dialogue.speakerType === 'player';
  const isBoss = dialogue.speakerType === 'boss';
  const isNarrator = dialogue.speakerType === 'narrator';
  const accentColor = isPlayer ? '#ff7a18' : isBoss ? '#f43f5e' : isNarrator ? '#a855f7' : '#38bdf8';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[60] flex items-end justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => { if (!showChoices) onNext(); }}>
      <div className="relative w-full max-w-2xl">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full flex items-center justify-center text-3xl" style={{ background: `${accentColor}20`, border: `2px solid ${accentColor}` }}>
          {isPlayer ? '🧑' : isBoss ? '👹' : isNarrator ? '📖' : '🧙'}
        </div>
        <div className="rounded-2xl border p-5 bg-slate-900/90 backdrop-blur-xl" style={{ borderColor: `${accentColor}40` }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: accentColor }}>{dialogue.speaker}</p>
          <p className="text-base text-ink-100 leading-relaxed mb-3">{dialogue.text}</p>
          {showChoices && dialogue.choices && (
            <div className="space-y-2 mt-4">
              {dialogue.choices.map((choice: any) => (
                <button key={choice.id} onClick={(e) => { e.stopPropagation(); onChoice(choice.id); }} className="w-full text-left p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/15 hover:border-purple-500/40 transition-all text-sm">
                  <span className="text-purple-200">{choice.text}</span>
                  {choice.rewardText && <span className="block text-xs text-gold-400 mt-1">{choice.rewardText}</span>}
                </button>
              ))}
            </div>
          )}
          {!showChoices && (
            <div className="flex items-center justify-between mt-3">
              <button onClick={(e) => { e.stopPropagation(); onSkip(); }} className="text-xs text-ink-400 hover:text-ink-200">Skip</button>
              <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="text-xs text-purple-300 hover:text-purple-200 flex items-center gap-1">
                {isLast ? 'Continue' : 'Next'} <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function BossBattleScreen({ boss, phaseIndex, currentHp, maxHp, onAttack, onFlee }: { boss: any; phaseIndex: number; currentHp: number; maxHp: number; onAttack: () => void; onFlee: () => void }) {
  const phase = boss.phases[phaseIndex];
  const hpPct = (currentHp / maxHp) * 100;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-4" style={{ background: `radial-gradient(circle at 50% 30%, ${boss.arenaColor}20, rgba(5,6,10,0.98))` }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="absolute rounded-full" style={{ left: `${(i * 31) % 100}%`, top: `${(i * 47) % 100}%`, width: '2px', height: '2px', background: boss.arenaColor, opacity: 0.4, animation: `floatParticle ${2 + (i % 3)}s ease-in-out infinite`, animationDelay: `${i * 0.3}s` }} />
        ))}
      </div>
      <div className="relative w-full max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.2em] mb-2" style={{ color: boss.arenaColor }}>{boss.arenaName}</p>
        <motion.div key={phaseIndex} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }} className="text-8xl mb-4" style={{ filter: `drop-shadow(0 0 20px ${boss.arenaColor})` }}>
          {boss.emoji}
        </motion.div>
        <h2 className="font-display text-2xl font-bold text-rose-300">{boss.name}</h2>
        <p className="text-xs text-ink-400 mb-4">Phase {phaseIndex + 1}: {phase.name}</p>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-ink-300">HP</span>
            <span className="text-xs text-rose-400 tabular-nums">{Math.ceil(currentHp)}/{maxHp}</span>
          </div>
          <div className="h-3 bg-ink-950 rounded-full overflow-hidden border border-rose-500/20">
            <motion.div animate={{ width: `${hpPct}%` }} transition={{ duration: 0.3 }} className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full" style={{ boxShadow: '0 0 10px rgba(244,63,94,0.5)' }} />
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.p key={phaseIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm italic text-rose-200/70 mb-6 min-h-[40px]">"{phase.dialogue}"</motion.p>
        </AnimatePresence>
        <div className="flex gap-3">
          <button onClick={onFlee} className="btn-ghost text-sm flex-1">Flee</button>
          <button onClick={onAttack} className="btn-danger text-sm flex-[2] flex items-center justify-center gap-2"><Swords size={18} /> Attack with Discipline</button>
        </div>
      </div>
      <style>{`@keyframes floatParticle { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; } 50% { transform: translateY(-30px) scale(1.5); opacity: 0.8; } }`}</style>
    </motion.div>
  );
}

function TreasureScreen({ chapter, onContinue }: { chapter: StoryChapter; onContinue: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-md text-center">
        <motion.div initial={{ rotate: -10, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="text-8xl mb-6">🪙</motion.div>
        <h2 className="font-display text-2xl font-bold text-gold-400 mb-2">Treasure Room</h2>
        <p className="text-sm text-ink-300 mb-6">{chapter.treasureRoom.description}</p>
        <div className="space-y-2 mb-6">
          {chapter.treasureRoom.rewards.map((r, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="flex items-center gap-3 p-3 rounded-xl border border-gold-500/20 bg-gold-500/5">
              {r.type === 'coins' && <Coins size={20} className="text-gold-400" />}
              {r.type === 'xp' && <Zap size={20} className="text-ember-400" />}
              {(r.type === 'aura' || r.type === 'title' || r.type === 'weapon' || r.type === 'shield') && <Sparkles size={20} className="text-purple-400" />}
              <span className="text-sm font-medium text-gold-300">{r.label}</span>
            </motion.div>
          ))}
        </div>
        <button onClick={onContinue} className="btn-primary text-sm flex items-center gap-2 mx-auto"><ChevronRight size={16} /> Continue</button>
      </motion.div>
    </motion.div>
  );
}

function RewardScreen({ chapter, onContinue }: { chapter: StoryChapter; onContinue: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }} className="relative w-full max-w-md text-center">
        <motion.div initial={{ rotate: 0 }} animate={{ rotate: [0, -10, 10, 0] }} transition={{ delay: 0.3, duration: 0.5 }} className="text-7xl mb-4">{chapter.emoji}</motion.div>
        <h2 className="font-display text-2xl font-bold text-purple-300 mb-2">Chapter {chapter.chapter} Complete!</h2>
        <p className="text-sm text-ink-300 mb-6 italic">{chapter.endingCinematic}</p>
        <div className="space-y-2 mb-6">
          {chapter.rewards.map((r, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="flex items-center gap-3 p-3 rounded-xl border border-purple-500/20 bg-purple-500/5">
              <Award size={20} className="text-purple-400" />
              <span className="text-sm font-medium text-purple-200">{r.label}</span>
            </motion.div>
          ))}
        </div>
        <button onClick={onContinue} className="btn-primary text-sm flex items-center gap-2 mx-auto"><ChevronRight size={16} /> Return to World</button>
      </motion.div>
    </motion.div>
  );
}

function StoryLogScreen({ onBack }: { onBack: () => void }) {
  const { state } = useStore();
  const log = state.storyLog;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title flex items-center gap-2"><ScrollText size={18} className="text-purple-400" /> Story Timeline</h2>
        <button onClick={onBack} className="btn-ghost text-sm">Back</button>
      </div>
      {log.length === 0 ? (
        <div className="card p-12 text-center"><ScrollText size={32} className="mx-auto text-ink-400 mb-3" /><p className="text-sm text-ink-300">No story events recorded yet. Play through chapters to build your timeline.</p></div>
      ) : (
        <div className="space-y-2">
          {log.slice().reverse().map((entry, i) => {
            const ch = STORY_CHAPTERS.find((c) => c.id === entry.chapterId);
            const icon = entry.type === 'boss' ? <Skull size={14} className="text-rose-400" /> : entry.type === 'dialogue' ? <MessageSquare size={14} className="text-frost-400" /> : <Play size={14} className="text-purple-400" />;
            return (
              <div key={i} className="card p-3 flex items-center gap-3">
                {icon}
                <div className="flex-1"><p className="text-sm font-medium">{ch?.title ?? entry.chapterId}</p><p className="text-xs text-ink-400 capitalize">{entry.type}</p></div>
                <span className="text-xs text-ink-400">{new Date(entry.timestamp).toLocaleDateString()}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
