import { Clock, Trophy } from 'lucide-react';
import type { Finish } from '../utils/api';
import { alcomLogo, alumniLogo } from './Brand';
import homecoming from '../assets/homecoming-logo.png';
import { Starburst } from './Constellation';
import { formatClock } from './QuizShell';

function exact(ms: number) {
  const s = ms / 1000;
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
}

export function ResultScreen({ roll, name, result, total, onNotYou }: { roll: string; name: string; result: Finish; total: number; onNotYou: () => void }) {
  void formatClock;
  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-[560px] flex-col items-center justify-center px-4 py-8 text-center sm:px-8">
      <div className="rise">
        <Starburst size={64} className="mx-auto" />
      </div>
      <p className="rise mt-3 text-[11px] font-medium uppercase tracking-[0.3em] text-gold" style={{ animationDelay: '0.1s' }}>
        Challenge complete
      </p>

      <section className="glass rise mt-5 w-full px-5 py-7 sm:px-9 sm:py-9" style={{ animationDelay: '0.2s' }}>
        <p className="font-display text-[26px] leading-tight text-ivory sm:text-[30px]">{name}</p>
        <p className="mt-2 inline-block rounded-full border border-[rgba(216,185,120,0.45)] px-4 py-1 text-[12px] tracking-[0.24em] text-warmgold">{roll}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="glass-soft px-3 py-4">
            <Trophy size={18} className="mx-auto text-gold" />
            <p className="mt-2 font-display text-[44px] leading-none text-ivory sm:text-[54px]">
              {result.score}
              <span className="text-[24px] text-bluegrey sm:text-[28px]"> / {total}</span>
            </p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.24em] text-bluegrey">Score</p>
          </div>
          <div className="glass-soft px-3 py-4">
            <Clock size={18} className="mx-auto text-gold" />
            <p className="mt-2 font-display text-[44px] leading-none tabular-nums text-ivory sm:text-[54px]">{exact(result.timeMs)}</p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.24em] text-bluegrey">Time</p>
          </div>
        </div>
        <p className="mt-6 font-display text-[22px] italic leading-snug text-warmgold sm:text-[26px]">Exciting perks await at Homecoming.</p>
        <p className="mt-2 text-[13.5px] text-silver">Thank you for playing. Your score and time are recorded.</p>
      </section>

      <img src={homecoming} alt="Homecoming" className="rise mt-9 w-[min(78vw,340px)]" style={{ animationDelay: '0.45s' }} />
      <div className="rise mt-4 flex items-center justify-center gap-3" style={{ animationDelay: '0.55s' }}>
        <div className="rounded-lg bg-ivory/95 px-2.5 py-1">
          <img src={alumniLogo} alt="XLRI Alumni" className="h-6 w-auto" />
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-ivory/95">
          <img src={alcomLogo} alt="XLRI ALCOM" className="h-8 w-8" />
        </div>
      </div>
      <p className="mt-3 text-[11px] tracking-[0.22em] text-bluegrey">HOMECOMING 2026 · 5–6 DECEMBER · XLRI JAMSHEDPUR</p>
      <button onClick={onNotYou} className="mt-6 text-[12px] uppercase tracking-[0.2em] text-bluegrey underline-offset-4 hover:text-ivory hover:underline">
        Not you? Use a different roll number
      </button>
    </main>
  );
}
