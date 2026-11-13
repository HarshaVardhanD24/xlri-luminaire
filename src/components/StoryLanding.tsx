import { ArrowRight, ChevronDown, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { SLOTS } from '../data/quizData';
import { useReveal, useSectionProgress } from '../utils/scroll';
import { BrandBar, alcomLogo, alumniLogo } from './Brand';
import { Starburst } from './Constellation';
import { PrivacyNote } from './PrivacyNote';

type V = CSSProperties & Record<`--${string}`, string | number>;

function CTA({ onStart, label = 'Start the challenge', glow = true }: { onStart: () => void; label?: string; glow?: boolean }) {
  return (
    <div className="relative w-full max-w-sm sm:w-auto">
      {glow && <div className="glow-cta" />}
      <button onClick={onStart} className="btn-gold w-full sm:w-auto sm:px-9">
        {label} <ArrowRight size={18} strokeWidth={2.2} />
      </button>
    </div>
  );
}

/* ---------------- 1. Hero: headline dissolves into the campaign line ---------------- */
/** Floating seven-star constellation from the reference art. */
function HeroConstellation() {
  const pts: [number, number][] = [[230, 40], [120, 120], [50, 240], [160, 330], [290, 270], [320, 130], [400, 230]];
  const lines: [number, number, boolean][] = [[0, 1, true], [1, 2, true], [2, 3, true], [3, 4, true], [4, 5, true], [0, 5, true], [5, 6, false], [4, 6, false]];
  return (
    <svg viewBox="0 0 450 380" className="mx-auto w-full max-w-[420px]" aria-hidden>
      <defs>
        <radialGradient id="hc-glow">
          <stop offset="0%" stopColor="#285783" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#285783" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="225" cy="190" r="190" fill="url(#hc-glow)" />
      {lines.map(([a, b, dashed], i) => (
        <line key={i} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} stroke="#D8B978" strokeOpacity={dashed ? 0.55 : 0.4} strokeWidth="1.3" strokeDasharray={dashed ? '6 6' : undefined} />
      ))}
      {pts.map(([x, y], i) => (
        <g key={i} className={i % 2 ? 'tw-a' : 'tw-b'}>
          <circle cx={x} cy={y} r="15" fill="rgba(174,187,204,0.16)" />
          <circle cx={x} cy={y} r="4.5" fill="#F0DCA5" />
        </g>
      ))}
      <g>
        <circle r="13" fill="rgba(240,220,165,0.28)" />
        <path d="M0,-10 C1,-2 2,-1 10,0 C2,1 1,2 0,10 C-1,2 -2,1 -10,0 C-2,-1 -1,-2 0,-10 Z" fill="#FFF4D2" />
        <animateMotion dur="9s" repeatCount="indefinite" path={`M${[0, 1, 2, 3, 4, 5].map((i) => pts[i].join(',')).join(' L')} Z`} />
      </g>
      <foreignObject x="85" y="150" width="280" height="90">
        <div className="perks-glow grid h-full place-items-center text-center font-display text-[30px] italic leading-tight">Exciting perks await</div>
      </foreignObject>
    </svg>
  );
}

/** "Exciting perks await" with a soft glow and a small star orbiting it. */
function PerksOrbit({ className = '' }: { className?: string }) {
  const orbit = 'M8,44 a122,34 0 1,0 244,0 a122,34 0 1,0 -244,0';
  return (
    <div className={`relative h-[88px] w-[260px] ${className}`}>
      <div className="perks-halo absolute inset-x-6 inset-y-3 rounded-full" />
      <svg viewBox="0 0 260 88" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <path d={orbit} fill="none" stroke="#D8B978" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="3 5" />
        <g>
          <circle r="9" fill="rgba(240,220,165,0.25)" />
          <path d="M0,-7 C0.8,-1.6 1.6,-0.8 7,0 C1.6,0.8 0.8,1.6 0,7 C-0.8,1.6 -1.6,0.8 -7,0 C-1.6,-0.8 -0.8,-1.6 0,-7 Z" fill="#FFF4D2" />
          <animateMotion dur="6s" repeatCount="indefinite" path={orbit} />
        </g>
      </svg>
      <p className="perks-glow absolute inset-0 grid place-items-center font-display text-[22px] italic">Exciting perks await</p>
    </div>
  );
}

