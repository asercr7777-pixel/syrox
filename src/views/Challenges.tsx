import { useState } from 'react';
import { Award, CheckCircle2, Flame, Sparkles, Target, Trophy, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';
import { DAILY_CHALLENGES, WEEKLY_MISSIONS } from '../data/tasks';
import { BOSS_CHALLENGES } from '../data/challenges';
import { MILESTONES } from '../data/milestones';
import { getBadgeById, getFrameById, getTitleById } from '../data/collections';
import { capTaskXp, countTotalCompletedQuests, evaluateRequirement, snapshotFromState } from '../lib/progression';
import { PageHeader } from '../components/ui/PageHeader';
import { toast } from '../components/ui/Toast';
import type { ViewId } from '../components/Navigation';

type ChallengeFilter = 'all' | 'daily' | 'weekly' | 'boss' | 'milestones';

interface ChallengesProps {
  onNavigate?: (v: ViewId) => void;
}

export function Challenges({ onNavigate }: ChallengesProps) {
  const { state, claimChallenge, claimWeeklyMission, claimBossChallenge, claimMilestone } = useStore();
  const [section, setSection] = useState<ChallengeFilter>('all');
  const snap = snapshotFromState(state);

  const activeDaily = DAILY_CHALLENGES.filter((c) => state.dailyChallengeIds.includes(c.id));
  const activeWeekly = WEEKLY_MISSIONS.filter((m) => state.weeklyMissionIds.includes(m.id));
  const totalQuests = countTotalCompletedQuests(state);

  const milestoneCurrent = (type: (typeof MILESTONES)[number]['type']) => {
    switch (type) {
      case 'tasks':
        return totalQuests;
      case 'streak':
        return state.bestStreak;
      case 'workouts':
        return state.workoutSessions.length;
      case 'xp':
        return state.xp;
      default:
        return 0;
    }
  };

  const handleClaimBoss = (bossId: string, title: string, xp: number) => {
    const ok = claimBossChallenge(bossId);
    if (ok) {
      toast({
        title: `${title} Cleared`,
        message: `+${xp.toLocaleString()} XP and progression unlocks added to your profile.`,
        type: 'reward',
      });
    }
  };

  const showDaily = section === 'all' || section === 'daily';
  const showWeekly = section === 'all' || section === 'weekly';
  const showBoss = section === 'all' || section === 'boss';
  const showMilestones = section === 'all' || section === 'milestones';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Performance Trials"
        title="Challenges"
        description="Structured daily, weekly, and multi-stage Boss Challenges backed strictly by verified quests, workouts, and streaks."
        right={
          onNavigate && (
            <button type="button" onClick={() => onNavigate('profile')} className="btn-ghost text-xs">
              <Award size={15} className="text-gold-400" />
              <span>View Unlocked Gear</span>
            </button>
          )
        }
      />

      {/* Section Filter */}
      <nav aria-label="Challenge categories" className="flex flex-wrap gap-2 sv-surface p-1.5">
        {(
          [
            { id: 'all', label: 'All Challenges' },
            { id: 'daily', label: 'Daily' },
            { id: 'weekly', label: 'Weekly' },
            { id: 'boss', label: 'Boss Trials' },
            { id: 'milestones', label: 'Milestones' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSection(item.id)}
            className={`min-h-[44px] px-4 rounded-xl text-xs font-bold transition ${
              section === item.id ? 'btn-primary !min-h-[44px]' : 'text-ink-400 hover:bg-white/5 hover:text-ink-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Daily Challenges */}
      {showDaily && (
        <section className="sv-surface p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="eyebrow-label text-frost-400">24-Hour Objectives</p>
              <h2 className="mt-1 font-display text-xl font-bold text-ink-100">Daily Challenges</h2>
            </div>
            <Zap size={18} className="text-frost-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {activeDaily.map((ch) => {
              const claimed = Boolean(state.dailyChallengeCompleted[ch.id]);
              const ready = !claimed && ch.check(state);
              const xpReward = capTaskXp(ch.xp);
              return (
                <article
                  key={ch.id}
                  className={`rounded-xl border p-4 flex flex-col justify-between gap-3 ${
                    claimed
                      ? 'border-emerald-500/35 bg-emerald-500/10'
                      : ready
                        ? 'border-gold-500/45 bg-gold-500/10'
                        : 'border-white/10 bg-ink-950/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-ember-400">+{xpReward} XP</span>
                      <span className="font-mono text-[11px] text-ink-400">
                        {claimed ? 'Claimed' : ready ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                    <h3 className="mt-1.5 font-display text-base font-bold text-ink-100">{ch.label}</h3>
                    <p className="mt-1 text-xs text-ink-400 leading-relaxed">{ch.description}</p>
                  </div>
                  <button
                    type="button"
                    disabled={!ready}
                    onClick={() => {
                      claimChallenge(ch.id);
                      toast({ title: 'Daily challenge claimed', message: `+${xpReward} XP awarded.`, type: 'reward' });
                    }}
                    className={ready ? 'btn-primary w-full text-xs' : 'btn-ghost w-full text-xs'}
                  >
                    {claimed ? 'Claimed Today' : ready ? 'Claim Reward' : 'Not Yet Met'}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Weekly Objectives */}
      {showWeekly && (
        <section className="sv-surface p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="eyebrow-label text-ember-400">7-Day Commitments</p>
              <h2 className="mt-1 font-display text-xl font-bold text-ink-100">Weekly Challenges</h2>
            </div>
            <Target size={18} className="text-ember-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {activeWeekly.map((m) => {
              const current = m.progress(state);
              const pct = Math.min(100, Math.round((current / Math.max(1, m.target)) * 100));
              const claimed = Boolean(state.weeklyMissionCompleted[m.id]);
              const ready = !claimed && current >= m.target;
              return (
                <article key={m.id} className="glass-soft p-4 flex flex-col justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-base font-bold text-ink-100">{m.label}</h3>
                      <span className="font-mono text-xs font-bold text-ember-400">+{m.xp} XP</span>
                    </div>
                    <p className="text-xs text-ink-400">{m.description}</p>
                    <div className="flex justify-between text-xs font-mono tabular-nums text-ink-300">
                      <span>Progress</span>
                      <span>
                        {Math.min(current, m.target).toLocaleString()} / {m.target.toLocaleString()} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-ink-950 overflow-hidden border border-white/5">
                      <div className="h-full bg-ember-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!ready}
                    onClick={() => {
                      claimWeeklyMission(m.id);
                      toast({ title: `${m.label} Claimed`, message: `+${m.xp} XP awarded.`, type: 'reward' });
                    }}
                    className={ready ? 'btn-primary w-full text-xs' : 'btn-ghost w-full text-xs'}
                  >
                    {claimed ? 'Claimed This Week' : ready ? 'Claim Weekly XP' : `${m.target - Math.min(current, m.target)} Remaining`}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Multi-Stage Real-World Boss Challenges */}
      {showBoss && (
        <section className="sv-surface p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="eyebrow-label text-gold-400">Multi-Requirement Trials</p>
              <h2 className="mt-1 font-display text-xl font-bold text-ink-100">Boss Challenges</h2>
              <p className="text-xs text-ink-400 mt-0.5">
                Complete every real-world condition to clear the trial and unlock exclusive Titles, Frames, and Badges.
              </p>
            </div>
            <Trophy size={19} className="text-gold-400" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {BOSS_CHALLENGES.map((boss) => {
              const ev = evaluateRequirement(boss.requirement, snap);
              const claimed = Boolean(state.bossDefeated?.[boss.id]);
              const ready = !claimed && ev.unlocked;
              const unlockTitle = boss.unlockTitleId ? getTitleById(boss.unlockTitleId)?.name : null;
              const unlockFrame = boss.unlockFrameId ? getFrameById(boss.unlockFrameId)?.name : null;
              const unlockBadge = boss.unlockBadgeId ? getBadgeById(boss.unlockBadgeId)?.name : null;
              const unlocks = [unlockTitle && `Title: ${unlockTitle}`, unlockFrame && `Frame: ${unlockFrame}`, unlockBadge && `Badge: ${unlockBadge}`].filter(Boolean);

              return (
                <article
                  key={boss.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 ${
                    claimed
                      ? 'border-emerald-500/35 bg-emerald-500/10'
                      : ready
                        ? 'border-gold-500/50 bg-gold-500/10'
                        : 'border-white/10 bg-ink-950/70'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="eyebrow-label text-gold-400">
                          {boss.tier} · {boss.category}
                        </span>
                        <h3 className="mt-1 font-display text-lg font-bold text-ink-100">{boss.title}</h3>
                        <p className="text-xs text-ink-400">{boss.subtitle}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-sm font-bold text-ember-400">+{boss.xpReward.toLocaleString()} XP</span>
                        <span className="block font-mono text-[11px] tabular-nums text-ink-300 mt-0.5">{ev.pct}%</span>
                      </div>
                    </div>

                    <p className="text-xs text-ink-300 leading-relaxed">{boss.description}</p>

                    <div className="space-y-2 pt-1">
                      {ev.checks.map((c) => (
                        <div key={c.label} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className={c.met ? 'text-emerald-400 font-medium flex items-center gap-1.5' : 'text-ink-300'}>
                              {c.met && <CheckCircle2 size={13} />}
                              {c.label}
                            </span>
                            <span className="font-mono tabular-nums text-ink-200">
                              {c.current.toLocaleString()} / {c.target.toLocaleString()}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-ink-950 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${c.met ? 'bg-emerald-400' : 'bg-ember-500'}`}
                              style={{ width: `${Math.min(100, Math.round((c.current / Math.max(1, c.target)) * 100))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {unlocks.length > 0 && (
                      <div className="rounded-xl border border-white/10 bg-ink-900/60 px-3 py-2 text-[11px] text-ink-300 flex items-start gap-2">
                        <Sparkles size={14} className="text-gold-400 shrink-0 mt-0.5" />
                        <span>Unlocks: {unlocks.join(' · ')}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={!ready}
                    onClick={() => handleClaimBoss(boss.id, boss.title, boss.xpReward)}
                    className={ready ? 'btn-primary w-full text-xs' : 'btn-ghost w-full text-xs'}
                  >
                    {claimed ? 'Trial Cleared' : ready ? 'Claim Boss Reward' : 'Complete Requirements to Claim'}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Milestones */}
      {showMilestones && (
        <section className="sv-surface p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="eyebrow-label text-emerald-400">Lifetime Recognition</p>
              <h2 className="mt-1 font-display text-xl font-bold text-ink-100">Milestone Honors</h2>
            </div>
            <Flame size={18} className="text-emerald-400" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {MILESTONES.map((m) => {
              const current = milestoneCurrent(m.type);
              const pct = Math.min(100, Math.round((current / Math.max(1, m.threshold)) * 100));
              const claimed = state.milestoneClaimed.includes(m.id);
              const ready = !claimed && current >= m.threshold;
              return (
                <article key={m.id} className="glass-soft p-4 flex flex-col justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xl" aria-hidden="true">
                        {m.emoji}
                      </span>
                      <span className="font-mono text-xs font-bold text-ember-400">+{m.reward.xp.toLocaleString()} XP</span>
                    </div>
                    <h3 className="font-display text-base font-bold text-ink-100">{m.name}</h3>
                    <p className="text-xs text-ink-400">{m.description}</p>
                    <div className="flex justify-between text-[11px] font-mono tabular-nums text-ink-300">
                      <span>Progress</span>
                      <span>
                        {Math.min(current, m.threshold).toLocaleString()} / {m.threshold.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-ink-950 overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!ready}
                    onClick={() => {
                      claimMilestone(m.id);
                      toast({ title: `${m.name} Claimed`, message: `+${m.reward.xp.toLocaleString()} XP awarded.`, type: 'reward' });
                    }}
                    className={ready ? 'btn-primary w-full text-xs' : 'btn-ghost w-full text-xs'}
                  >
                    {claimed ? 'Claimed' : ready ? 'Claim Milestone' : `${pct}% Complete`}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
