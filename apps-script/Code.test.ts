/**
 * Runs apps-script/Code.gs inside a fake Google Apps Script environment so the
 * backend is tested in CI without a Google account.
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { beforeEach, describe, expect, it } from 'vitest';
import { computeStats, generateSampleEvents } from '../src/utils/stats';

type Cell = unknown;
class FakeSheet {
  rows: Cell[][] = [];
  constructor(public name: string) {}
  getLastRow() {
    return this.rows.length;
  }
  getRange(r: number, c: number, nr = 1, nc = 1) {
    const sheet = this;
    if (typeof r === 'string') return chain;
    return {
      setValues(v: Cell[][]) {
        v.forEach((row, i) => {
          sheet.rows[r - 1 + i] = sheet.rows[r - 1 + i] || [];
          row.forEach((cell, j) => (sheet.rows[r - 1 + i][c - 1 + j] = cell));
        });
        return chain;
      },
      getValues: () => sheet.rows.slice(r - 1, r - 1 + nr).map((row) => Array.from({ length: nc }, (_, j) => row[c - 1 + j] ?? '')),
      setFontWeight: () => chain,
      setNumberFormat: () => chain,
    };
  }
  setFrozenRows() {}
  clear() {
    this.rows = [];
  }
  autoResizeColumns() {}
}
const chain: Record<string, () => unknown> = new Proxy({}, { get: () => () => chain });

function loadScript() {
  const sheets = new Map<string, FakeSheet>();
  const cache = new Map<string, string>();
  const props: Record<string, string> = { ADMIN_PASSCODE: 'test-pass' };
  const ctx = {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({
        getSheetByName: (n: string) => sheets.get(n) ?? null,
        insertSheet: (n: string) => {
          const s = new FakeSheet(n);
          sheets.set(n, s);
          return s;
        },
      }),
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    CacheService: {
      getScriptCache: () => ({ get: (k: string) => cache.get(k) ?? null, put: (k: string, v: string) => cache.set(k, v), remove: (k: string) => cache.delete(k) }),
    },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k: string) => props[k] ?? null }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (t: string) => ({ setMimeType: () => ({ body: t }) }) },
    Utilities: { sleep() {} },
  } as Record<string, unknown>;
  vm.createContext(ctx);
  vm.runInContext(readFileSync(new URL('./Code.gs', import.meta.url), 'utf8'), ctx);
  const call = (name: string, ...args: unknown[]) => (ctx[name] as (...a: unknown[]) => unknown)(...args);
  const post = (body: unknown) => JSON.parse((call('doPost', { postData: { contents: JSON.stringify(body) } }) as { body: string }).body);
  return { sheets, call, post, ctx };
}

describe('Apps Script backend', () => {
  let s: ReturnType<typeof loadScript>;
  beforeEach(() => {
    s = loadScript();
    s.call('setup');
  });

  it('setup creates Events, Responses and Summary with headers', () => {
    expect(s.sheets.get('Events')!.rows[0][3]).toBe('event');
    expect(s.sheets.get('Responses')!.rows[0][2]).toBe('result_id');
    expect(s.sheets.get('Summary')!.rows[1][0]).toBe('Page loads');
  });

  it('stores valid events, rejects junk and formula injection', () => {
    const r = s.post({
      action: 'track',
      events: [
        { event: 'page_load', session_id: 's-abcdefgh12', created_at: new Date().toISOString(), device: 'mobile', source: 'main-gate' },
        { event: 'quiz_complete', session_id: 's-abcdefgh12', result: 'PAN', runner_up: 'CHA', answers: 'DDBBDD', duration_ms: 84000 },
        { event: 'drop_table', session_id: 's-abcdefgh12' },
        { event: 'page_load', session_id: '=HYPERLINK("x")' },
        { event: 'share', session_id: 's-abcdefgh12', label: '=IMPORTXML(1)', source: '-cmd' },
      ],
    });
    expect(r).toEqual({ ok: true, stored: 3 });
    const ev = s.sheets.get('Events')!.rows;
    expect(ev).toHaveLength(4);
    expect(ev.flat().some((c) => typeof c === 'string' && /^[=+\-@]/.test(c))).toBe(false);
    const resp = s.sheets.get('Responses')!.rows;
    expect(resp[1].slice(2, 11)).toEqual(['PAN', 'K. Pandiarajan', 'Chaitanya Peddi', 'D', 'D', 'B', 'B', 'D', 'D']);
  });

  it('stats need the passcode and match the website dashboard maths', () => {
    const sample = generateSampleEvents(120);
    for (let i = 0; i < sample.length; i += 40) s.post({ action: 'track', events: sample.slice(i, i + 40) });
    expect(s.post({ action: 'stats', passcode: 'nope' })).toEqual({ ok: false, error: 'Wrong passcode' });
    const res = s.post({ action: 'stats', passcode: 'test-pass' });
    expect(res.ok).toBe(true);
    const expected = computeStats(sample);
    const { generated_at: _a, hourly: _h, ...got } = res.stats;
    const { generated_at: _b, hourly: _k, ...exp } = expected;
    void _a; void _b; void _h; void _k;
    expect(got).toEqual(JSON.parse(JSON.stringify(exp)));
  });

  it('pulse returns public totals only', () => {
    s.post({ action: 'track', events: [{ event: 'quiz_complete', session_id: 's-zzzzzzzz01', result: 'NIK', runner_up: 'VAR', answers: 'ABCDAB' }] });
    const p = JSON.parse((s.call('doGet', { parameter: { action: 'pulse' } }) as { body: string }).body);
    expect(p).toEqual({ completions: 1, results: { NIK: 1 } });
  });
});
