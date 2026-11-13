import { VARIANT_IDS } from '../data/quizData';
import { NAME_RE, normalizeName, normalizeRoll, ROLL_RE } from './roll';

/**
 * Talks to the Google Apps Script web app (live) or to a local stand-in (demo).
 * In live mode the answer key never reaches the browser: the server marks and times everything.
 */
const ENDPOINT = (import.meta.env.VITE_SHEETS_ENDPOINT as string | undefined)?.trim() ?? '';
export const LIVE = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(ENDPOINT);

export interface Session {
  roll: string;
  name: string;
  token: string;
  plan: string[]; // one variant id per slot
}
export type StartError = 'invalid' | 'name' | 'already' | 'closed' | 'network';
export interface Finish {
  score: number;
  timeMs: number;
}

async function call<T>(body: Record<string, unknown>): Promise<T | { ok: false; error: 'network' }> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const ctl = new AbortController();
      const t = window.setTimeout(() => ctl.abort(), 20000);
      const res = await fetch(ENDPOINT, { method: 'POST', body: JSON.stringify(body), signal: ctl.signal });
      clearTimeout(t);
      return (await res.json()) as T;
    } catch {
      await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
    }
  }
  return { ok: false, error: 'network' };
}

/* ---------------- demo stand-in (prototype only) ---------------- */
type Demo = { key: Record<string, string>; answers: Record<number, boolean>; startedAt: number };
const demo = new Map<string, Demo>();
/** answer-key.json sits next to package.json, is git-ignored and is bundled only into demo builds. */
async function demoKey(): Promise<Record<string, string>> {
  if (__DEMO__) {
    const files = import.meta.glob('../../answer-key.json', { import: 'default' }) as Record<string, () => Promise<Record<string, string>>>;
    const load = Object.values(files)[0];
    if (load) return load();
  }
  return {};
}
const norm = (s: string) => s.trim().toLowerCase();

export async function startAttempt(rollInput: string, nameInput: string): Promise<{ ok: true; session: Session } | { ok: false; error: StartError }> {
  const roll = normalizeRoll(rollInput);
  const name = normalizeName(nameInput);
  if (!ROLL_RE.test(roll)) return { ok: false, error: 'invalid' };
  if (!NAME_RE.test(name)) return { ok: false, error: 'name' };
  if (!LIVE) {
    const plan = VARIANT_IDS.map((ids) => ids[Math.floor(Math.random() * ids.length)]);
    const token = 'demo-' + Math.random().toString(36).slice(2);
    demo.set(token, { key: await demoKey(), answers: {}, startedAt: performance.now() });
    return { ok: true, session: { roll, name, token, plan } };
  }
  const r = await call<{ ok: boolean; token?: string; plan?: string[]; error?: string }>({ action: 'start', roll, name });
  if (r.ok && 'token' in r && r.token && r.plan) return { ok: true, session: { roll, name, token: r.token, plan: r.plan } };
  const e = (r as { error?: string }).error;
  return { ok: false, error: e === 'already' || e === 'closed' || e === 'invalid' || e === 'name' ? e : 'network' };
}

/** Marks one answer. The server only reveals correctness for the first two rounds. */
export async function submitAnswer(
  s: Session,
  slot: number,
  value: string,
): Promise<{ ok: true; correct?: boolean } | { ok: false; error: string }> {
  if (!LIVE) {
    const d = demo.get(s.token);
    if (!d) return { ok: false, error: 'session' };
    const variant = s.plan[slot];
    const want = d.key[variant] ?? '';
    const ok = norm(value) === norm(want) || (slot === 1 && norm(value) === norm([...want].reverse().join('')));
    d.answers[slot] = ok;
    return { ok: true, correct: slot <= 1 ? ok : undefined };
  }
  const r = await call<{ ok: boolean; correct?: boolean; error?: string }>({ action: 'answer', token: s.token, slot, value });
  if (r.ok) return { ok: true, correct: r.correct };
  return { ok: false, error: (r as { error?: string }).error ?? 'network' };
}

export async function finishAttempt(s: Session): Promise<{ ok: true; result: Finish } | { ok: false; error: string }> {
  if (!LIVE) {
    const d = demo.get(s.token);
    if (!d) return { ok: false, error: 'session' };
    const score = Object.values(d.answers).filter(Boolean).length;
    return { ok: true, result: { score, timeMs: Math.round(performance.now() - d.startedAt) } };
  }
  const r = await call<{ ok: boolean; score?: number; timeSec?: number; error?: string }>({ action: 'finish', token: s.token });
  if (r.ok && typeof r.score === 'number' && typeof r.timeSec === 'number') return { ok: true, result: { score: r.score, timeMs: Math.round(r.timeSec * 1000) } };
  return { ok: false, error: (r as { error?: string }).error ?? 'network' };
}
