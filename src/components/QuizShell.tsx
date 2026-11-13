import { useEffect, useState, type ReactNode } from 'react';
import { SLOTS } from '../data/quizData';
import { ProgressBar } from './ProgressBar';

export function formatClock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function Timer({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  return <span className="tabular-nums">{formatClock(now - startedAt)}</span>;
}

/** Every round is locked to one viewport (100dvh) so no phone ever scrolls. */
export function QuizShell({ slot, startedAt, children }: { slot: number; startedAt: number; children: ReactNode }) {
  const total = SLOTS.length;
  return (
    <main
      className="one-view mx-auto flex w-full max-w-[640px] flex-col px-4 sm:px-8"
      style={{ paddingTop: 'max(12px, min(3.6vh, 48px))', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-between text-[11px] tracking-[0.24em] sm:text-[12px]">
        <p className="font-medium uppercase text-gold">
          Round {slot + 1} <span className="text-bluegrey">/ {total}</span>
        </p>
        <p className="flex items-center gap-1.5 text-silver" aria-label="Elapsed time">
          <span className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_8px_#D8B978]" />
          <Timer startedAt={startedAt} />
        </p>
      </div>
      <div style={{ marginTop: 'clamp(8px, 1.8vh, 18px)' }}>
        <ProgressBar current={slot + 1} total={total} answered={slot} />
      </div>
      <section key={slot} className="q-fwd flex min-h-0 flex-1 flex-col" style={{ paddingTop: 'clamp(10px, 2.4vh, 28px)' }}>
        <p className="font-display italic text-warmgold" style={{ fontSize: 'clamp(13px, 2vh, 17px)' }}>
          {SLOTS[slot].title}
        </p>
        {children}
      </section>
    </main>
  );
}
