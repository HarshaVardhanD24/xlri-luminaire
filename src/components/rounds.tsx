import { ArrowRight, Check, Sparkles, X } from 'lucide-react';
import { useMemo, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import type { BlurVariant, EmojiVariant, TimelineVariant, TruthVariant, WordVariant } from '../data/quizData';
import { qImage } from './Brand';

export type Submit = (value: string) => Promise<{ ok: boolean; correct?: boolean }>;
interface RoundProps<V> {
  variant: V;
  submit: Submit;
  onNext: () => void;
  last: boolean;
}

/** Shared lock-in behaviour: send once, show feedback (or flash "locked"), then continue. */
function useLock(submit: Submit, onNext: () => void, feedback: boolean) {
  const [phase, setPhase] = useState<'idle' | 'sending' | 'done'>('idle');
  const [correct, setCorrect] = useState<boolean | undefined>();
  const [error, setError] = useState('');
  const lock = async (value: string) => {
    if (phase !== 'idle') return;
    setPhase('sending');
    setError('');
    const r = await submit(value);
    if (!r.ok) {
      setPhase('idle');
      setError("Couldn't reach the server. Check your connection and tap Lock answer again.");
      return;
    }
    setCorrect(r.correct);
    setPhase('done');
    if (!feedback) window.setTimeout(onNext, 650);
  };
  return { phase, correct, error, lock };
}

function LockButton({ phase, disabled, onClick, last, feedbackDone, onContinue }: {
  phase: 'idle' | 'sending' | 'done'; disabled?: boolean; onClick: () => void; last: boolean; feedbackDone?: boolean; onContinue?: () => void;
}) {
  if (feedbackDone) {
    return (
      <button onClick={onContinue} className="btn-gold w-full">
        {last ? 'Finish' : 'Continue'} <ArrowRight size={17} />
      </button>
    );
  }
  return (
    <button onClick={onClick} disabled={disabled || phase !== 'idle'} className="btn-gold w-full">
      {phase === 'sending' ? (
        <>
          <span className="spinner" /> Locking…
        </>
      ) : phase === 'done' ? (
        <>
          <Check size={17} /> Locked
        </>
      ) : (
        <>
          Lock answer <Sparkles size={16} />
        </>
      )}
    </button>
  );
}

const Err = ({ msg }: { msg: string }) => (msg ? <p className="mt-2 text-center text-[12.5px] text-[#f0a5a5]" role="alert">{msg}</p> : null);
const Footer = ({ children }: { children: ReactNode }) => <div style={{ paddingTop: 'clamp(8px, 1.6vh, 16px)' }}>{children}</div>;

function OptionRow({ label, text, active, disabled, onClick, mark }: { label: string; text: string; active: boolean; disabled: boolean; onClick: () => void; mark?: 'ok' | 'bad' }) {
  return (
    <button
      role="radio"
      aria-checked={active}
      disabled={disabled}
      onClick={onClick}
      className="glass-row flex w-full items-center gap-3 px-3.5 text-left"
      style={{ minHeight: 'clamp(46px, 8.2vh, 74px)', paddingBlock: 'clamp(6px, 1vh, 12px)' }}
    >
      <span
        className="grid shrink-0 place-items-center rounded-full border text-[12px] font-semibold"
        style={{
          width: 'clamp(26px, 4vh, 34px)', height: 'clamp(26px, 4vh, 34px)',
          borderColor: active ? '#D8B978' : 'rgba(174,187,204,0.25)', background: active ? '#D8B978' : 'transparent', color: active ? '#071426' : '#64758B',
        }}
      >
        {mark === 'ok' ? <Check size={15} /> : mark === 'bad' ? <X size={15} /> : label}
      </span>
      <span className="leading-snug" style={{ fontSize: 'clamp(13.5px, min(2.1vh, 4vw), 17px)', color: active ? '#F0DCA5' : '#F6F3EA' }}>
        {text}
      </span>
    </button>
  );
}

/* ---------------- 1. Guess the Pokémon ---------------- */
export function BlurRound({ variant: v, submit, onNext, last }: RoundProps<BlurVariant>) {
  const [sel, setSel] = useState<string | null>(null);
  const { phase, correct, error, lock } = useLock(submit, onNext, true);
  const done = phase === 'done';
  const size = 'min(54vw, 29vh, 300px)';
  return (
    <>
      <p className="mt-1 text-silver" style={{ fontSize: 'clamp(13px, 2vh, 16px)' }}>
        <em>({v.instruction})</em>
      </p>
      <div className="relative mx-auto mt-[clamp(8px,1.6vh,16px)] shrink-0" style={{ width: size, height: size }}>
        <div className={`absolute -inset-5 rounded-full blur-2xl transition-opacity duration-700 ${correct ? 'opacity-100' : 'opacity-40'}`} style={{ background: 'radial-gradient(closest-side, rgba(216,185,120,0.4), transparent)' }} />
        <div className={`relative h-full w-full overflow-hidden rounded-[28px] border ${done && correct === false ? 'shake' : ''}`} style={{ borderColor: correct ? '#D8B978' : 'rgba(174,187,204,0.2)', boxShadow: '0 20px 50px -24px rgba(0,0,0,0.8)' }}>
          <img src={qImage(v.image)} alt="Blurred portrait of a hidden XLRI alumnus or alumna" className="h-full w-full object-cover" draggable={false} />
          {correct && <img src={qImage(v.reveal)} alt={sel ?? 'Revealed alumnus'} className="fadein absolute inset-0 h-full w-full object-cover" draggable={false} />}
        </div>
      </div>

      {done && correct ? (
        <div className="pop mt-[clamp(8px,1.6vh,16px)] text-center">
          <p className="text-[11px] uppercase tracking-[0.28em] text-gold">Correct</p>
          <p className="font-display text-ivory" style={{ fontSize: 'clamp(24px, 4.4vh, 36px)' }}>{sel}</p>
        </div>
      ) : done ? (
        <p className="pop mt-[clamp(8px,1.6vh,16px)] text-center text-[13.5px] text-silver">Not this one. One try only, so we keep this one a mystery.</p>
      ) : (
        <p className="mt-[clamp(8px,1.4vh,14px)] text-center leading-snug text-bluegrey" style={{ fontSize: 'clamp(11.5px, 1.75vh, 14px)', color: '#8C9BB0' }}>
          <span className="text-gold">Hint:</span> {v.hint}
        </p>
      )}

      {!(done && correct) && (
        <div role="radiogroup" aria-label="Choose the name" className="mt-[clamp(8px,1.6vh,16px)] grid grid-cols-2 gap-[clamp(6px,1.2vh,12px)]">
          {v.options.map((o) => (
            <button
              key={o}
              role="radio"
              aria-checked={sel === o}
              disabled={phase !== 'idle'}
              onClick={() => setSel(o)}
              className="glass-row px-2.5 text-center leading-tight"
              style={{ minHeight: 'clamp(46px, 7.4vh, 62px)', fontSize: 'clamp(12.5px, min(1.9vh, 3.7vw), 15.5px)', color: sel === o ? '#F0DCA5' : '#F6F3EA' }}
            >
              {o}
            </button>
          ))}
        </div>
      )}
      <div className="flex-1" />
      <Footer>
        <LockButton phase={phase} disabled={!sel} onClick={() => sel && lock(sel)} last={last} feedbackDone={done} onContinue={onNext} />
        <Err msg={error} />
      </Footer>
    </>
  );
}

/* ---------------- 2. The Crossword Challenge (word search) ---------------- */
type P = { r: number; c: number };
const snap = (a: P, b: P, n: number): P => {
  const dr = b.r - a.r;
  const dc = b.c - a.c;
  if (!dr && !dc) return a;
  const k = Math.round(Math.atan2(dr, dc) / (Math.PI / 4));
  const sr = Math.round(Math.sin((k * Math.PI) / 4));
  const sc = Math.round(Math.cos((k * Math.PI) / 4));
  const steps = Math.round((dr * sr + dc * sc) / (sr * sr + sc * sc));
  let s = Math.max(0, steps);
  while (s > 0 && (a.r + sr * s < 0 || a.r + sr * s >= n || a.c + sc * s < 0 || a.c + sc * s >= n)) s--;
  return { r: a.r + sr * s, c: a.c + sc * s };
};
export const lineCells = (a: P, b: P): P[] => {
  const dr = Math.sign(b.r - a.r);
  const dc = Math.sign(b.c - a.c);
  const len = Math.max(Math.abs(b.r - a.r), Math.abs(b.c - a.c));
  return Array.from({ length: len + 1 }, (_, i) => ({ r: a.r + dr * i, c: a.c + dc * i }));
};

export function WordRound({ variant: v, submit, onNext, last }: RoundProps<WordVariant>) {
  const n = v.grid.length;
  const [start, setStart] = useState<P | null>(null);
  const [end, setEnd] = useState<P | null>(null);
  const [anchor, setAnchor] = useState<P | null>(null); // tap-tap mode
  const dragging = useRef(false);
  const moved = useRef(false);
  const completing = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const { phase, correct, error, lock } = useLock(submit, onNext, true);
  const done = phase === 'done';

  const cells = useMemo(() => (start && end ? lineCells(start, end) : []), [start, end]);
  const word = cells.map((p) => v.grid[p.r][p.c]).join('');
  const on = (r: number, c: number) => cells.some((p) => p.r === r && p.c === c);

  const cellAt = (e: RPointerEvent): P | null => {
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const t = el?.closest('[data-r]') as HTMLElement | null;
    if (!t || !gridRef.current?.contains(t)) return null;
    return { r: Number(t.dataset.r), c: Number(t.dataset.c) };
  };
  const down = (e: RPointerEvent) => {
    if (phase !== 'idle') return;
    const p = cellAt(e);
    if (!p) return;
    gridRef.current?.setPointerCapture(e.pointerId);
    moved.current = false;
    if (anchor) {
      completing.current = true;
      setStart(anchor);
      setEnd(snap(anchor, p, n));
      setAnchor(null);
      return;
    }
    completing.current = false;
    dragging.current = true;
    setStart(p);
    setEnd(p);
  };
  const move = (e: RPointerEvent) => {
    if (!dragging.current || !start) return;
    const p = cellAt(e);
    if (!p) return;
    const s = snap(start, p, n);
    if (s.r !== start.r || s.c !== start.c) moved.current = true;
    setEnd(s);
  };
  const up = () => {
    if (completing.current) {
      completing.current = false;
      return;
    }
    if (!dragging.current) return;
    dragging.current = false;
    if (!moved.current && start) setAnchor(start); // a tap: wait for the second tap
  };

  return (
    <>
      <p className="mt-1 leading-snug text-silver" style={{ fontSize: 'clamp(12.5px, 1.95vh, 15.5px)' }}>{v.clue}</p>
      <p className="mt-1 text-bluegrey" style={{ fontSize: 'clamp(11px, 1.6vh, 13px)', color: '#8C9BB0' }}>
        Drag across the letters, or tap the first and last letter. Horizontal, vertical or diagonal.
      </p>

      <div
        ref={gridRef}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className={`glass mx-auto mt-[clamp(8px,1.6vh,16px)] shrink-0 select-none p-[clamp(6px,1.2vh,10px)] ${done && correct === false ? 'shake' : ''}`}
        style={{ width: 'min(92vw, 44vh, 400px)', touchAction: 'none', borderRadius: 20, display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 'clamp(2px,0.5vh,4px)' }}
        role="grid"
        aria-label="Word search grid"
      >
        {v.grid.flatMap((row, r) =>
          [...row].map((ch, c) => (
            <div
              key={`${r}-${c}`}
              role="gridcell"
              data-r={r}
              data-c={c}
              className="ws-cell aspect-square"
              data-on={on(r, c) && !done}
              data-ok={done && correct === true && on(r, c)}
              data-bad={done && correct === false && on(r, c)}
              style={{ fontSize: `clamp(11px, ${n > 7 ? 2.3 : 2.9}vh, ${n > 7 ? 18 : 22}px)` }}
            >
              {ch}
            </div>
          )),
        )}
      </div>

      <div className="mt-[clamp(6px,1.4vh,14px)] flex min-h-[28px] items-center justify-center text-center">
        {done ? (
          correct ? (
            <p className="pop flex items-center gap-2 font-display text-warmgold" style={{ fontSize: 'clamp(18px, 3vh, 24px)' }}>
              <Check size={20} /> Found it!
            </p>
          ) : (
            <p className="pop text-[13.5px] text-silver">Not quite. Locked in.</p>
          )
        ) : word.length > 1 ? (
          <p className="font-display tracking-[0.3em] text-gold" style={{ fontSize: 'clamp(18px, 3vh, 24px)' }}>{word}</p>
        ) : (
          <p className="text-[12.5px] text-bluegrey">{anchor ? 'Now tap the last letter' : 'No word selected yet'}</p>
        )}
      </div>
      <div className="flex-1" />
      <Footer>
        <LockButton phase={phase} disabled={word.length < 2} onClick={() => lock(word)} last={last} feedbackDone={done} onContinue={onNext} />
        <Err msg={error} />
      </Footer>
    </>
  );
}

/* ---------------- 3. Two Truths and One Lie ---------------- */
export function TruthRound({ variant: v, submit, onNext, last }: RoundProps<TruthVariant>) {
  const [sel, setSel] = useState<string | null>(null);
  const { phase, error, lock } = useLock(submit, onNext, false);
  return (
    <>
      <h2 className="font-display font-medium leading-[1.2] text-ivory" style={{ fontSize: 'clamp(20px, min(3.4vh, 6vw), 32px)', marginTop: 'clamp(6px,1.4vh,14px)' }}>
        Identify the wrong statement.
      </h2>
      <div role="radiogroup" aria-label="Statements" className="flex flex-col" style={{ marginTop: 'clamp(12px, 3vh, 30px)', gap: 'clamp(8px, 1.6vh, 16px)' }}>
        {v.statements.map((s) => (
          <OptionRow key={s.key} label={s.key} text={s.text} active={sel === s.key} disabled={phase !== 'idle'} onClick={() => setSel(s.key)} />
        ))}
      </div>
      <div className="flex-1" />
      <Footer>
        <LockButton phase={phase} disabled={!sel} onClick={() => sel && lock(sel)} last={last} />
        <Err msg={error} />
      </Footer>
    </>
  );
}

/* ---------------- 4. Select the Timeline ---------------- */
export function TimelineRound({ variant: v, submit, onNext, last }: RoundProps<TimelineVariant>) {
  const [year, setYear] = useState(v.start);
  const { phase, error, lock } = useLock(submit, onNext, false);
  const fill = ((year - v.min) / (v.max - v.min)) * 100;
  return (
    <>
      <h2 className="font-display font-medium leading-[1.22] text-ivory" style={{ fontSize: 'clamp(19px, min(3.3vh, 6vw), 30px)', marginTop: 'clamp(6px,1.4vh,14px)' }}>
        {v.question}
      </h2>
      <p className="mt-2 text-bluegrey" style={{ fontSize: 'clamp(12px, 1.8vh, 14px)', color: '#8C9BB0' }}>Move the timeline to your answer.</p>

      <div className="glass mt-[clamp(14px,3.4vh,34px)] px-5 pb-5 pt-[clamp(14px,3vh,30px)] text-center">
        <p key={year} className="font-display font-medium tabular-nums text-warmgold" style={{ fontSize: 'clamp(54px, 11vh, 96px)', lineHeight: 1 }}>
          {year}
        </p>
        <div className="mt-[clamp(10px,2.4vh,24px)]" style={{ '--fill': `${fill}%` } as CSSProperties}>
          <input
            type="range"
            className="tl"
            min={v.min}
            max={v.max}
            step={1}
            value={year}
            disabled={phase !== 'idle'}
            onChange={(e) => setYear(Number(e.target.value))}
            aria-label="Year"
          />
          <div className="relative mt-1 h-5 text-[12px] text-silver">
            {v.markers.map((m) => (
              <span key={m} className="absolute -translate-x-1/2" style={{ left: `${((m - v.min) / (v.max - v.min)) * 100}%`, transform: m === v.min ? 'none' : m === v.max ? 'translateX(-100%)' : 'translateX(-50%)' }}>
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1" />
      <Footer>
        <LockButton phase={phase} onClick={() => lock(String(year))} last={last} />
        <Err msg={error} />
      </Footer>
    </>
  );
}

/* ---------------- 5. Guess the Emoji ---------------- */
export function EmojiRound({ variant: v, submit, onNext, last }: RoundProps<EmojiVariant>) {
  const [sel, setSel] = useState<string | null>(null);
  const { phase, error, lock } = useLock(submit, onNext, false);
  return (
    <>
      <h2 className="font-display font-medium leading-[1.2] text-ivory" style={{ fontSize: 'clamp(20px, min(3.4vh, 6vw), 32px)', marginTop: 'clamp(6px,1.4vh,14px)' }}>
        Decode the emojis.
      </h2>
      <div className="glass mt-[clamp(10px,2.4vh,24px)] py-[clamp(12px,3vh,30px)] text-center" style={{ fontSize: 'clamp(34px, 7.4vh, 64px)', lineHeight: 1.15 }} aria-label="Emoji clue">
        {v.emoji}
      </div>
      <div role="radiogroup" aria-label="Choose the answer" className="flex flex-col" style={{ marginTop: 'clamp(10px, 2.4vh, 24px)', gap: 'clamp(6px, 1.2vh, 12px)' }}>
        {v.options.map((o, i) => (
          <OptionRow key={o} label={'ABCD'[i]} text={o} active={sel === o} disabled={phase !== 'idle'} onClick={() => setSel(o)} />
        ))}
      </div>
      <div className="flex-1" />
      <Footer>
        <LockButton phase={phase} disabled={!sel} onClick={() => sel && lock(sel)} last={last} />
        <Err msg={error} />
      </Footer>
    </>
  );
}
