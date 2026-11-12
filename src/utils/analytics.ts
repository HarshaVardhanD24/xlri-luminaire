import { computeStats, generateSampleEvents, type EventName, type EventRow, type Stats } from './stats';

/**
 * Anonymous interaction tracking to a Google Sheet through a Google Apps Script web app.
 * - Live mode: the build sets VITE_SHEETS_ENDPOINT to your web app URL (ends in /exec).
 *   This URL is a public endpoint, not a secret; it only accepts validated, anonymous events.
 * - Demo mode (no URL, e.g. the HTML prototype): events stay in this browser only.
 * Never sends names, emails, phone numbers, roll numbers or IP-derived data.
 */
const RAW_ENDPOINT = ((import.meta.env.VITE_SHEETS_ENDPOINT as string | undefined) ?? '').trim();
const ENDPOINT = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(RAW_ENDPOINT) ? RAW_ENDPOINT : '';
export const LIVE = Boolean(ENDPOINT);

const LOCAL_KEY = 'luminaire_demo_events';

function safeGet(store: Storage | undefined, k: string) {
  try {
    return store?.getItem(k) ?? null;
  } catch {
    return null;
  }
}
function safeSet(store: Storage | undefined, k: string, v: string) {
  try {
    store?.setItem(k, v);
  } catch {
    /* storage blocked: fine */
  }
}

function randomId() {
  try {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 20);
  } catch {
    return Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
  }
}

const ss = typeof window !== 'undefined' ? window.sessionStorage : undefined;
const ls = typeof window !== 'undefined' ? window.localStorage : undefined;

/** Random code for this browser tab. Resets when the tab closes. Not linked to any person. */
const sessionId = (() => {
  let id = safeGet(ss, 'luminaire_sid');
  if (!id) {
    id = `s-${randomId()}`;
    safeSet(ss, 'luminaire_sid', id);
  }
  return id;
})();

/** ?src=main-gate on each QR code tells you which installation was scanned. */
const source = (() => {
  const fromUrl = new URLSearchParams(window.location.search).get('src');
  const clean = fromUrl?.toLowerCase().replace(/[^a-z0-9_-]/g, '').replace(/^[-_]+/, '').slice(0, 40);
  if (clean) safeSet(ss, 'luminaire_src', clean);
  return clean || safeGet(ss, 'luminaire_src') || null;
})();

const device = (() => {
  const w = Math.min(window.screen?.width || window.innerWidth, window.innerWidth);
  if (w < 600) return 'mobile' as const;
  if (w < 1024 && navigator.maxTouchPoints > 0) return 'tablet' as const;
  return 'desktop' as const;
})();

/* ---------- batching: a visit sends ~3-5 small requests, not one per click ---------- */
let queue: EventRow[] = [];
let timer = 0;

function send(batch: EventRow[], useBeacon: boolean) {
  const body = JSON.stringify({ action: 'track', events: batch });
  if (useBeacon && navigator.sendBeacon) {
    if (navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain;charset=utf-8' }))) return;
  }
  // text/plain + no-cors = a "simple" request Apps Script accepts without a CORS preflight
  fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body }).catch(
    () => undefined, // analytics must never break the experience
  );
}

function flush(useBeacon = false) {
  clearTimeout(timer);
  timer = 0;
  while (queue.length) send(queue.splice(0, 40), useBeacon);
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => LIVE && flush(true));
  document.addEventListener('visibilitychange', () => LIVE && document.visibilityState === 'hidden' && flush(true));
}

const once = new Set<string>();

export function track(event: EventName, fields: Partial<EventRow> = {}, onceKey?: string) {
  if (onceKey) {
    if (once.has(onceKey)) return;
    once.add(onceKey);
  }
  const row: EventRow = { created_at: new Date().toISOString(), session_id: sessionId, event, source, device, ...fields };

  if (LIVE) {
    queue.push(row);
    if (event === 'quiz_complete' || event === 'page_load' || queue.length >= 20) flush();
    else if (!timer) timer = window.setTimeout(() => flush(), 4000);
  } else {
    const list = readLocal();
    list.push(row);
    safeSet(ls, LOCAL_KEY, JSON.stringify(list.slice(-3000)));
  }
}

function readLocal(): EventRow[] {
  try {
    return JSON.parse(safeGet(ls, LOCAL_KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearLocal() {
  safeSet(ls, LOCAL_KEY, '[]');
}

export type StatsResult = { ok: true; stats: Stats } | { ok: false; error: string };

export async function fetchStats(passcode: string, sample = false): Promise<StatsResult> {
  if (!LIVE) {
    const events = sample ? [...generateSampleEvents(), ...readLocal()] : readLocal();
    return { ok: true, stats: computeStats(events) };
  }
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'stats', passcode }),
    });
    const data = (await res.json()) as { ok: boolean; stats?: Stats; error?: string };
    return data.ok && data.stats ? { ok: true, stats: data.stats } : { ok: false, error: data.error || 'Could not load stats' };
  } catch {
    return { ok: false, error: 'Could not reach the Google Sheet. Check the web app is deployed with access "Anyone".' };
  }
}

/** Time the quiz from first question to completion (sent with quiz_complete). */
let quizStartedAt = 0;
export const markQuizStart = () => (quizStartedAt = Date.now());
export const quizDuration = () => (quizStartedAt ? Math.min(Date.now() - quizStartedAt, 3600000) : null);

export interface Pulse {
  completions: number;
  results: Record<string, number>;
}

/** Public anonymous totals for the landing page. Demo mode uses this browser's events. */
export async function fetchPulse(): Promise<Pulse | null> {
  if (!LIVE) {
    const s = computeStats(readLocal());
    return { completions: s.completions, results: s.results as Record<string, number> };
  }
  try {
    const res = await fetch(`${ENDPOINT}?action=pulse`);
    return res.ok ? ((await res.json()) as Pulse) : null;
  } catch {
    return null;
  }
}
