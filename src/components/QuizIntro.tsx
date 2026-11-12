import { ArrowLeft } from 'lucide-react';
import { alcomLogo } from './Brand';
import { PrivacyNote } from './PrivacyNote';

const POINTS = [
  '6 situational questions · about 2 minutes',
  'Nine distinguished XLRI journeys to match against',
  'No name, email or roll number asked',
];

export function QuizIntro({ onBegin, onBack }: { onBegin: () => void; onBack: () => void }) {
  return (
    <main className="one-view flex items-center justify-center px-4 sm:px-8">
      <section className="glass card-float rise w-full max-w-[640px] p-6 sm:p-11">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ivory sm:h-14 sm:w-14">
            <img src={alcomLogo} alt="XLRI ALCOM" className="h-11 w-11 sm:h-12 sm:w-12" />
          </div>
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold sm:text-[12px]">The journey ahead</p>
        </div>

        <h1 className="mt-7 font-display text-[30px] font-medium leading-[1.15] text-ivory sm:text-[42px]" style={{ textWrap: 'balance' } as React.CSSProperties}>
          Your journey begins with six questions.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-silver sm:text-[17px]">
          Choose the answer that feels most like you. There are no right or wrong answers.
        </p>

        <ul className="mt-6 space-y-3">
          {POINTS.map((p) => (
            <li key={p} className="flex items-start gap-3 text-[13.5px] text-bluegrey sm:text-[15px]" style={{ color: '#8C9BB0' }}>
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
              {p}
            </li>
          ))}
        </ul>

        <PrivacyNote className="mt-5 hide-short" />

        <div className="mt-7 flex items-center justify-between gap-4">
          <button onClick={onBack} className="inline-flex min-h-11 items-center gap-2 text-[12px] uppercase tracking-[0.22em] text-bluegrey hover:text-ivory">
            <ArrowLeft size={14} /> Back
          </button>
          <div className="relative">
            <div className="glow-cta" />
            <button onClick={onBegin} className="btn-gold px-8 sm:px-10">
              Let's begin
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