function Hero({ onStart }: { onStart: () => void }) {
  const [faded, setFaded] = useState(false);
  const ref = useSectionProgress<HTMLElement>('pin', (p) => setFaded((f) => (f === p > 0.36 ? f : p > 0.36)));
  return (
    <section ref={ref} className="p-var relative h-[230vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="absolute inset-x-0 top-0 z-10 mx-auto max-w-5xl px-5 pt-5 sm:px-8 sm:pt-7" style={{ opacity: 'clamp(0, calc(1 - var(--p) * 3), 1)' } as V}>
          <BrandBar />
        </div>

        {/* Layer A: the question (glass, floating, left-aligned on desktop) */}
        <div
          className="tf absolute inset-0 mx-auto flex max-w-6xl items-center px-5 pt-16 sm:px-10"
          aria-hidden={faded}
          style={{
            pointerEvents: faded ? 'none' : 'auto',
            opacity: 'clamp(0, calc(1 - var(--p) * 2.6), 1)',
            transform: 'translateY(calc(var(--p) * -90px)) scale(calc(1 - var(--p) * 0.15))',
          } as V}
        >
          <div className="grid w-full items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="text-center lg:text-left">
              <div className="rise hide-short lg:hidden" style={{ animationDelay: '0.1s' }}>
                <Starburst size={72} className="mx-auto" />
              </div>
              <p className="rise mt-4 text-[11px] font-medium uppercase tracking-[0.3em] text-gold lg:mt-0 sm:text-[12px]" style={{ animationDelay: '0.2s' }}>
                Luminaire · XLRI Alumni Cell presents
              </p>
              <div className="rise mt-5 hidden items-center gap-4 lg:flex" style={{ animationDelay: '0.25s' }}>
                <svg width="30" height="30" viewBox="0 0 40 40" aria-hidden>
                  <path d="M20 2 C21 14 26 19 38 20 C26 21 21 26 20 38 C19 26 14 21 2 20 C14 19 19 14 20 2 Z" fill="rgba(216,185,120,0.15)" stroke="#D8B978" strokeWidth="1.6" />
                </svg>
                <span className="h-px w-[60%] bg-gradient-to-r from-gold/60 to-transparent" />
              </div>
              <h1
                className="rise mt-5 font-display text-[42px] font-semibold uppercase leading-[1.02] text-ivory min-[400px]:text-[48px] sm:text-[68px] lg:text-[76px]"
                style={{ animationDelay: '0.35s' }}
              >
                The XLRI
                <br />
                Legends
                <br />
                <span className="text-gold">Challenge</span>
              </h1>
              <p className="rise mx-auto mt-6 max-w-lg text-[17px] leading-snug text-ivory/90 sm:text-[20px] lg:mx-0" style={{ animationDelay: '0.5s' }}>
                Five rounds. One shot each. Beat the clock.
              </p>
              <div className="rise mt-5 flex justify-center lg:hidden" style={{ animationDelay: '0.6s' }}>
                <PerksOrbit />
              </div>
              <p className="rise mx-auto mt-3 hidden max-w-lg text-[15px] leading-relaxed text-bluegrey sm:block lg:mx-0" style={{ animationDelay: '0.6s', color: '#8C9BB0' }}>
                Name the blurred alumni, crack the word search, catch the lie and decode the emojis. The sharpest and fastest
                players win exciting perks at Homecoming.
              </p>
              <div className="rise mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start" style={{ animationDelay: '0.75s' }}>
                <CTA onStart={onStart} />
                <p className="max-w-[11rem] text-[11px] uppercase leading-relaxed tracking-[0.2em] text-bluegrey">About 3 minutes. Roll number needed.</p>
              </div>
            </div>

            <div className="fadein relative hidden lg:block" style={{ animationDelay: '0.6s' }}>
              <div className="card-float">
                <HeroConstellation />
              </div>
              <p className="mt-6 text-center text-[13px] tracking-[0.45em] text-silver/80">ONE XLRI · INFINITE LEGACIES</p>
            </div>
          </div>

          <div className="fadein hide-short absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[11px] tracking-[0.28em] text-silver" style={{ animationDelay: '1.4s' }}>
            SCROLL TO EXPLORE
            <span className="relative h-9 w-px overflow-hidden bg-line">
              <span className="scroll-cue absolute inset-0 bg-gold" />
            </span>
          </div>
        </div>

        {/* Layer B: the campaign line emerges */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
          <div
            className="tf"
            style={{
              opacity: 'clamp(0, calc((var(--p) - 0.3) * 4), 1)',
              transform: 'scale(calc(0.86 + var(--p) * 0.18))',
            } as V}
          >
            <Starburst size={120} className="mx-auto mb-6" />
          </div>
          <p
            className="tf font-display text-[54px] font-medium leading-none text-ivory sm:text-[110px]"
            style={{
              opacity: 'clamp(0, calc((var(--p) - 0.36) * 4), 1)',
              letterSpacing: 'calc(0.02em + var(--p) * 0.12em)',
              transform: 'translateY(calc((1 - var(--p)) * 40px))',
            } as V}
          >
            ONE XLRI.
          </p>
          <p
            className="tf mt-3 font-display text-[30px] italic text-warmgold sm:text-[56px]"
            style={{
              opacity: 'clamp(0, calc((var(--p) - 0.55) * 4), 1)',
              transform: 'translateY(calc((1 - var(--p)) * 60px))',
            } as V}
          >
            Infinite legacies.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 2. Manifesto: words light up as you scroll ---------------- */
const WORDS = ['Five', 'rounds.', 'One', 'shot', 'each.', 'Every', 'second', 'counts.'];

function Manifesto() {
  const ref = useSectionProgress<HTMLElement>('pin');
  return (
    <section ref={ref} className="p-var relative h-[230vh]">
      <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden px-6">
        <div className="max-w-4xl text-center">
          <p className="eyebrow mb-8" style={{ opacity: 'clamp(0, calc(var(--p) * 6), 1)' } as V}>
            Since 1949
          </p>
          <h2 className="font-display text-[44px] font-medium leading-[1.08] sm:text-[84px]">
            {WORDS.map((w, i) => (
              <span
                key={i}
                className="tf scroll-blur inline-block"
                style={{
                  '--i': i,
                  '--w': 'clamp(0, calc(var(--p) * 10 - var(--i) - 0.6), 1)',
                  opacity: 'max(0.18, var(--w))',
                  transform: 'translateY(calc((1 - var(--w)) * 18px))',
                  filter: 'blur(calc((1 - var(--w)) * 5px))',
                  color: i >= 5 ? '#F0DCA5' : '#F6F3EA',
                  fontStyle: i >= 5 ? 'italic' : 'normal',
                  marginRight: '0.25em',
                } as V}
              >
                {w}
                {i === 4 && <br />}
              </span>
            ))}
          </h2>
          <p
            className="tf mx-auto mt-10 max-w-md text-[16px] leading-relaxed text-silver sm:text-lg"
            style={{
              opacity: 'clamp(0, calc((var(--p) - 0.72) * 6), 1)',
              transform: 'translateY(calc((1 - clamp(0, calc((var(--p) - 0.72) * 6), 1)) * 20px))',
            } as V}
          >
            Spot the legends, beat the clock. Your score and your total time decide who takes home the perks.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 3. Five rounds: each one lights up in turn ---------------- */
const ROUND_ICONS = ['\u{1F5BC}\uFE0F', '\u{1F524}', '\u2696\uFE0F', '\u23F3', '\u{1F60E}'];

function Rounds({ onStart }: { onStart: () => void }) {
  const [idx, setIdx] = useState(-1);
  const n = SLOTS.length;
  const ref = useSectionProgress<HTMLElement>('pin', (p) => {
    const next = p < 0.04 ? -1 : p > 0.9 ? n : Math.min(n - 1, Math.floor(((p - 0.04) / 0.86) * n));
    setIdx((cur) => (cur === next ? cur : next));
  });
  const done = idx >= n;

  return (
    <section ref={ref} className="p-var relative h-[420vh]">
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden px-5 pb-6 pt-16 sm:px-10 sm:pt-20">
        <div className="mx-auto w-full max-w-xl text-center">
          <p className="eyebrow">Five rounds · Same order for everyone</p>
          <div className="mx-auto mt-4 flex max-w-xs items-center gap-1.5">
            {SLOTS.map((s, i) => (
              <span key={s.kind} className="h-[3px] flex-1 rounded-full transition-colors duration-500" style={{ background: i <= idx ? '#D8B978' : '#263D58' }} />
            ))}
          </div>
        </div>

        <div className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col justify-center gap-[clamp(8px,1.8vh,16px)] py-3">
          {SLOTS.map((s, i) => {
            const lit = i <= idx || done;
            const cur = i === idx;
            return (
              <div
                key={s.kind}
                className="glass flex items-center gap-4 px-4 py-[clamp(10px,2vh,18px)] transition-all duration-500 sm:px-6"
                style={{
                  borderRadius: 22,
                  opacity: lit ? 1 : 0.28,
                  transform: cur ? 'scale(1.03)' : 'scale(1)',
                  borderColor: cur ? 'rgba(216,185,120,0.6)' : undefined,
                  boxShadow: cur ? '0 0 40px -12px rgba(216,185,120,0.55)' : undefined,
                }}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/40 text-[20px] sm:h-12 sm:w-12" aria-hidden>
                  {ROUND_ICONS[i]}
                </span>
                <div className="min-w-0 text-left">
                  <p className="text-[10.5px] tracking-[0.28em] text-bluegrey">ROUND {i + 1}</p>
                  <p className="font-display text-[20px] leading-tight text-ivory sm:text-[26px]">{s.title}</p>
                  <p className="text-[13px] text-silver">{s.blurb}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mx-auto h-[92px] w-full max-w-xl text-center">
          {idx < 0 && <p className="rise pt-4 font-display text-[24px] italic text-silver sm:text-3xl">Keep scrolling to see the rounds…</p>}
          {done && (
            <div className="rise flex flex-col items-center">
              <p className="font-display text-[26px] leading-tight text-ivory sm:text-[38px]">
                Ready? <span className="italic text-warmgold">The clock is waiting.</span>
              </p>
              <div className="mt-4 flex w-full justify-center">
                <CTA onStart={onStart} label="Start the challenge" glow={false} />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------- 4. How it works: numbers slide in ---------------- */
function HowItWorks() {
  const ref = useSectionProgress<HTMLElement>('through');
  const rows = [
    { n: '5', k: 'rounds', d: 'Five quick formats, always in the same order.' },
    { n: '1', k: 'shot each', d: 'Every answer is final. No takebacks.' },
    { n: '3', k: 'minutes', d: 'Built for one hand. Your total time breaks ties.' },
  ];
  return (
    <section ref={ref} className="p-var relative mx-auto max-w-5xl px-6 py-28 sm:py-40">
      <p className="eyebrow text-center" data-reveal>
        How it works
      </p>
      <div className="mt-12 space-y-5 sm:space-y-7">
        {rows.map((r, i) => (
          <div
            key={r.k}
            className="tf glass flex items-end gap-5 px-6 py-6 sm:gap-10 sm:px-10"
            style={{
              '--i': i,
              '--w': 'clamp(0, calc(var(--p) * 3.2 - var(--i) * 0.35 - 0.3), 1)',
              opacity: 'var(--w)',
              transform: `translateX(calc((1 - var(--w)) * ${i % 2 ? -60 : 60}px))`,
            } as V}
          >
            <span className="font-display text-[96px] font-medium leading-[0.8] text-warmgold sm:text-[150px]">{r.n}</span>
            <div className="pb-2">
              <p className="font-display text-[30px] leading-none text-ivory sm:text-[52px]">{r.k}</p>
              <p className="mt-3 text-[15px] text-silver sm:text-base">{r.d}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- 5. Final call ---------------- */
function FinalCTA({ onStart, sentinel }: { onStart: () => void; sentinel: React.RefObject<HTMLDivElement | null> }) {
  const ref = useSectionProgress<HTMLElement>('through');
  return (
    <section ref={ref} className="p-var relative overflow-hidden px-6 pb-10 pt-24">
      <div
        className="tf pointer-events-none absolute left-1/2 top-[30%] h-[110vmin] w-[110vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(closest-side, rgba(216,185,120,0.22), transparent)',
          transform: 'translate(-50%, -50%) scale(calc(0.5 + var(--p) * 0.8))',
        } as V}
      />
      <div ref={sentinel} className="relative mx-auto flex min-h-[80svh] max-w-2xl flex-col items-center justify-center text-center">
        <div data-reveal>
          <Starburst size={92} />
        </div>
        <h2 className="mt-8 font-display text-[48px] font-medium leading-[1.02] text-ivory sm:text-[80px]" data-reveal style={{ '--d': '0.1s' } as V}>
          Think you know
          <br />
          <span className="italic text-warmgold">XLRI?</span>
        </h2>
        <p className="mt-6 max-w-sm text-base leading-relaxed text-silver" data-reveal style={{ '--d': '0.2s' } as V}>
          Prove it. Five rounds, one try each, and a clock that never stops.
        </p>
        <div className="mt-10 flex w-full justify-center" data-reveal style={{ '--d': '0.3s' } as V}>
          <CTA onStart={onStart} />
        </div>
        <p className="mt-5 flex items-center gap-2 text-[13px] text-bluegrey" data-reveal style={{ '--d': '0.4s' } as V}>
          <ShieldCheck size={15} /> Just your roll number. No sign-up.
        </p>
        <PrivacyNote className="mx-auto mt-4 max-w-md" />
      </div>

      <footer className="relative mx-auto mt-16 max-w-5xl border-t border-line pt-8 text-center">
        <div className="flex items-center justify-center gap-4">
          <div className="rounded-lg bg-ivory/95 px-2.5 py-1">
            <img src={alumniLogo} alt="XLRI Alumni" className="h-7 w-auto" />
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-full bg-ivory/95">
            <img src={alcomLogo} alt="XLRI ALCOM" className="h-9 w-9" />
          </div>
        </div>
        <p className="mt-5 font-display text-[16px] tracking-[0.2em] text-gold sm:text-lg sm:tracking-[0.32em]">ONE XLRI. INFINITE LEGACIES.</p>
        <p className="mt-2 text-[11px] tracking-[0.22em] text-bluegrey">HOMECOMING 2026 · 5–6 DECEMBER · XLRI JAMSHEDPUR</p>
        <p className="mt-3 text-xs text-bluegrey">alumnicommittee@xlri.ac.in</p>
      </footer>
    </section>
  );
}

/* ---------------- Page ---------------- */
export function StoryLanding({ onStart }: { onStart: () => void }) {
  const [floatVisible, setFloatVisible] = useState(false);
  const finalRef = useRef<HTMLDivElement>(null);
  const finalInView = useRef(false);

  useReveal([]);

  // Floating CTA: visible after the hero, hidden near the final call to action.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const show = window.scrollY > window.innerHeight * 1.3 && !finalInView.current;
        setFloatVisible((v) => (v === show ? v : show));
      });
    };
    const io = new IntersectionObserver(([e]) => {
      finalInView.current = e.isIntersecting;
      onScroll();
    });
    if (finalRef.current) io.observe(finalRef.current);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <main className="relative">
      {/* page progress hairline */}
      <div className="fixed inset-x-0 top-0 z-40 h-[2px] origin-left bg-gold/80" style={{ transform: 'scaleX(var(--sp))' } as V} />

      <Hero onStart={onStart} />
      <Manifesto />
      <Rounds onStart={onStart} />
      <HowItWorks />
      <FinalCTA onStart={onStart} sentinel={finalRef} />

      <div
        className="float-cta fixed inset-x-0 bottom-0 z-40 flex justify-center px-5 pb-[max(16px,env(safe-area-inset-bottom))]"
        style={{ transform: floatVisible ? 'none' : 'translateY(130%)', opacity: floatVisible ? 1 : 0 }}
        aria-hidden={!floatVisible}
      >
        <button
          onClick={onStart}
          tabIndex={floatVisible ? 0 : -1}
          className="btn-gold min-h-[50px] w-full max-w-sm shadow-[0_12px_40px_-8px_rgba(0,0,0,0.8)]"
        >
          Start the challenge <ChevronDown size={18} className="-rotate-90" />
        </button>
      </div>
    </main>
  );
}
