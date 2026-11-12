import { RotateCcw, Share2 } from 'lucide-react';
import { useState } from 'react';
import type { Alumnus } from '../data/alumni';
import { useReveal } from '../utils/scroll';
import { asset } from './Brand';
import { PrivacyNote } from './PrivacyNote';

/** Portrait medallion: approved photo if present in /public/portraits, otherwise initials. */
export function Portrait({ alumnus, size = 168 }: { alumnus: Alumnus; size?: number }) {
  const [failed, setFailed] = useState(false);
  const showImg = alumnus.portrait && !failed;
  const tiny = size < 90;
  return (
    <div className="relative mx-auto shrink-0" style={{ width: size, height: size }}>
      {!tiny && (
        <div
          className="absolute -inset-8 rounded-full blur-2xl"
          style={{ background: 'radial-gradient(closest-side, rgba(216,185,120,0.28), transparent)' }}
        />
      )}
      <div
        className="relative grid h-full w-full place-items-center overflow-hidden rounded-full"
        style={{
          background: 'radial-gradient(circle at 40% 30%, #285783, #163A63 45%, #0B1D35)',
          boxShadow: tiny
            ? 'inset 0 0 0 1.5px rgba(216,185,120,0.8)'
            : 'inset 0 0 0 1.5px #D8B978, 0 0 30px -6px rgba(216,185,120,0.5)',
        }}
      >
        {showImg ? (
          <img
            src={asset(alumnus.portrait!)}
            alt={`Portrait of ${alumnus.name}`}
            className="h-full w-full object-cover object-top"
            onError={() => setFailed(true)}
          />
        ) : (
          <span className="font-display font-medium text-warmgold" style={{ fontSize: size * 0.33 }} aria-label={alumnus.name}>
            {alumnus.initials}
          </span>
        )}
      </div>
      {!tiny && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(216,185,120,0.45)" strokeWidth="0.4" strokeDasharray="0.6 1.6" />
          {[
            [50, 3],
            [97, 50],
            [50, 97],
            [3, 50],
          ].map(([x, y], i) => (
            <path key={i} d={`M${x} ${y - 2.2} L${x + 0.5} ${y - 0.5} L${x + 2.2} ${y} L${x + 0.5} ${y + 0.5} L${x} ${y + 2.2} L${x - 0.5} ${y + 0.5} L${x - 2.2} ${y} L${x - 0.5} ${y - 0.5} Z`} fill="#F0DCA5" />
          ))}
        </svg>
      )}
    </div>
  );
}

interface Props {
  alumnus: Alumnus;
  runnerUp: Alumnus;
  onShare: () => void;
  onRetake: () => void;
}

export function AlumniCard({ alumnus, runnerUp, onShare, onRetake }: Props) {
  useReveal([alumnus.id]);
  const d = (s: number) => ({ animationDelay: `${s}s` });

  return (
    <main className="mx-auto w-full max-w-[780px] px-4 pb-14 pt-8 sm:px-8 sm:pt-12">
      <div className="rise flex items-center justify-center gap-4 text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
        <span className="h-px w-10 bg-gold/50" /> Your XLRI legacy match <span className="h-px w-10 bg-gold/50" />
      </div>

      <section className="glass rise mt-6 px-5 pb-6 pt-9 text-center sm:px-11 sm:pb-10 sm:pt-12" style={d(0.1)}>
        <div className="rise" style={d(0.25)}>
          <Portrait alumnus={alumnus} size={176} />
        </div>
        <p className="rise mt-7 text-[11px] uppercase tracking-[0.3em] text-bluegrey" style={d(0.4)}>
          You resonate with…
        </p>
        <h1 className="rise mt-3 font-display text-[38px] font-medium leading-[1.05] text-ivory sm:text-[54px]" style={d(0.5)}>
          {alumnus.name}
        </h1>
        <div className="rise mt-5" style={d(0.6)}>
          <span className="chip inline-block px-5 py-2 text-[11px] font-medium uppercase tracking-[0.22em] text-warmgold sm:text-[12px]" style={{ borderColor: 'rgba(216,185,120,0.45)' }}>
            {alumnus.archetype}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {alumnus.traits.map((t, i) => (
            <span key={t} data-reveal className="chip px-3.5 py-1.5 text-[12px] text-silver sm:text-[13px]" style={{ '--d': `${0.2 + i * 0.06}s` } as React.CSSProperties}>
              {t}
            </span>
          ))}
        </div>

        <div className="my-7 h-px bg-line" />

        <div className="space-y-4 text-left" data-reveal>
          <p className="text-[16px] leading-relaxed text-ivory sm:text-[17px]">{alumnus.headline}</p>
          <p className="text-[15px] leading-relaxed text-silver sm:text-[16px]">{alumnus.body}</p>
          <p className="font-display text-[20px] italic leading-snug text-warmgold sm:text-[23px]">
            Your journey is yours to write. Here's the legacy that inspires yours.
          </p>
        </div>

        <div className="glass-soft mt-7 p-5 text-left sm:p-6" data-reveal>
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold">Career highlights</p>
          <p className="mt-3 text-[14.5px] leading-relaxed text-ivory/90 sm:text-[15px]">{alumnus.highlights.join('; ')}.</p>
          {alumnus.education && alumnus.education !== 'XLRI Alumnus' && (
            <p className="mt-2 text-[13.5px] text-silver">{alumnus.education}</p>
          )}
          <p className="mt-3 text-[13.5px] text-bluegrey">
            <span className="text-gold">Inspiration</span> · {alumnus.inspiration}
          </p>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row" data-reveal>
          <button onClick={onShare} className="btn-gold flex-[1.3]">
            Share my XLRI legacy <Share2 size={16} />
          </button>
          <button onClick={onRetake} className="btn-ghost flex-1 text-[13px]">
            <RotateCcw size={15} /> Discover another match
          </button>
        </div>
      </section>

      <section data-reveal className="glass mt-5 flex items-center gap-5 px-5 py-5 sm:px-7" style={{ borderRadius: 24 }}>
        <Portrait alumnus={runnerUp} size={68} />
        <div className="min-w-0 text-left">
          <p className="text-[10.5px] uppercase tracking-[0.26em] text-bluegrey">Secondary match</p>
          <p className="mt-1 font-display text-[22px] leading-tight text-ivory sm:text-2xl">{runnerUp.name}</p>
          <p className="mt-0.5 text-[13px] text-silver">{runnerUp.archetype}</p>
        </div>
      </section>

      <footer data-reveal className="mt-10 text-center">
        <p className="font-display text-[15px] tracking-[0.24em] text-gold sm:text-lg">ONE XLRI. INFINITE LEGACIES.</p>
        <p className="mt-2 text-[11px] uppercase tracking-[0.24em] text-bluegrey">XLRI Alumni Cell · Homecoming 2026</p>
        <p className="mx-auto mt-5 max-w-md text-xs leading-relaxed text-bluegrey">
          An engagement experience celebrating publicly documented alumni journeys. Not a personality test, a career
          prediction or a psychological profile.
        </p>
        <PrivacyNote className="mx-auto mt-3 max-w-md" />
      </footer>
    </main>
  );
}
