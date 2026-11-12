import { memo, useMemo } from 'react';

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export function starPath(cx: number, cy: number, r: number, w = 0.18) {
  const k = r * w;
  return `M${cx} ${cy - r} L${cx + k} ${cy - k} L${cx + r} ${cy} L${cx + k} ${cy + k} L${cx} ${cy + r} L${cx - k} ${cy + k} L${cx - r} ${cy} L${cx - k} ${cy - k} Z`;
}

/** Curved four-point sparkle outline, like the reference artwork. */
function Sparkle({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <path
        d="M20 2 C21 14 26 19 38 20 C26 21 21 26 20 38 C19 26 14 21 2 20 C14 19 19 14 20 2 Z"
        fill="rgba(174,187,204,0.06)"
        stroke="rgba(174,187,204,0.55)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Dashed constellations in screen-shaped coordinates (wide screens / phones).
const WIDE: [number, number][][] = [
  [[60, 140], [180, 115], [290, 150], [310, 205]],
  [[640, 70], [740, 120], [860, 85], [900, 165]],
  [[100, 470], [220, 440], [350, 505], [300, 590]],
  [[660, 470], [790, 440], [900, 500], [820, 590], [700, 570]],
];
const NARROW: [number, number][][] = [
  [[20, 90], [110, 60], [170, 120]],
  [[260, 40], [330, 95], [385, 70]],
  [[15, 700], [90, 650], [150, 720]],
  [[250, 760], [320, 700], [390, 770], [345, 840]],
];

const SPARKLES = [
  { l: '9%', t: '14%', s: 56, c: 'float-a' },
  { l: '86%', t: '9%', s: 42, c: 'float-b' },
  { l: '80%', t: '58%', s: 46, c: 'float-c' },
  { l: '16%', t: '80%', s: 34, c: 'float-b' },
  { l: '55%', t: '88%', s: 22, c: 'float-a' },
];

function Constellations({ sets, w, h, className }: { sets: [number, number][][]; w: number; h: number; className: string }) {
  return (
    <svg className={`absolute inset-0 h-full w-full ${className}`} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice">
      <g stroke="rgba(174,187,204,0.32)" strokeWidth="1.2" strokeDasharray="7 7" fill="none">
        {sets.map((pts, i) => (
          <polyline key={i} points={pts.map((p) => p.join(',')).join(' ')} />
        ))}
      </g>
      <g fill="rgba(174,187,204,0.55)">
        {sets.flat().map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={3.4} />
        ))}
      </g>
    </svg>
  );
}

type Star = { x: number; y: number; s: number; o: number };

/**
 * Layered night sky: twinkling dust, dashed constellations and floating sparkles.
 * Layers drift at different speeds with page scroll (driven by --sp).
 */
function StarBackgroundImpl({ intensity = 1 }: { intensity?: number }) {
  const dust = useMemo(() => {
    const r = rng(1949);
    const g: Star[][] = [[], [], []];
    for (let i = 0; i < 170; i++) {
      g[i % 3].push({ x: r() * 1000, y: r() * 1350, s: r() < 0.9 ? 0.5 + r() * 0.8 : 1.4 + r() * 0.9, o: 0.25 + r() * 0.55 });
    }
    return g;
  }, []);
  const tw = ['tw-a', 'tw-b', 'tw-c'];

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-midnight">
      <div
        className="parallax-far absolute -left-1/4 -top-1/4 h-[80vmax] w-[80vmax] rounded-full opacity-80 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgba(40,87,131,0.38), transparent)' }}
      />
      <div
        className="parallax-mid absolute -bottom-1/3 -right-1/4 h-[75vmax] w-[75vmax] rounded-full opacity-70 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgba(22,58,99,0.6), transparent)' }}
      />
      <div
        className="absolute left-1/2 top-[40%] h-[55vmax] w-[55vmax] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-opacity duration-1000"
        style={{ background: `radial-gradient(closest-side, rgba(216,185,120,${0.05 * intensity}), transparent)` }}
      />

      <svg className="parallax-far absolute left-0 top-0 h-[135%] w-full" viewBox="0 0 1000 1350" preserveAspectRatio="xMidYMin slice">
        {dust.map((stars, gi) => (
          <g key={gi} className={tw[gi]}>
            {stars.map((st, i) => (
              <circle key={i} cx={st.x} cy={st.y} r={st.s} fill={i % 11 === 0 ? '#F0DCA5' : '#FFFFFF'} opacity={st.o} />
            ))}
          </g>
        ))}
      </svg>

      <div className="parallax-mid absolute inset-x-0 top-0 h-[115%]">
        <Constellations sets={WIDE} w={1000} h={650} className="hidden sm:block" />
        <Constellations sets={NARROW} w={400} h={860} className="sm:hidden" />
      </div>

      <div className="parallax-near absolute inset-x-0 top-0 h-[120%]">
        {SPARKLES.map((sp, i) => (
          <div key={i} className={`absolute ${sp.c} ${i > 2 ? 'hidden sm:block' : ''}`} style={{ left: sp.l, top: sp.t }}>
            <Sparkle size={sp.s} />
          </div>
        ))}
      </div>

      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(4,12,24,0.6))' }} />
    </div>
  );
}

export const StarBackground = memo(StarBackgroundImpl);
