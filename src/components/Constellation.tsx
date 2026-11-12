import { starPath } from './StarBackground';

/** Signature gold starburst with a fine compass ring, echoing the Homecoming poster. */
export function Starburst({ size = 96, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <radialGradient id="sb-glow">
          <stop offset="0%" stopColor="#F0DCA5" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#F0DCA5" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="40" fill="url(#sb-glow)" />
      <g className="spin-slow">
        <circle cx="50" cy="50" r="27" fill="none" stroke="#D8B978" strokeWidth="0.5" opacity="0.6" />
        <circle cx="50" cy="50" r="33" fill="none" stroke="#D8B978" strokeWidth="0.3" opacity="0.35" strokeDasharray="1 3" />
      </g>
      <path d={starPath(50, 50, 46, 0.07)} fill="#D8B978" opacity="0.9" />
      <path d={starPath(50, 50, 22, 0.12)} fill="#F0DCA5" transform="rotate(45 50 50)" opacity="0.85" />
      <circle cx="50" cy="50" r="2.4" fill="#FFFFFF" />
    </svg>
  );
}

const NODES: [number, number][] = [
  [20, 140], [70, 90], [120, 120], [160, 50], [210, 95], [250, 30], [300, 80], [280, 150], [340, 130],
];
const EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [4, 7], [7, 8], [6, 8],
];

/** Animated constellation used in the reveal sequence. */
export function RevealConstellation({ lit }: { lit: boolean }) {
  return (
    <svg viewBox="0 0 360 180" className="w-full max-w-[420px]" aria-hidden>
      <g stroke="#D8B978" strokeWidth="0.9" fill="none" opacity={lit ? 0.75 : 0}>
        {EDGES.map(([a, b], i) => (
          <line
            key={i}
            x1={NODES[a][0]}
            y1={NODES[a][1]}
            x2={NODES[b][0]}
            y2={NODES[b][1]}
            className={lit ? 'draw' : ''}
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </g>
      {NODES.map(([x, y], i) => (
        <g key={i} style={{ transition: `opacity 0.6s ease ${i * 0.14}s`, opacity: lit || i % 2 === 0 ? 1 : 0.15 }}>
          <circle cx={x} cy={y} r="9" fill="#F0DCA5" opacity="0.12" />
          <path d={starPath(x, y, i === 5 ? 9 : 5, 0.16)} fill={i === 5 ? '#F0DCA5' : '#FFFFFF'} />
        </g>
      ))}
    </svg>
  );
}
