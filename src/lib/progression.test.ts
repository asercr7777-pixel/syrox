import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanSupabaseUrl,
  capTaskXp,
  calculateDailyXpAward,
  calculateDisciplineScoreFromTasks,
  sanitizeDayIndex,
  formatTimerClock,
  evaluateRequirement,
  countTodayCompletedQuests,
  type ProgressionSnapshot,
} from './progression.ts';
import { SKILL_NODES } from '../data/skillTree.ts';
import { BOSS_CHALLENGES } from '../data/challenges.ts';

describe('cleanSupabaseUrl', () => {
  it('strips trailing slashes and accidental /rest/v1/ path', () => {
    assert.equal(cleanSupabaseUrl('https://abc.supabase.co/rest/v1/'), 'https://abc.supabase.co');
    assert.equal(cleanSupabaseUrl('  https://abc.supabase.co/rest/v1  '), 'https://abc.supabase.co');
    assert.equal(cleanSupabaseUrl('https://abc.supabase.co///'), 'https://abc.supabase.co');
  });

  it('returns empty string for undefined or blank input', () => {
    assert.equal(cleanSupabaseUrl(undefined), '');
    assert.equal(cleanSupabaseUrl('   '), '');
  });
});

describe('capTaskXp', () => {
  it('clamps task XP strictly between 0 and 200', () => {
    assert.equal(capTaskXp(-50), 0);
    assert.equal(capTaskXp(120.9), 120);
    assert.equal(capTaskXp(500), 200);
    assert.equal(capTaskXp(Number.NaN), 0);
  });
});

describe('calculateDailyXpAward', () => {
  it('enforces the 10,000 daily XP cap', () => {
    const res = calculateDailyXpAward(9950, 100, false, 10000);
    assert.deepEqual(res, { awardedXp: 50, newDailyXp: 10000, capped: true });
  });

  it('awards double XP when boost is active within cap', () => {
    const res = calculateDailyXpAward(100, 150, true, 10000);
    assert.deepEqual(res, { awardedXp: 300, newDailyXp: 400, capped: false });
  });

  it('awards 0 XP once cap is already reached', () => {
    const res = calculateDailyXpAward(10000, 200, true, 10000);
    assert.deepEqual(res, { awardedXp: 0, newDailyXp: 10000, capped: true });
  });
});

describe('calculateDisciplineScoreFromTasks', () => {
  it('counts only enabled core tasks plus custom tasks', () => {
    const core = [
      { id: 'c1', enabled: true },
      { id: 'c2', enabled: true },
      { id: 'c3', enabled: false },
    ];
    const custom = [{ id: 'x1' }, { id: 'x2' }];
    const score = calculateDisciplineScoreFromTasks(
      core,
      { c1: true, c3: true },
      custom,
      { x1: true },
    );
    assert.equal(score, 50);
  });

  it('returns 0 when no tasks exist', () => {
    assert.equal(calculateDisciplineScoreFromTasks([], {}, [], {}), 0);
  });
});

describe('sanitizeDayIndex and formatTimerClock', () => {
  it('falls back to day 0 for out-of-range indices', () => {
    assert.equal(sanitizeDayIndex(3), 3);
    assert.equal(sanitizeDayIndex(-1), 0);
    assert.equal(sanitizeDayIndex(6), 0);
    assert.equal(sanitizeDayIndex('bad'), 0);
  });

  it('formats hh:mm:ss cleanly', () => {
    assert.equal(formatTimerClock(0), '00:00:00');
    assert.equal(formatTimerClock(3661), '01:01:01');
    assert.equal(formatTimerClock(-10), '00:00:00');
  });
});

describe('evaluateRequirement for Skill Tree and Boss Challenges', () => {
  const zeroSnap: ProgressionSnapshot = {
    xp: 0,
    streak: 0,
    bestStreak: 0,
    workouts: 0,
    trainingMinutes: 0,
    questsCompleted: 0,
    fullClearDays: 0,
  };

  it('keeps all Skill Tree and Boss Challenge nodes locked when snapshot is zero', () => {
    for (const node of SKILL_NODES) {
      const res = evaluateRequirement(node.requirement, zeroSnap);
      assert.equal(res.unlocked, false, `${node.id} should start locked`);
    }
    for (const boss of BOSS_CHALLENGES) {
      const res = evaluateRequirement(boss.requirement, zeroSnap);
      assert.equal(res.unlocked, false, `${boss.id} should start locked`);
    }
  });

  it('unlocks Iron Vanguard boss challenge only when all three real requirements are met', () => {
    const boss = BOSS_CHALLENGES.find((b) => b.id === 'boss_iron_vanguard')!;
    const partial = evaluateRequirement(boss.requirement, { ...zeroSnap, workouts: 3, trainingMinutes: 60, xp: 900 });
    assert.equal(partial.unlocked, false);
    assert.ok(partial.pct > 80 && partial.pct < 100);

    const complete = evaluateRequirement(boss.requirement, { ...zeroSnap, workouts: 3, trainingMinutes: 60, xp: 1000 });
    assert.equal(complete.unlocked, true);
    assert.equal(complete.pct, 100);
  });

  it('counts completed quests across core and custom maps', () => {
    assert.equal(countTodayCompletedQuests({ a: true, b: false }, { c: true }), 2);
  });
});
