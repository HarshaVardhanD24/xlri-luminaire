import { useEffect, useState } from 'react';
import { ALUMNI, ALUMNI_ORDER, type AlumniId } from '../data/alumni';
import { NineSky } from './NineSky';

/**
 * The same nine-star sky from the landing page: every light flickers on,
 * the constellation joins up, then the winner's star takes focus.
 */
export function ResultReveal({ winner, onDone, onSkip }: { winner: AlumniId; onDone: () => void; onSkip: () => void }) {
  const [lit, setLit] = useState(0);
  const [phase, setPhase] = useState(0);
  const win = ALUMNI_ORDER.indexOf(winner);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, reduced ? ms / 4 : ms));
    for (let i = 1; i <= 9; i++) at(500 + i * 150, () => setLit(i));
    at(2300, () => setPhase(1));
    at(3300, () => setPhase(2));
    at(5000, onDone);
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  const a = ALUMNI[winner];

  return (
    <main className="one-view mx-auto flex w-full max-w-4xl flex-col items-center justify-center px-5 text-center" aria-live="polite">
      <p className="eyebrow h-5 transition-opacity duration-700" style={{ opacity: phase === 0 ? 1 : 0, letterSpacing: '0.34em' }}>
        Your journey has a match…
      </p>

      <div className="my-4 h-[44dvh] w-full sm:my-6 sm:h-[48dvh]">
        <NineSky lit={lit} edges={Math.max(0, lit - 1)} focus={phase >= 1 ? win : -1} labels={phase >= 1} className="h-full w-full" />
      </div>

      <div className="h-[130px] sm:h-[150px]">
        <p
          className="font-display text-[24px] italic text-warmgold transition-all duration-1000 sm:text-[30px]"
          style={{ opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? 'none' : 'translateY(10px)' }}
        >
          Your XLRI legacy match is…
        </p>
        <p
          className="mt-3 font-display text-[38px] font-medium leading-none text-ivory transition-all duration-1000 sm:text-[60px]"
          style={{
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? 'none' : 'translateY(16px) scale(0.97)',
            filter: phase >= 2 ? 'none' : 'blur(8px)',
          }}
        >
          {a.name}
        </p>
      </div>

      <button className="mt-8 min-h-11 px-4 text-xs tracking-[0.2em] text-bluegrey hover:text-silver" onClick={onSkip}>
        SKIP
      </button>
    </main>
  );
}
