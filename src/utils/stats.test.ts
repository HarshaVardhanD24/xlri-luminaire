import { describe, expect, it } from 'vitest';
import { computeStats, generateSampleEvents, type EventRow } from './stats';

const now = Date.parse('2026-12-05T14:30:00Z');
const t = '2026-12-05T14:10:00Z';

describe('computeStats (mirrors SQL luminaire_stats)', () => {
  it('matches the SQL output for the reference fixture', () => {
    const rows: EventRow[] = [
      { created_at: t, session_id: 's-aaaaaaaa', event: 'page_load', source: 'board-a', device: 'mobile' },
      { created_at: t, session_id: 's-bbbbbbbb', event: 'page_load', device: 'desktop' },
      { created_at: t, session_id: 's-aaaaaaaa', event: 'quiz_start' },
      ...[1, 2, 3, 4, 5, 6].map((q) => ({ created_at: t, session_id: 's-aaaaaaaa', event: 'question_view' as const, question: q })),
      { created_at: t, session_id: 's-aaaaaaaa', event: 'quiz_complete', result: 'PAN', runner_up: 'CHA', answers: 'DDBBDD', duration_ms: 84000, source: 'board-a' },
      { created_at: t, session_id: 's-aaaaaaaa', event: 'share', label: 'download' },
      { created_at: t, session_id: 's-aaaaaaaa', event: 'section_view', label: 'lights' },
    ];
    const s = computeStats(rows, now);
    expect(s).toMatchObject({
      sessions: 2, starts: 1, completers: 1, completions: 1, shares: 1, median_seconds: 84,
      results: { PAN: 1 },
      answers: { '1': { D: 1 }, '3': { B: 1 } },
      dropoff: { '1': 1, '6': 1 },
      devices: { mobile: 1, desktop: 1 },
      shares_by: { download: 1 },
      sections: { lights: 1 },
    });
    expect(s.sources[0]).toEqual({ source: 'board-a', sessions: 1, completions: 1 });
    expect(s.hourly).toHaveLength(1);
  });

  it('sample data produces a sensible funnel', () => {
    const s = computeStats(generateSampleEvents(300, now), now);
    expect(s.sessions).toBe(300);
    expect(s.starts).toBeLessThan(s.sessions);
    expect(s.completers).toBeLessThan(s.starts);
    expect(Object.values(s.results).reduce((a, b) => a + (b ?? 0), 0)).toBe(s.completions);
  });
});
