import { ALUMNI_ORDER, type AlumniId } from '../data/alumni';
import type { OptionKey } from '../data/questions';
import { calculateResult } from './calculateResult';

export type EventName =
  | 'page_load'
  | 'section_view'
  | 'quiz_start'
  | 'question_view'
  | 'quiz_complete'
  | 'reveal_skip'
  | 'share_open'
  | 'share'
  | 'retake';

/** One row of public.luminaire_events. Anonymous by design. */
export interface EventRow {
  created_at: string;
  session_id: string;
  event: EventName;
  question?: number | null;
  label?: string | null;
  result?: string | null;
  runner_up?: string | null;
  answers?: string | null;
  source?: string | null;
  device?: 'mobile' | 'tablet' | 'desktop' | null;
  duration_ms?: number | null;
}

/** Same shape returned by the SQL function luminaire_stats(). */
export interface Stats {
  generated_at: string;
  /** Every page load (refreshes count again). Not unique people. */
  page_loads: number;
  /** Distinct browser sessions (one per tab). Not unique people. */
  sessions: number;
  starts: number;
  completers: number;
  completions: number;
  shares: number;
  share_sessions: number;
  retakes: number;
  reveal_skips: number;
  median_seconds: number | null;
  results: Partial<Record<AlumniId, number>>;
  answers: Record<string, Partial<Record<OptionKey, number>>>;
  dropoff: Record<string, number>;
  sections: Record<string, number>;
  shares_by: Record<string, number>;
  devices: Record<string, number>;
  sources: { source: string; sessions: number; completions: number }[];
  hourly: { hour: string; sessions: number; completions: number }[];
}

