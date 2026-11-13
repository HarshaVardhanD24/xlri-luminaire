/**
 * Runs apps-script/Code.gs inside a fake Google Apps Script environment so the
 * backend is tested without a Google account.
 */
import { existsSync, readFileSync } from 'node:fs';
import vm from 'node:vm';
import { beforeEach, describe, expect, it } from 'vitest';
import { BLUR, EMOJIS, TIMELINES, TRUTHS, VARIANT_IDS, WORDS } from '../src/data/quizData';

// answer-key.json is git-ignored, so on GitHub the backend tests use a stand-in key.
const KEY_FILE = new URL('../answer-key.json', import.meta.url);
const REAL_KEY: Record<string, string> | null = existsSync(KEY_FILE) ? JSON.parse(readFileSync(KEY_FILE, 'utf8')) : null;
const STAND_IN: Record<string, string> = Object.fromEntries([
  ...BLUR.map((v) => [v.id, v.options[1]]),
  ...WORDS.map((v) => [v.id, v.grid[0].slice(0, 3)]),
  ...TRUTHS.map((v) => [v.id, 'A']),
  ...TIMELINES.map((v) => [v.id, String(v.max)]),
  ...EMOJIS.map((v) => [v.id, v.options[2]]),
]);
const KEY = REAL_KEY ?? STAND_IN;

type Cell = unknown;
class FakeSheet {
  rows: Cell[][] = [];
  formulas: Record<string, string> = {};
  constructor(public name: string) {}
  getLastRow() {
    return this.rows.length;
  }
  getRange(r: number | string, c?: number, nr = 1, nc = 1) {
    const sheet = this;
    if (typeof r === 'string') {
      return {
        setValue: () => chain,
        clearContent: () => chain,
        setFormula: (f: string) => {
          sheet.formulas[r] = f;
          return chain;
        },
      };
    }
    const col = c as number;
    return {
      setValues(v: Cell[][]) {
        v.forEach((row, i) => {
          sheet.rows[r - 1 + i] = sheet.rows[r - 1 + i] || [];
          row.forEach((cell, j) => (sheet.rows[r - 1 + i][col - 1 + j] = cell));
        });
        return chain;
      },
      setValue(x: Cell) {
        sheet.rows[r - 1] = sheet.rows[r - 1] || [];
        sheet.rows[r - 1][col - 1] = x;
        return chain;
      },
      getValues: () => sheet.rows.slice(r - 1, r - 1 + nr).map((row) => Array.from({ length: nc }, (_, j) => row[col - 1 + j] ?? '')),
      setFontWeight: () => chain,
    };
  }
  setFrozenRows() {}
  clear() {
    this.rows = [];
  }
}
const chain: Record<string, () => unknown> = new Proxy({}, { get: () => () => chain });

function loadScript(extra: Record<string, string> = {}) {
  const props: Record<string, string> = { ANSWER_KEY: JSON.stringify(KEY), ...extra };
  const sheets = new Map<string, FakeSheet>();
  let uid = 0;
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
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k: string) => props[k] ?? null }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (t: string) => ({ setMimeType: () => ({ body: t }) }) },
    Utilities: { getUuid: () => `uuid-${++uid}` },
  } as Record<string, unknown>;
  vm.createContext(ctx);
  vm.runInContext(readFileSync(new URL('./Code.gs', import.meta.url), 'utf8'), ctx);
  const call = (name: string, ...args: unknown[]) => (ctx[name] as (...a: unknown[]) => unknown)(...args);
  const post = (body: unknown) => JSON.parse((call('doPost', { postData: { contents: JSON.stringify(body) } }) as { body: string }).body);
  const key = KEY;
  const variants = ctx.SLOT_VARIANTS as string[][];
  return { sheets, call, post, key, variants };
}

