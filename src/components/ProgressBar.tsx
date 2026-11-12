/** Six stars on a line: answered stars glow gold, the line fills as you go. */
export function ProgressBar({ current, total, answered }: { current: number; total: number; answered: number }) {
  const pct = (answered / total) * 100;
  return (
    <div className="relative mx-[5px] h-3" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={answered}>
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-celestial/50" />
      <div
        className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-gold transition-[width] duration-700 ease-out"
        style={{ width: `${((Math.max(1, current) - 1) / (total - 1)) * 100}%`, boxShadow: '0 0 8px rgba(216,185,120,0.8)' }}
      />
      {Array.from({ length: total }).map((_, i) => {
        const on = i < current;
        return (
          <span
            key={i}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-500"
            style={{
              left: `${(i / (total - 1)) * 100}%`,
              width: i === current - 1 ? 12 : 7,
              height: i === current - 1 ? 12 : 7,
              background: on ? '#D8B978' : '#285783',
              boxShadow: i === current - 1 ? '0 0 0 4px rgba(216,185,120,0.18), 0 0 14px rgba(216,185,120,0.8)' : 'none',
            }}
          />
        );
      })}
      <span className="sr-only">{Math.round(pct)}% charted</span>
    </div>
  );
}
