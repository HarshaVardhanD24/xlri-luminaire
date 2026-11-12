import { useEffect, useState } from 'react';
import { ALUMNI, ALUMNI_ORDER } from '../data/alumni';
import { starPath } from './StarBackground';

/** Nine lights, one per alumnus. Shared by the story landing and the result reveal. */
export const NODES: [number, number][] = [
  [110, 420], [235, 285], [375, 375], [480, 205], [600, 320], [705, 150], [800, 300], [895, 175], [935, 430],
];

/** Taller arrangement for phones, so the sky fills a portrait screen. */
export const NODES_PORTRAIT: [number, number][] = [
  [95, 820], [250, 700], [120, 565], [330, 490], [210, 345], [430, 295], [300, 160], [470, 70], [515, 420],
];

function useNarrow() {
  const q = '(max-width: 639px)';
  const [narrow, setNarrow] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setNarrow(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return narrow;
}

interface Props {
  /** Nodes with index < lit are illuminated. */
  lit: number;
  /** Edges with index < edges are drawn (edge i joins node i and i+1). */
  edges: number;
  /** Index of the node to emphasise with a halo, or -1. */
  focus?: number;
  labels?: boolean;
  className?: string;
}

export function NineSky({ lit, edges, focus = -1, labels = true, className = '' }: Props) {
  const narrow = useNarrow();
  const nodes = narrow ? NODES_PORTRAIT : NODES;
  return (
    <svg
      viewBox={narrow ? '0 0 610 900' : '0 0 1000 560'}
      className={className}
      aria-hidden
      style={{ overflow: 'visible' }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id="ns-glow">
          <stop offset="0%" stopColor="#F0DCA5" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#F0DCA5" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g fill="none" stroke="#D8B978" strokeWidth="1.6" strokeLinecap="round">
        {nodes.slice(0, -1).map(([x, y], i) => (
          <line
            key={i}
            x1={x}
            y1={y}
            x2={nodes[i + 1][0]}
            y2={nodes[i + 1][1]}
            pathLength={1}
            strokeDasharray="1"
            className="edge"
            style={{ strokeDashoffset: i < edges ? 0 : 1, opacity: i < edges ? 0.7 : 0 }}
          />
        ))}
      </g>

      {nodes.map(([x, y], i) => {
        const on = i < lit;
        const isFocus = i === focus;
        const a = ALUMNI[ALUMNI_ORDER[i]];
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={on ? 46 : 18} fill="url(#ns-glow)" className="node" style={{ opacity: on ? (isFocus ? 1 : 0.6) : 0.25 }} />
            {isFocus && <circle cx={x} cy={y} r="22" fill="none" stroke="#F0DCA5" strokeWidth="1.5" className="halo" />}
            <path
              d={starPath(x, y, 16, 0.16)}
              fill={on ? '#F0DCA5' : '#FFFFFF'}
              className="node"
              style={{ opacity: on ? 1 : 0.35, transform: `scale(${isFocus ? 1.7 : on ? 1.1 : 0.55})` }}
            />
            <circle cx={x} cy={y} r="3" fill="#FFFFFF" className="node" style={{ opacity: on ? 1 : 0.5 }} />
            {labels && (
              <text
                x={x}
                y={y + 52}
                textAnchor="middle"
                className="node"
                style={{
                  font: '500 22px "DM Sans", sans-serif',
                  letterSpacing: '0.14em',
                  fill: isFocus ? '#F0DCA5' : '#AEBBCC',
                  opacity: on ? (isFocus ? 1 : 0.65) : 0,
                }}
              >
                {a.initials}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
