import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanSupabaseUrl,
  capTaskXp,
  calculateDailyXpAward,
  calculateDisciplineScoreFromTasks,
  sanitizeDayIndex,
  formatTimerClock,
} from './progression.ts';

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
    assert.equal(score, 50); // 2 of 4 enabled tasks
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
