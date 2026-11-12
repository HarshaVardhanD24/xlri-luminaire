import { describe, expect, it } from 'vitest';
import { ALUMNI, ALUMNI_ORDER, type AlumniId } from '../data/alumni';
import { QUESTIONS, type OptionKey } from '../data/questions';
import { SCORING } from '../data/scoring';
import { calculateResult } from './calculateResult';

const KEYS: OptionKey[] = ['A', 'B', 'C', 'D'];

function* allCombos(n: number): Generator<OptionKey[]> {
  if (n === 0) return yield [];
  for (const rest of allCombos(n - 1)) for (const k of KEYS) yield [...rest, k];
}

describe('data integrity', () => {
  it('has 9 alumni, 6 questions, 24 options', () => {
    expect(Object.keys(ALUMNI)).toHaveLength(9);
    expect(QUESTIONS).toHaveLength(6);
    expect(QUESTIONS.flatMap((q) => q.options)).toHaveLength(24);
  });
  it('every option maps to two distinct valid alumni', () => {
    for (const q of QUESTIONS)
      for (const k of KEYS) {
        const [p, s] = SCORING[q.id][k];
        expect(ALUMNI[p]).toBeDefined();
        expect(ALUMNI[s]).toBeDefined();
        expect(p).not.toBe(s);
      }
  });
});

describe('calculateResult', () => {
  it('scores per the brief: all-A gives Leena 12', () => {
    const r = calculateResult(['A', 'A', 'A', 'A', 'A', 'A']);
    expect(r.winner).toBe('LEE');
    expect(r.ranking[0].total).toBe(12);
    expect(r.runnerUp).toBe('BHA');
  });

  it('is deterministic and every alumnus can win (exhaustive 4,096 combos)', () => {
    const wins = Object.fromEntries(ALUMNI_ORDER.map((id) => [id, 0])) as Record<AlumniId, number>;
    for (const combo of allCombos(6)) {
      const a = calculateResult(combo);
      const b = calculateResult(combo);
      expect(a.winner).toBe(b.winner);
      expect(a.winner).not.toBe(a.runnerUp);
      wins[a.winner]++;
    }
    for (const id of ALUMNI_ORDER) expect(wins[id], `${id} never wins`).toBeGreaterThan(0);
    console.table(wins);
  });

  it('breaks total ties by primary matches', () => {
    // MUT: Q1C(2)+Q2B(1)+Q5C(1) = 4 with 1 primary; check ordering respects primaries
    const r = calculateResult(['C', 'B', 'C', 'C', 'C', 'C']);
    expect(r.winner).toBe('MUT');
  });
});