describe.skipIf(!REAL_KEY)('answer key (local only, the key is not on GitHub)', () => {
  const DEMO_KEY = REAL_KEY as Record<string, string>;
  it('covers exactly the public variant ids', () => {
    expect(Object.keys(DEMO_KEY).sort()).toEqual(VARIANT_IDS.flat().sort());
  });
  it('every correct answer is playable', () => {
    for (const v of BLUR) expect(v.options).toContain(DEMO_KEY[v.id]);
    for (const v of EMOJIS) expect(v.options).toContain(DEMO_KEY[v.id]);
    for (const v of TRUTHS) expect(v.statements.map((x) => x.key)).toContain(DEMO_KEY[v.id]);
    for (const v of TIMELINES) {
      const a = Number(DEMO_KEY[v.id]);
      expect(a).toBeGreaterThanOrEqual(v.min);
      expect(a).toBeLessThanOrEqual(v.max);
      expect(v.markers).not.toContain(a); // the slider markers must not give the answer away
      expect(v.start).not.toBe(a);
    }
  });
  it('every word search hides its word in a straight line', () => {
    const dirs = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]];
    for (const v of WORDS) {
      const w = DEMO_KEY[v.id];
      const n = v.grid.length;
      expect(v.grid.every((r) => r.length === n)).toBe(true);
      let found = 0;
      for (let r = 0; r < n; r++)
        for (let c = 0; c < n; c++)
          for (const [dr, dc] of dirs) {
            let ok = true;
            for (let i = 0; i < w.length && ok; i++) {
              const rr = r + dr * i;
              const cc = c + dc * i;
              ok = rr >= 0 && cc >= 0 && rr < n && cc < n && v.grid[rr][cc] === w[i];
            }
            if (ok) found++;
          }
      expect(found, v.id).toBe(1); // present exactly once
    }
  });
});

