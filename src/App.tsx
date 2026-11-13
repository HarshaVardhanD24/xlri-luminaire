import { useCallback, useEffect, useRef, useState } from 'react';
import { QuizShell } from './components/QuizShell';
import { BlurRound, EmojiRound, TimelineRound, TruthRound, WordRound } from './components/rounds';
import { ResultScreen } from './components/ResultScreen';
import { RollForm } from './components/RollForm';
import { StarBackground } from './components/StarBackground';
import { StoryLanding } from './components/StoryLanding';
import { BLUR, EMOJIS, SLOTS, TIMELINES, TRUTHS, WORDS } from './data/quizData';
import { finishAttempt, LIVE, startAttempt, submitAnswer, type Finish, type Session, type StartError } from './utils/api';
import { requestScrollUpdate } from './utils/scroll';

type Screen = 'landing' | 'roll' | 'quiz' | 'finishing' | 'done';
const KEY = 'luminaire-trivia-v1';
interface Saved {
  session: Session;
  startedAt: number;
  slot: number;
  result?: Finish;
}
const load = (): Saved | null => {
  if (!LIVE) return null; // demo state lives in memory only
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Saved | null;
    return s && s.session?.token && s.session.name && Array.isArray(s.session.plan) ? s : null;
  } catch {
    return null;
  }
};
const save = (s: Saved | null) => {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch {
    /* private mode: the quiz still works, a refresh just can't resume */
  }
};

export default function App() {
  const initial = useRef(load()).current;
  const [screen, setScreen] = useState<Screen>(initial ? (initial.result ? 'done' : 'quiz') : 'landing');
  const [session, setSession] = useState<Session | null>(initial?.session ?? null);
  const [startedAt, setStartedAt] = useState(initial?.startedAt ?? 0);
  const [slot, setSlot] = useState(initial?.slot ?? 0);
  const [result, setResult] = useState<Finish | null>(initial?.result ?? null);
  const [finishError, setFinishError] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    requestScrollUpdate();
  }, [screen]);

  const begin = useCallback(async (roll: string, name: string): Promise<StartError | null> => {
    const r = await startAttempt(roll, name);
    if (!r.ok) return r.error;
    const now = Date.now();
    setSession(r.session);
    setStartedAt(now);
    setSlot(0);
    setResult(null);
    save({ session: r.session, startedAt: now, slot: 0 });
    setScreen('quiz');
    return null;
  }, []);

  const finish = useCallback(async (s: Session) => {
    setScreen('finishing');
    setFinishError(false);
    const r = await finishAttempt(s);
    if (!r.ok) {
      setFinishError(true);
      return;
    }
    setResult(r.result);
    save({ session: s, startedAt, slot: SLOTS.length, result: r.result });
    setScreen('done');
  }, [startedAt]);

  const next = useCallback(() => {
    if (!session) return;
    if (slot < SLOTS.length - 1) {
      setSlot(slot + 1);
      save({ session, startedAt, slot: slot + 1 });
    } else {
      void finish(session);
    }
  }, [session, slot, startedAt, finish]);

  const submit = useCallback(
    async (value: string) => {
      if (!session) return { ok: false };
      return submitAnswer(session, slot, value);
    },
    [session, slot],
  );

  const notYou = () => {
    save(null);
    setSession(null);
    setResult(null);
    setScreen('roll');
  };

  const variantId = session?.plan[slot];
  const last = slot === SLOTS.length - 1;
  const round = () => {
    if (!variantId) return null;
    const props = { submit, onNext: next, last };
    switch (SLOTS[slot].kind) {
      case 'blur':
        return <BlurRound key={variantId} variant={BLUR.find((v) => v.id === variantId)!} {...props} />;
      case 'wordsearch':
        return <WordRound key={variantId} variant={WORDS.find((v) => v.id === variantId)!} {...props} />;
      case 'truths':
        return <TruthRound key={variantId} variant={TRUTHS.find((v) => v.id === variantId)!} {...props} />;
      case 'timeline':
        return <TimelineRound key={variantId} variant={TIMELINES.find((v) => v.id === variantId)!} {...props} />;
      case 'emoji':
        return <EmojiRound key={variantId} variant={EMOJIS.find((v) => v.id === variantId)!} {...props} />;
    }
  };

  return (
    <>
      <StarBackground intensity={screen === 'done' ? 1.6 : 1} />
      {!LIVE && screen === 'roll' && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center pb-1">
          <span className="rounded-full bg-black/50 px-3 py-0.5 text-[10px] uppercase tracking-[0.2em] text-silver">Prototype · demo mode · nothing is saved</span>
        </div>
      )}
      <div key={screen === 'quiz' ? 'quiz' : screen} className={screen === 'quiz' ? '' : 'screen-in'}>
        {screen === 'landing' && <StoryLanding onStart={() => setScreen('roll')} />}
        {screen === 'roll' && <RollForm onStart={begin} onBack={() => setScreen('landing')} />}
        {screen === 'quiz' && session && (
          <QuizShell slot={slot} startedAt={startedAt}>
            {round()}
          </QuizShell>
        )}
        {screen === 'finishing' && (
          <main className="one-view grid place-items-center px-6 text-center">
            {finishError ? (
              <div>
                <p className="font-display text-2xl text-ivory">Almost there</p>
                <p className="mt-2 text-[14px] text-silver">We couldn't reach the server to record your final time.</p>
                <button className="btn-gold mt-5" onClick={() => session && void finish(session)}>
                  Try again
                </button>
              </div>
            ) : (
              <div>
                <span className="spinner mx-auto" style={{ borderColor: 'rgba(216,185,120,0.3)', borderTopColor: '#D8B978', width: 28, height: 28 }} />
                <p className="mt-4 font-display text-xl italic text-warmgold">Recording your time…</p>
              </div>
            )}
          </main>
        )}
        {screen === 'done' && session && result && <ResultScreen roll={session.roll} name={session.name} result={result} total={SLOTS.length} onNotYou={notYou} />}
      </div>
    </>
  );
}
