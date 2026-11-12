import { ArrowLeft, Lock, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ALUMNI, ALUMNI_ORDER } from '../data/alumni';
import { QUESTIONS, type OptionKey } from '../data/questions';
import { LIVE, clearLocal, fetchStats } from '../utils/analytics';
import type { Stats } from '../utils/stats';
import { BrandBar } from './Brand';

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
const PASS_KEY = 'luminaire_admin_pass';

function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-deep/80 p-5 ${className}`}>
      <h3 className="eyebrow mb-4 !text-[11px]">{title}</h3>
      {children}
    </section>
  );
}

function Bar({ label, value, max, sub, accent = false }: { label: string; value: number; max: number; sub?: string; accent?: boolean }) {
  return (
    <div className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-[13px]">
      <span className="truncate text-silver" title={label}>
        {label}
      </span>
      <div className="h-2.5 overflow-hidden rounded-full bg-royal">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${max ? (value / max) * 100 : 0}%`, background: accent ? '#F0DCA5' : '#D8B978' }}
        />
      </div>
      <span className="w-14 text-right tabular-nums text-ivory">
        {value}
        {sub && <span className="ml-1 text-bluegrey">{sub}</span>}
      </span>
    </div>
  );
}

export function AdminDashboard({ onExit }: { onExit: () => void }) {
  const [pass, setPass] = useState(() => {
    try {
      return sessionStorage.getItem(PASS_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const [authed, setAuthed] = useState(!LIVE);
  const [sample, setSample] = useState(!LIVE);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (p = pass) => {
      setLoading(true);
      const r = await fetchStats(p, sample);
      setLoading(false);
      if (r.ok) {
        setStats(r.stats);
        setAuthed(true);
        setError('');
        try {
          sessionStorage.setItem(PASS_KEY, p);
        } catch {
          /* ignore */
        }
      } else {
        setError(r.error);
        if (r.error === 'Wrong passcode') setAuthed(false);
      }
    },
    [pass, sample],
  );

  useEffect(() => {
    if (!LIVE || pass) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sample]);

  // Live refresh every 30 s while open
  useEffect(() => {
    if (!authed) return;
    const t = window.setInterval(() => void load(), 30000);
    return () => clearInterval(t);
  }, [authed, load]);

  if (!authed) {
    return (
      <main className="mx-auto flex min-h-[100svh] max-w-sm flex-col justify-center px-5">
        <form
          className="rounded-2xl border border-line bg-deep/80 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            void load(pass);
          }}
        >
          <Lock className="text-gold" size={22} />
          <h1 className="mt-4 font-display text-3xl text-ivory">Luminaire analytics</h1>
          <p className="mt-2 text-sm text-silver">Alumni Committee only. Enter the dashboard passcode.</p>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="mt-5 w-full rounded-xl border border-line bg-royal px-4 py-3 text-ivory outline-none focus:border-gold"
            placeholder="Passcode"
            autoFocus
          />
          {error && <p className="mt-3 text-sm text-[#E6B77A]">{error}</p>}
          <button className="btn-gold mt-5 w-full" disabled={!pass || loading}>
            {loading ? 'Checking…' : 'Open dashboard'}
          </button>
        </form>
        <button onClick={onExit} className="mt-6 text-sm text-silver hover:text-ivory">
          ← Back to the quiz
        </button>
      </main>
    );
  }

  const s = stats;
  const maxResult = s ? Math.max(1, ...ALUMNI_ORDER.map((id) => s.results[id] ?? 0)) : 1;
  const totalResults = s ? Object.values(s.results).reduce((a, b) => a + (b ?? 0), 0) : 0;
  const funnel = s
    ? [
        { k: 'Browser sessions', v: s.sessions },
        { k: 'Scrolled to the nine lights', v: s.sections.lights ?? 0 },
        { k: 'Started quiz', v: s.starts },
        ...[1, 2, 3, 4, 5, 6].map((q) => ({ k: `Reached Q${q}`, v: s.dropoff[String(q)] ?? 0 })),
        { k: 'Completed', v: s.completers },
        { k: 'Shared', v: s.share_sessions },
      ]
    : [];
  const maxHour = s ? Math.max(1, ...s.hourly.map((h) => h.sessions)) : 1;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-16 pt-5 sm:px-8">
      <BrandBar compact />
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Luminaire · Live analytics</p>
          <h1 className="mt-2 font-display text-4xl text-ivory sm:text-5xl">How students are engaging</h1>
          {s && (
            <p className="mt-2 text-xs text-bluegrey">
              Updated {new Date(s.generated_at).toLocaleTimeString('en-IN')} · refreshes every 30 s
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => void load()} className="btn-ghost min-h-11 px-4 text-xs">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={onExit} className="btn-ghost min-h-11 px-4 text-xs">
            <ArrowLeft size={14} /> Quiz
          </button>
        </div>
      </div>

      {!LIVE && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E6B77A]/40 bg-[#E6B77A]/10 p-4 text-sm text-warmgold">
          <span>
            <b>Demo mode.</b> No database connected, so this shows {sample ? 'simulated Homecoming traffic plus ' : ''}your own
            test runs in this browser. Connect your Google Sheet (see DEPLOY.md) to go live.
          </span>
          <span className="flex gap-2">
            <button className="btn-ghost min-h-10 px-3 text-xs" onClick={() => setSample((v) => !v)}>
              {sample ? 'Hide sample data' : 'Show sample data'}
            </button>
            <button
              className="btn-ghost min-h-10 px-3 text-xs"
              onClick={() => {
                clearLocal();
                void load();
              }}
            >
              Clear my test runs
            </button>
          </span>
        </div>
      )}
      {error && <p className="mt-4 text-sm text-[#E6B77A]">{error}</p>}

      {s && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {[
              { k: 'Page loads', v: s.page_loads ?? s.sessions, sub: `${s.sessions} browser sessions` },
              { k: 'Quiz starts', v: s.starts, sub: `${pct(s.starts, s.sessions)}% of sessions` },
              { k: 'Completions', v: s.completions, sub: `${pct(s.completers, s.starts)}% finish rate` },
              { k: 'Shares', v: s.shares, sub: `${pct(s.share_sessions, s.completers)}% of finishers` },
              { k: 'Retakes', v: s.retakes },
              { k: 'Median time', v: s.median_seconds != null ? `${Math.round(s.median_seconds)}s` : '–' },
            ].map((t) => (
              <div key={t.k} className="rounded-2xl border border-line bg-deep/80 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-bluegrey">{t.k}</p>
                <p className="mt-2 font-display text-4xl leading-none text-ivory tabular-nums">{t.v}</p>
                {t.sub && <p className="mt-2 text-[12px] text-gold">{t.sub}</p>}
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card title="Engagement funnel">
              <div className="space-y-2.5">
                {funnel.map((f) => (
                  <Bar key={f.k} label={f.k} value={f.v} max={Math.max(1, s.sessions)} sub={`${pct(f.v, s.sessions)}%`} />
                ))}
              </div>
            </Card>

            <Card title="Legacy matches">
              <div className="space-y-2.5">
                {ALUMNI_ORDER.map((id) => (
                  <Bar
                    key={id}
                    label={ALUMNI[id].name}
                    value={s.results[id] ?? 0}
                    max={maxResult}
                    sub={`${pct(s.results[id] ?? 0, totalResults)}%`}
                    accent
                  />
                ))}
              </div>
            </Card>

            <Card title="Answers by question" className="lg:col-span-2">
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {QUESTIONS.map((q) => {
                  const a = s.answers[String(q.id)] ?? {};
                  const tot = Object.values(a).reduce((x, y) => x + (y ?? 0), 0);
                  return (
                    <div key={q.id}>
                      <p className="mb-2.5 text-[13px] leading-snug text-ivory">
                        <span className="text-gold">Q{q.id}.</span> {q.prompt}
                      </p>
                      <div className="space-y-2">
                        {q.options.map((o) => {
                          const v = a[o.key as OptionKey] ?? 0;
                          return (
                            <div key={o.key} title={o.text} className="grid grid-cols-[1.25rem_1fr_2.5rem] items-center gap-2 text-[12px]">
                              <span className="text-silver">{o.key}</span>
                              <div className="h-2 overflow-hidden rounded-full bg-royal">
                                <div className="h-full rounded-full bg-celestial" style={{ width: `${pct(v, tot)}%`, background: '#285783' }} />
                              </div>
                              <span className="text-right tabular-nums text-silver">{pct(v, tot)}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card title="QR installations (?src=)">
              {s.sources.length ? (
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-bluegrey">
                      <th className="pb-2 font-medium">Source</th>
                      <th className="pb-2 text-right font-medium">Sessions</th>
                      <th className="pb-2 text-right font-medium">Completed</th>
                      <th className="pb-2 text-right font-medium">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.sources.map((r) => (
                      <tr key={r.source} className="border-t border-line">
                        <td className="py-2 text-ivory">{r.source}</td>
                        <td className="py-2 text-right tabular-nums text-silver">{r.sessions}</td>
                        <td className="py-2 text-right tabular-nums text-silver">{r.completions}</td>
                        <td className="py-2 text-right tabular-nums text-gold">{pct(r.completions, r.sessions)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-bluegrey">No data yet.</p>
              )}
            </Card>

            <Card title="Activity · last 24 hours">
              {s.hourly.length ? (
                <>
                  <div className="flex h-36 items-end gap-1">
                    {s.hourly.map((h) => (
                      <div key={h.hour} className="group relative flex h-full flex-1 flex-col justify-end" title={`${new Date(h.hour).toLocaleTimeString('en-IN', { hour: 'numeric' })}: ${h.sessions} sessions, ${h.completions} completions`}>
                        <div className="w-full rounded-t bg-gold/80" style={{ height: `${(h.sessions / maxHour) * 100}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] text-bluegrey">
                    <span>{new Date(s.hourly[0].hour).toLocaleTimeString('en-IN', { hour: 'numeric' })}</span>
                    <span>{new Date(s.hourly[s.hourly.length - 1].hour).toLocaleTimeString('en-IN', { hour: 'numeric' })}</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-bluegrey">No activity in the last 24 hours.</p>
              )}
              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center text-[12px]">
                {(['mobile', 'tablet', 'desktop'] as const).map((d) => (
                  <div key={d}>
                    <p className="font-display text-2xl text-ivory tabular-nums">{s.devices[d] ?? 0}</p>
                    <p className="capitalize text-bluegrey">{d}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Story scroll depth">
              <div className="space-y-2.5">
                {[
                  ['hero', 'Opening'],
                  ['manifesto', 'Manifesto'],
                  ['lights', 'Nine lights'],
                  ['how', 'How it works'],
                  ['cta', 'Final call'],
                ].map(([k, label]) => (
                  <Bar key={k} label={label} value={s.sections[k] ?? 0} max={Math.max(1, s.sessions)} sub={`${pct(s.sections[k] ?? 0, s.sessions)}%`} />
                ))}
              </div>
            </Card>

            <Card title="How people share">
              <div className="space-y-2.5">
                {['native', 'download', 'copy'].map((k) => (
                  <Bar
                    key={k}
                    label={{ native: 'Phone share sheet', download: 'Downloaded card', copy: 'Copied link' }[k]!}
                    value={s.shares_by[k] ?? 0}
                    max={Math.max(1, s.shares)}
                  />
                ))}
              </div>
              <p className="mt-4 text-[12px] text-bluegrey">Reveal skipped {s.reveal_skips} times.</p>
            </Card>
          </div>
          <p className="mt-8 text-center text-xs text-bluegrey">
            Counts are page loads and browser sessions (one per tab), not unique people. Anonymous data only: no names, emails, phone numbers or roll numbers.
          </p>
        </>
      )}
    </main>
  );
}
