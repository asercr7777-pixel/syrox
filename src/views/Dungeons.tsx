import { useState } from 'react';
import { useStore } from '../store/useStore';
import { RANKS, getRankByXp, getRankIndex } from '../data/ranks';
import { DUNGEONS, type Dungeon, type DungeonReward } from '../data/dungeons';
import { RARITY_META, type Rarity } from '../data/collections';
import { Modal } from '../components/ui/Modal';
import { toast } from '../components/ui/Toast';
import { triggerConfetti } from '../components/ui/Confetti';
import { playSound } from '../lib/sound';
import { Swords, Lock, Check, Zap, Coins, Sparkles, Trophy, Award, Shield, Dumbbell, X, ChevronRight, Skull, Target, Crown } from 'lucide-react';
import '../stryven-dungeons.css';
import '../dungeons-performance.css';

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af', rare: '#3b82f6', epic: '#a855f7', legendary: '#f59e0b', mythic: '#ef4444', secret: '#fbbf24',
};

const DUNGEON_IMAGES: Record<string, string> = {
  'Awakening Gate': '/awakening-gate.webp.jpg',
  'Whispering Hollow': '/whispering-hollow.webp.jpg',
  'Stone Trial': '/stone-trial.webp.jpg',
  'Frost Cavern': '/frost-cavern.webp.jpg',
  'Storm Spire': '/storm-spire.webp.jpg',
  'Crimson Sanctum': '/crimson-sanctum.webp.jpg',
  'Inferno Keep': '/inferno-keep.webp.jpg',
  'Thunder Vault': '/thunder-vault.webp.jpg',
  'Dark Abyss': '/dark-abyss.webp.jpg',
  'Shadow Labyrinth': '/shadow-labyrinth.webp.jpg',
  "Hunter's Gauntlet": '/hunters-gauntlet.webp.jpg',
  "Monarch's Throne": '/monarchs-throne.webp.jpg',
  "Slayer's Coliseum": '/slayers-coliseum.webp.jpg',
  'Nightmare Sanctum': '/nightmare-sanctum.webp.jpg',
  'Doom Crucible': '/doom-crucible.webp.jpg',
  "Executioner's Block": '/executioners-block.webp.jpg',
  'Mythic Sanctuary': '/mythic-sanctuary.webp.jpg',
  'Hall of the Immortal': '/hall-of-the-immortal.webp.jpg',
  "Shadow King's Court": '/shadow-kings-court.webp.jpg',
  'System Overlord Citadel': '/system-overlord-citadel.webp.jpg',
};