describe('Apps Script backend', () => {
  it('uses the same variant ids as the website', () => {
    expect(loadScript().variants).toEqual(VARIANT_IDS);
  });
  let s: ReturnType<typeof loadScript>;
  beforeEach(() => {
    s = loadScript();
    s.call('setup');
  });
  const play = (roll: string, mode: 'perfect' | 'wrong' = 'perfect') => {
    const st = s.post({ action: 'start', roll, name: 'Test Player' });
    const out: unknown[] = [st];
    if (!st.ok) return { st, out };
    st.plan.forEach((vid: string, slot: number) => {
      const value = mode === 'perfect' ? s.key[vid] : 'zzz';
      out.push(s.post({ action: 'answer', token: st.token, slot, value }));
    });
    return { st, out, fin: s.post({ action: 'finish', token: st.token }) };
  };

  it('setup builds Attempts and a ranked Leaderboard', () => {
    expect(s.sheets.get('Attempts')!.rows[0].slice(0, 2)).toEqual(['Roll number', 'Name']);
    expect(s.sheets.get('Leaderboard')!.formulas.B2).toContain("order by F desc, G asc");
    expect(s.sheets.get('Leaderboard')!.rows[0]).toEqual(['Rank', 'Roll number', 'Name', 'Score (of 5)', 'Total time (s)', 'Finished at']);
  });

  it('validates roll numbers', () => {
    for (const bad of ['', 'B27001', 'X26001', 'B2600', "B26001'; --", '=B26001']) expect(s.post({ action: 'start', roll: bad, name: 'Test Player' })).toEqual({ ok: false, error: 'invalid' });
    expect(s.post({ action: 'start', roll: ' b26 023 ', name: 'Test Player' }).ok).toBe(true);
    expect(s.sheets.get('Attempts')!.rows[1][0]).toBe('B26023');
  });

  it('needs a plain name and stores it tidied', () => {
    for (const bad of ['', 'A', '=HYPERLINK("x")', '<script>', 'x'.repeat(61), '123']) expect(s.post({ action: 'start', roll: 'B26100', name: bad })).toEqual({ ok: false, error: 'name' });
    expect(s.post({ action: 'start', roll: 'B26100', name: "  D  Harsha   O'Neil-Vardhan " }).ok).toBe(true);
    expect(s.sheets.get('Attempts')!.rows[1][1]).toBe("D Harsha O'Neil-Vardhan");
  });

  it('one attempt per roll number', () => {
    expect(s.post({ action: 'start', roll: 'H25001', name: 'Test Player' }).ok).toBe(true);
    expect(s.post({ action: 'start', roll: 'h25001', name: 'Test Player' })).toEqual({ ok: false, error: 'already' });
  });

  it('gives a plan with one valid variant per round, in fixed order', () => {
    const { st } = play('B26001');
    expect(st.plan).toHaveLength(5);
    st.plan.forEach((v: string, i: number) => expect(s.variants[i]).toContain(v));
  });

  it('marks a perfect run 5/5 and a wrong run 0/5, with feedback only for rounds 1 and 2', () => {
    const a = play('B26001');
    expect(a.out.slice(1).map((r) => (r as { correct?: boolean }).correct)).toEqual([true, true, undefined, undefined, undefined]);
    expect(a.fin.score).toBe(5);
    const b = play('B26002', 'wrong');
    expect(b.out.slice(1).map((r) => (r as { correct?: boolean }).correct)).toEqual([false, false, undefined, undefined, undefined]);
    expect(b.fin.score).toBe(0);
  });

  it('crossword accepts the word read backwards, other rounds do not', () => {
    const st = s.post({ action: 'start', roll: 'B26003', name: 'Test Player' });
    s.post({ action: 'answer', token: st.token, slot: 0, value: s.key[st.plan[0]] });
    const w = s.key[st.plan[1]];
    expect(s.post({ action: 'answer', token: st.token, slot: 1, value: [...w].reverse().join('') }).correct).toBe(true);
  });

  it('records time on the server and ranks via sheet columns', () => {
    const { fin } = play('B26004');
    expect(fin.ok).toBe(true);
    expect(fin.timeSec).toBeGreaterThanOrEqual(0);
    const row = s.sheets.get('Attempts')!.rows[1];
    expect(row[4]).toBe('finished');
    expect(row[5]).toBe(5);
    expect(row[6]).toBe(fin.timeSec);
    const rounds = row.slice(7, 12) as number[];
    rounds.forEach((x) => expect(typeof x).toBe('number'));
    expect(rounds.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(fin.timeSec + 0.05);
  });

  it('is idempotent: repeating an answer returns the stored result and cannot change it', () => {
    const st = s.post({ action: 'start', roll: 'B26005', name: 'Test Player' });
    const first = s.post({ action: 'answer', token: st.token, slot: 0, value: 'definitely wrong' });
    expect(first.correct).toBe(false);
    const retry = s.post({ action: 'answer', token: st.token, slot: 0, value: s.key[st.plan[0]] });
    expect(retry.correct).toBe(false); // one try only
  });

  it('enforces round order, completeness and token validity', () => {
    const st = s.post({ action: 'start', roll: 'B26006', name: 'Test Player' });
    expect(s.post({ action: 'answer', token: st.token, slot: 2, value: 'A' })).toEqual({ ok: false, error: 'order' });
    expect(s.post({ action: 'finish', token: st.token })).toEqual({ ok: false, error: 'incomplete' });
    expect(s.post({ action: 'answer', token: 'nope', slot: 0, value: 'x' })).toEqual({ ok: false, error: 'session' });
    expect(s.post({ action: 'answer', token: st.token, slot: 9, value: 'x' }).ok).toBe(false);
  });

  it('cannot answer after finishing, and finish is repeatable', () => {
    const { st, fin } = play('B26007');
    expect(s.post({ action: 'answer', token: st.token, slot: 4, value: 'x' })).toEqual({ ok: false, error: 'finished' });
    expect(s.post({ action: 'finish', token: st.token })).toEqual(fin);
  });

  it('blocks formula injection in stored answers', () => {
    const st = s.post({ action: 'start', roll: 'B26008', name: 'Test Player' });
    s.post({ action: 'answer', token: st.token, slot: 0, value: '=IMPORTXML("http://x")' });
    const cells = s.sheets.get('Attempts')!.rows[1];
    expect(cells.some((c) => typeof c === 'string' && /^[=+\-@]/.test(c))).toBe(false);
    expect(cells[13]).toBe('invalid');
  });

  it('stays closed until the answer key is pasted in', () => {
    const nokey = loadScript({ ANSWER_KEY: '' });
    nokey.call('setup');
    expect(nokey.post({ action: 'start', roll: 'B26010', name: 'Test Player' })).toEqual({ ok: false, error: 'closed' });
  });

  it('can be closed from Script properties', () => {
    const closed = loadScript({ CLOSED: '1' });
    closed.call('setup');
    expect(closed.post({ action: 'start', roll: 'B26009', name: 'Test Player' })).toEqual({ ok: false, error: 'closed' });
  });

  it('rejects junk requests without crashing', () => {
    expect(s.post({ action: 'drop' })).toEqual({ ok: false, error: 'invalid' });
    expect((s.call('doPost', { postData: { contents: 'not json' } }) as { body: string }).body).toContain('invalid');
    expect(JSON.parse((s.call('doGet') as { body: string }).body).ok).toBe(true);
  });
});
