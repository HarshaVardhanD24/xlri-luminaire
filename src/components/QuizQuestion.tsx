import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import type { OptionKey, Question } from '../data/questions';
import { ProgressBar } from './ProgressBar';

interface Props {
  question: Question;
  index: number;
  total: number;
  selected: OptionKey | null;
  answered: number;
  onSelect: (k: OptionKey) => void;
  onBack: () => void;
  onNext: () => void;
  dir: 'fwd' | 'back';
}

/**
 * Locked to one viewport on every phone: header, question, four options and
 * navigation share 100dvh, with sizes scaling on viewport height (no scrolling).
 */
export function QuizQuestion({ question, index, total, selected, answered, onSelect, onBack, onNext, dir }: Props) {
  const isLast = index === total - 1;
  const pct = Math.round((answered / total) * 100);
  return (
    <main
      className="one-view mx-auto flex w-full max-w-[860px] flex-col px-4 sm:justify-center sm:px-8"
      style={{ paddingTop: 'max(14px, min(4.5vh, 64px))', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-between text-[11px] tracking-[0.26em] sm:text-[12px]">
        <p className="font-medium uppercase text-gold">
          Question {index + 1} <span className="text-bluegrey">/ {total}</span>
        </p>
        <p className="uppercase text-bluegrey">{pct}% charted</p>
      </div>
      <div style={{ marginTop: 'clamp(10px, 2.2vh, 22px)' }}>
        <ProgressBar current={index + 1} total={total} answered={answered} />
      </div>

      <section
        key={question.id}
        className={`flex min-h-0 flex-1 flex-col sm:flex-none ${dir === 'fwd' ? 'q-fwd' : 'q-back'}`}
        style={{ paddingTop: 'clamp(14px, 4vh, 44px)' }}
      >
        <h2
          className="font-display font-medium leading-[1.22] text-ivory"
          style={{ fontSize: 'clamp(19px, min(3.3vh, 6vw), 38px)', textWrap: 'balance' } as React.CSSProperties}
        >
          {question.prompt}
        </h2>

        <div
          role="radiogroup"
          aria-label={question.prompt}
          className="flex min-h-0 flex-col"
          style={{ marginTop: 'clamp(12px, 3vh, 34px)', gap: 'clamp(8px, 1.6vh, 16px)' }}
        >
          {question.options.map((opt, i) => {
            const active = selected === opt.key;
            return (
              <button
                key={opt.key}
                role="radio"
                aria-checked={active}
                onClick={() => onSelect(opt.key)}
                className="glass-row rise flex w-full items-center gap-3.5 px-3.5 text-left sm:gap-5 sm:px-6"
                style={{ animationDelay: `${0.05 + i * 0.06}s`, minHeight: 'clamp(54px, 9.6vh, 86px)', paddingBlock: 'clamp(8px, 1.3vh, 14px)' }}
              >
                <span
                  className="grid shrink-0 place-items-center rounded-full border text-[12px] font-semibold transition-colors"
                  style={{
                    width: 'clamp(28px, 4.4vh, 36px)',
                    height: 'clamp(28px, 4.4vh, 36px)',
                    borderColor: active ? '#D8B978' : 'rgba(174,187,204,0.25)',
                    background: active ? '#D8B978' : 'transparent',
                    color: active ? '#071426' : '#64758B',
                  }}
                >
                  {opt.key}
                </span>
                <span
                  className="leading-snug"
                  style={{ fontSize: 'clamp(13.5px, min(2.05vh, 4vw), 17px)', color: active ? '#F0DCA5' : '#F6F3EA' }}
                >
                  {opt.text}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <nav className="flex items-center justify-between gap-3" style={{ paddingTop: 'clamp(10px, 2vh, 20px)' }}>
        <button onClick={onBack} className="btn-ghost min-h-[48px] px-5 text-[12px]" aria-label="Previous question">
          <ArrowLeft size={15} /> Back
        </button>
        <button onClick={onNext} disabled={!selected} className="btn-gold min-h-[50px] min-w-[44%] px-6 text-[13px] sm:min-w-0 sm:px-8">
          {isLast ? (
            <>
              Reveal match <Sparkles size={16} />
            </>
          ) : (
            <>
              Next <ArrowRight size={16} />
            </>
          )}
        </button>
      </nav>
      <p className="hide-short mt-3 text-[10.5px] uppercase tracking-[0.24em] text-bluegrey">Tap to change your answer any time</p>
    </main>
  );
}