export function Dungeons() {
  const { state, clearDungeon } = useStore();
  const [selectedDungeon, setSelectedDungeon] = useState<Dungeon | null>(null);
  const [activeDungeon, setActiveDungeon] = useState<Dungeon | null>(null);
  const [completedExercise, setCompletedExercise] = useState<Record<number, boolean>>({});
  const [showReward, setShowReward] = useState<Dungeon | null>(null);
  const [rewardDrops, setRewardDrops] = useState<any[]>([]);

  const currentRank = getRankByXp(state.xp);
  const currentRankIndex = getRankIndex(currentRank.id);
  const dungeonCompletedToday = state.dungeonClearedToday;
  const rankIds = RANKS.map((r) => r.id);

  const handleEnterDungeon = (dungeon: Dungeon) => {
    if (dungeonCompletedToday) {
      toast({ title: 'Already Cleared', message: 'You have already cleared a dungeon today. Return after midnight.', type: 'info' });
      return;
    }
    setSelectedDungeon(null);
    setActiveDungeon(dungeon);
    setCompletedExercise({});
    playSound('whoosh');
  };

  const handleCompleteExercise = (index: number) => {
    setCompletedExercise((prev) => ({ ...prev, [index]: true }));
    playSound('task');
  };

  const handleCompleteDungeon = () => {
    if (!activeDungeon) return;
    const drops = clearDungeon(activeDungeon.id) ?? [];
    setRewardDrops(drops);
    setShowReward(activeDungeon);
    setActiveDungeon(null);
    triggerConfetti(80);
  };

  const allExercisesDone = activeDungeon && activeDungeon.exercises.length > 0 && activeDungeon.exercises.every((_, i) => completedExercise[i]);

  return (
    <div className="stryven-raids">
      <section className="raid-hero">
        <div className="raid-hero__image" />
        <div className="raid-hero__veil" />
        <div className="raid-hero__content">
          <div className="raid-kicker"><span className="raid-kicker__line" /> DAILY RAID <span className="raid-kicker__line" /></div>
          <h1 className="raid-title">THE DUNGEONS</h1>
          <p className="raid-subtitle">Twenty trials. One hunter. Conquer the path from Awakening Gate to the System Overlord.</p>
          <div className="raid-status-row">
            <div className="raid-status"><Target size={15} /><span>RANK</span><strong>{currentRank.name}</strong></div>
            <div className="raid-status"><Zap size={15} /><span>XP</span><strong>{state.xp.toLocaleString()}</strong></div>
            <div className={`raid-status ${dungeonCompletedToday ? 'is-cleared' : ''}`}><Swords size={15} /><span>DAILY RAID</span><strong>{dungeonCompletedToday ? 'CLEARED' : 'READY'}</strong></div>
          </div>
        </div>
      </section>

      <section className="raid-section-head">
        <div>
          <div className="raid-section-kicker">THE RAID PATH</div>
          <h2>Choose your trial</h2>
        </div>
        <div className="raid-count">20 <span>RAIDS</span></div>
      </section>

      <section className="raid-rail" aria-label="Dungeon raids">
        {DUNGEONS.map((dungeon, idx) => {
          const rankIdx = rankIds.indexOf(dungeon.rankId);
          const isUnlocked = rankIdx <= currentRankIndex;
          const isCurrent = rankIdx === currentRankIndex;
          const rank = RANKS.find((r) => r.id === dungeon.rankId)!;
          const image = DUNGEON_IMAGES[dungeon.name];
          return (
            <button
              key={dungeon.id}
              className={`raid-card ${isCurrent ? 'is-current' : ''} ${!isUnlocked ? 'is-locked' : ''} ${dungeonCompletedToday && isCurrent ? 'is-cleared' : ''}`}
              style={{ ['--rank-color' as any]: rank.color, ['--delay' as any]: `${Math.min(idx * 35, 500)}ms` }}
              onClick={() => isUnlocked && setSelectedDungeon(dungeon)}
              disabled={!isUnlocked}
            >
              <img
                src={image}
                alt=""
                className="raid-card__image"
                loading={idx < 3 ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={idx < 2 ? 'high' : 'auto'}
                width="2160"
                height="3840"
              />
              <span className="raid-card__shade" />
              <span className="raid-card__top"><span className="raid-card__number">{String(idx + 1).padStart(2, '0')}</span><span className="raid-card__rank">{rank.name}</span></span>
              <span className="raid-card__bottom">
                <span className="raid-card__theme">{dungeon.theme}</span>
                <strong>{dungeon.name}</strong>
                <span className="raid-card__meta"><Zap size={11} /> {dungeon.rewardXp.toLocaleString()} XP <i /> {dungeon.exercises.length} TRIALS</span>
              </span>
              {!isUnlocked && <span className="raid-card__lock"><Lock size={18} /><small>LOCKED</small><em>{rank.name}</em></span>}
              {dungeonCompletedToday && isCurrent && <span className="raid-card__clear"><Check size={13} /> CLEARED TODAY</span>}
              {isCurrent && !dungeonCompletedToday && <span className="raid-card__current">CURRENT TRIAL</span>}
            </button>
          );
        })}
      </section>

      <div className="raid-scroll-hint"><ChevronRight size={14} /> DRAG OR SHIFT + SCROLL TO EXPLORE ALL RAIDS <ChevronRight size={14} /></div>

      <section className="raid-footer-panel">
        <div className="raid-footer-art" />
        <div className="raid-footer-copy"><span>THE FINAL DESTINATION</span><strong>Every raid gets harder.<br />The last gate waits.</strong></div>
        <div className="raid-footer-stats"><div><Skull size={17} /><b>20</b><span>RAIDS</span></div><div><Crown size={17} /><b>SS</b><span>APEX TIER</span></div><div><Trophy size={17} /><b>1</b><span>DAILY CLEAR</span></div></div>
      </section>

      <Modal open={selectedDungeon !== null} onClose={() => setSelectedDungeon(null)} title="" size="lg">
        {selectedDungeon && <DungeonPreview dungeon={selectedDungeon} currentRank={currentRank} onEnter={handleEnterDungeon} image={DUNGEON_IMAGES[selectedDungeon.name]} />}
      </Modal>

      <Modal open={activeDungeon !== null} onClose={() => setActiveDungeon(null)} title="" size="md">
        {activeDungeon && <div className="raid-run-modal">
          <div className="raid-run-art" style={{ backgroundImage: `url(${DUNGEON_IMAGES[activeDungeon.name]})` }}><div><span>RAID IN PROGRESS</span><strong>{activeDungeon.name}</strong></div><button onClick={() => setActiveDungeon(null)} aria-label="Close"><X size={18} /></button></div>
          <div className="raid-run-body">
            <p className="raid-run-copy">Complete every trial to clear the raid.</p>
            <div className="raid-progress"><span style={{ width: `${activeDungeon.exercises.length ? (Object.values(completedExercise).filter(Boolean).length / activeDungeon.exercises.length) * 100 : 0}%` }} /></div>
            <div className="raid-exercises">{activeDungeon.exercises.map((ex, i) => { const done = completedExercise[i]; return <button key={i} onClick={() => !done && handleCompleteExercise(i)} disabled={done} className={done ? 'done' : ''}><span className="raid-exercise-check">{done && <Check size={13} />}</span><Dumbbell size={16} /><span>{ex.name}</span><b>{ex.reps}{ex.isTime ? 's' : ' reps'}</b></button>; })}</div>
            {allExercisesDone && <button onClick={handleCompleteDungeon} className="raid-claim"><Trophy size={17} /> CLAIM RAID REWARDS</button>}
          </div>
        </div>}
      </Modal>

      <Modal open={showReward !== null} onClose={() => setShowReward(null)} title="" size="md">
        {showReward && <div className="raid-reward-modal">
          <div className="raid-reward-art" style={{ backgroundImage: `url(${DUNGEON_IMAGES[showReward.name]})` }}><div className="raid-reward-badge"><Trophy size={27} /></div></div>
          <div className="raid-reward-body"><span>RAID CLEARED</span><h3>{showReward.name}</h3><div className="raid-reward-list">{showReward.rewards.map((reward, i) => <RewardDisplayCard key={i} reward={reward} index={i} />)}{rewardDrops.length > 0 && rewardDrops.map((drop, i) => <div key={`drop-${i}`} className="raid-drop"><Sparkles size={15} /><span>{drop.label}</span>{drop.rarity && <b style={{ color: RARITY_META[drop.rarity as Rarity]?.color }}>{RARITY_META[drop.rarity as Rarity]?.label}</b>}</div>)}</div><button onClick={() => setShowReward(null)} className="raid-continue">CONTINUE</button></div>
        </div>}
      </Modal>
    </div>
  );
}

function DungeonPreview({ dungeon, currentRank, onEnter, image }: { dungeon: Dungeon; currentRank: ReturnType<typeof getRankByXp>; onEnter: (dungeon: Dungeon) => void; image: string }) {
  return <div className="raid-preview"><div className="raid-preview__art" style={{ backgroundImage: `url(${image})` }}><div className="raid-preview__overlay" /><div className="raid-preview__title"><span>{dungeon.theme}</span><h3>{dungeon.name}</h3><p>{dungeon.description}</p></div></div><div className="raid-preview__body"><div className="raid-preview__stats"><div><Zap size={15} /><span>REWARD XP</span><b>{dungeon.rewardXp.toLocaleString()}</b></div><div><Target size={15} /><span>TRIALS</span><b>{dungeon.exercises.length}</b></div><div><Crown size={15} /><span>RANK</span><b>{currentRank.name}</b></div></div><div className="raid-preview__label">TRIAL REQUIREMENTS</div><div className="raid-preview__exercises">{dungeon.exercises.map((ex, i) => <div key={i}><Dumbbell size={15} /><span>{ex.name}</span><b>{ex.reps}{ex.isTime ? 's' : ' reps'}</b></div>)}</div><div className="raid-preview__label">REWARDS</div><div className="raid-preview__rewards">{dungeon.rewards.filter((reward) => reward.type !== 'coins').map((reward, i) => <RewardCard key={i} reward={reward} />)}</div><button onClick={() => onEnter(dungeon)} className="raid-enter"><Swords size={17} /> ENTER RAID</button></div></div>;
}

function RewardCard({ reward }: { reward: DungeonReward }) {
  const color = reward.rarity ? RARITY_COLORS[reward.rarity] ?? '#9ca3af' : '#fbbf24';
  const icons: Record<string, typeof Zap> = { xp: Zap, coins: Coins, aura: Sparkles, title: Award, weapon: Swords, shield: Shield, badge: Trophy };
  const Icon = icons[reward.type] ?? Zap;
  return <div className="raid-reward-chip" style={{ ['--reward-color' as any]: color }}><Icon size={14} /><span>{reward.label}</span></div>;
}

function RewardDisplayCard({ reward, index }: { reward: DungeonReward; index: number }) {
  const color = reward.rarity ? RARITY_COLORS[reward.rarity] ?? '#9ca3af' : '#fbbf24';
  const icons: Record<string, typeof Zap> = { xp: Zap, coins: Coins, aura: Sparkles, title: Award, weapon: Swords, shield: Shield, badge: Trophy };
  const Icon = icons[reward.type] ?? Zap;
  return <div className="raid-reward-display" style={{ ['--reward-color' as any]: color, animationDelay: `${index * 80}ms` }}><div><Icon size={17} /></div><span>{reward.label}</span>{reward.rarity && <b>{RARITY_META[reward.rarity as Rarity]?.label ?? reward.rarity}</b>}</div>;
}