const distinct = (rows: EventRow[]) => new Set(rows.map((r) => r.session_id)).size;
const countBy = (rows: EventRow[], key: (r: EventRow) => string | null | undefined, unique = false) => {
  const m: Record<string, Set<string> | number> = {};
  for (const r of rows) {
    const k = key(r);
    if (k == null) continue;
    if (unique) ((m[k] as Set<string>) ??= new Set()).add(r.session_id);
    else m[k] = ((m[k] as number) ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(m).map(([k, v]) => [k, typeof v === 'number' ? v : v.size]));
};

/** JS mirror of the SQL aggregation, used for demo mode (no database configured). */
export function computeStats(events: EventRow[], now = Date.now()): Stats {
  const of = (e: EventName) => events.filter((r) => r.event === e);
  const completes = of('quiz_complete');
  const durations = completes.map((c) => c.duration_ms).filter((d): d is number => d != null).sort((a, b) => a - b);
  let median: number | null = null;
  if (durations.length) {
    const mid = (durations.length - 1) / 2;
    median = Math.round(((durations[Math.floor(mid)] + durations[Math.ceil(mid)]) / 2 / 1000) * 10) / 10;
  }

  const answers: Stats['answers'] = {};
  for (const c of completes) {
    if (!c.answers) continue;
    [...c.answers].forEach((opt, i) => {
      const q = (answers[String(i + 1)] ??= {});
      q[opt as OptionKey] = (q[opt as OptionKey] ?? 0) + 1;
    });
  }

  const srcMap = new Map<string, { s: Set<string>; c: Set<string> }>();
  for (const r of events) {
    const k = r.source || 'direct';
    if (!srcMap.has(k)) srcMap.set(k, { s: new Set(), c: new Set() });
    if (r.event === 'page_load') srcMap.get(k)!.s.add(r.session_id);
    if (r.event === 'quiz_complete') srcMap.get(k)!.c.add(r.session_id);
  }

  const hourMap = new Map<string, { s: Set<string>; c: number }>();
  for (const r of events) {
    const t = new Date(r.created_at).getTime();
    if (now - t > 24 * 3600e3) continue;
    const h = new Date(t);
    h.setUTCMinutes(0, 0, 0);
    const k = h.toISOString();
    if (!hourMap.has(k)) hourMap.set(k, { s: new Set(), c: 0 });
    if (r.event === 'page_load') hourMap.get(k)!.s.add(r.session_id);
    if (r.event === 'quiz_complete') hourMap.get(k)!.c++;
  }

  return {
    generated_at: new Date(now).toISOString(),
    page_loads: of('page_load').length,
    sessions: distinct(of('page_load')),
    starts: distinct(of('quiz_start')),
    completers: distinct(completes),
    completions: completes.length,
    shares: of('share').length,
    share_sessions: distinct(of('share')),
    retakes: of('retake').length,
    reveal_skips: of('reveal_skip').length,
    median_seconds: median,
    results: countBy(completes, (r) => r.result) as Stats['results'],
    answers,
    dropoff: countBy(of('question_view'), (r) => (r.question ? String(r.question) : null), true),
    sections: countBy(of('section_view'), (r) => r.label, true),
    shares_by: countBy(of('share'), (r) => r.label ?? 'unknown'),
    devices: countBy(of('page_load'), (r) => r.device, true),
    sources: [...srcMap.entries()]
      .map(([source, v]) => ({ source, sessions: v.s.size, completions: v.c.size }))
      .sort((a, b) => b.sessions - a.sessions),
    hourly: [...hourMap.entries()]
      .map(([hour, v]) => ({ hour, sessions: v.s.size, completions: v.c }))
      .sort((a, b) => a.hour.localeCompare(b.hour)),
  };
}

/** Simulated Homecoming traffic so the dashboard can be previewed before launch. */
export function generateSampleEvents(sessions = 320, now = Date.now()): EventRow[] {
  let seed = 2026;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const pick = <T,>(arr: T[], w?: number[]) => {
    if (!w) return arr[Math.floor(rnd() * arr.length)];
    let x = rnd() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < arr.length; i++) if ((x -= w[i]) <= 0) return arr[i];
    return arr[arr.length - 1];
  };
  const sources = ['main-gate', 'auditorium', 'food-court', 'library', 'direct'];
  const sections = ['hero', 'manifesto', 'lights', 'how', 'cta'];
  const rows: EventRow[] = [];
  for (let i = 0; i < sessions; i++) {
    const sid = `demo-${i.toString(36).padStart(6, '0')}`;
    // Traffic peaks in the evening of the event
    const hoursAgo = pick([1, 2, 3, 4, 5, 6, 8, 10, 14, 20], [10, 14, 12, 9, 7, 6, 5, 4, 3, 2]) - rnd();
    let t = now - hoursAgo * 3600e3;
    const at = (ms: number) => new Date((t += ms)).toISOString();
    const source = pick(sources, [32, 26, 20, 12, 10]);
    const device = pick(['mobile', 'tablet', 'desktop'] as const, [86, 4, 10]);
    const base = { session_id: sid, source: source === 'direct' ? null : source, device };
    rows.push({ ...base, event: 'page_load', created_at: at(0) });
    const depth = pick([1, 2, 3, 4, 5], [12, 8, 15, 20, 45]);
    sections.slice(0, depth).forEach((s) => rows.push({ ...base, event: 'section_view', label: s, created_at: at(2500) }));
    if (rnd() < 0.18) continue;
    rows.push({ ...base, event: 'quiz_start', created_at: at(1500) });
    const quitAt = rnd() < 0.12 ? 1 + Math.floor(rnd() * 5) : 7;
    const ans: OptionKey[] = [];
    let ms = 0;
    for (let q = 1; q <= 6 && q < quitAt + 1; q++) {
      rows.push({ ...base, event: 'question_view', question: q, created_at: at(0) });
      const step = 6000 + rnd() * 14000;
      ms += step;
      t += step;
      ans.push(pick(['A', 'B', 'C', 'D'] as OptionKey[], [30, 26, 22, 22]));
    }
    if (quitAt <= 6) continue;
    const r = calculateResult(ans);
    rows.push({
      ...base,
      event: 'quiz_complete',
      result: r.winner,
      runner_up: r.runnerUp,
      answers: ans.join(''),
      duration_ms: Math.round(ms),
      created_at: at(500),
    });
    if (rnd() < 0.25) rows.push({ ...base, event: 'reveal_skip', created_at: at(800) });
    if (rnd() < 0.55) {
      rows.push({ ...base, event: 'share_open', created_at: at(20000) });
      if (rnd() < 0.7) rows.push({ ...base, event: 'share', label: pick(['native', 'download', 'copy'], [55, 30, 15]), created_at: at(4000) });
    }
    if (rnd() < 0.2) rows.push({ ...base, event: 'retake', created_at: at(9000) });
  }
  return rows.sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export const ALL_IDS = ALUMNI_ORDER;
