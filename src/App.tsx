import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { AlumniCard } from './components/AlumniCard';
import { QuizIntro } from './components/QuizIntro';
import { QuizQuestion } from './components/QuizQuestion';
import { ResultReveal } from './components/ResultReveal';
import { ShareCard } from './components/ShareCard';
import { StarBackground } from './components/StarBackground';
import { StoryLanding } from './components/StoryLanding';
import { ALUMNI } from './data/alumni';
import { QUESTIONS, type OptionKey } from './data/questions';
import { markQuizStart, quizDuration, track } from './utils/analytics';
import { calculateResult } from './utils/calculateResult';
import { requestScrollUpdate } from './utils/scroll';

type Screen = 'landing' | 'intro' | 'quiz' | 'reveal' | 'result';
const empty = () => QUESTIONS.map(() => null as OptionKey | null);
// '#admin' and '#/admin' both open the dashboard
const isAdmin = () => /^#\/?admin/.test(window.location.hash);

export default function App() {
  const [admin, setAdmin] = useState(isAdmin);
  const [screen, setScreen] = useState<Screen>('landing');
  const [qIndex, setQIndex] = useState(0);
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd');
  const [answers, setAnswers] = useState<(OptionKey | null)[]>(empty);
  const [sharing, setSharing] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const result = useMemo(() => (answers.every(Boolean) ? calculateResult(answers) : null), [answers]);

  useEffect(() => {
    track('page_load', {}, 'page-load');
    const onHash = () => setAdmin(isAdmin());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    requestScrollUpdate();
  }, [screen, qIndex, admin]);

  useEffect(() => {
    if (screen === 'quiz') track('question_view', { question: qIndex + 1 }, `a${attempt}-q${qIndex}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, qIndex]);

  const retake = useCallback(() => {
    track('retake');
    setAttempt((a) => a + 1);
    setSharing(false);
    setAnswers(empty());
    setQIndex(0);
    setDir('fwd');
    setScreen('intro');
  }, []);

  const select = (k: OptionKey) =>
    setAnswers((prev) => {
      const next = [...prev];
      next[qIndex] = k;
      return next;
    });

  const next = () => {
    if (!answers[qIndex]) return;
    setDir('fwd');
    if (qIndex < QUESTIONS.length - 1) setQIndex(qIndex + 1);
    else {
      const r = calculateResult(answers);
      track('quiz_complete', {
        result: r.winner,
        runner_up: r.runnerUp,
        answers: answers.join(''),
        duration_ms: quizDuration(),
      });
      setScreen('reveal');
    }
  };

  const back = () => {
    setDir('back');
    if (qIndex > 0) setQIndex(qIndex - 1);
    else setScreen('intro');
  };

  const begin = () => {
    track('quiz_start');
    markQuizStart();
    setDir('fwd');
    setScreen('quiz');
  };

  const revealDone = useCallback(() => setScreen('result'), []);
  const revealSkip = useCallback(() => {
    track('reveal_skip');
    setScreen('result');
  }, []);
  const closeShare = useCallback(() => setSharing(false), []);
  const exitAdmin = useCallback(() => {
    history.replaceState(null, '', window.location.pathname + window.location.search);
    setAdmin(false);
  }, []);

  if (admin) {
    return (
      <>
        <StarBackground />
        <AdminDashboard onExit={exitAdmin} />
      </>
    );
  }

  return (
    <>
      <StarBackground intensity={screen === 'reveal' ? 1.8 : 1} />
      <div key={screen} className={screen === 'quiz' ? '' : 'screen-in'}>
        {screen === 'landing' && <StoryLanding onStart={() => setScreen('intro')} />}
        {screen === 'intro' && <QuizIntro onBegin={begin} onBack={() => setScreen('landing')} />}
        {screen === 'quiz' && (
          <div className="screen-in">
            <QuizQuestion
              question={QUESTIONS[qIndex]}
              index={qIndex}
              total={QUESTIONS.length}
              selected={answers[qIndex]}
              answered={answers.filter(Boolean).length}
              onSelect={select}
              onBack={back}
              onNext={next}
              dir={dir}
            />
          </div>
        )}
        {screen === 'reveal' && result && <ResultReveal winner={result.winner} onDone={revealDone} onSkip={revealSkip} />}
        {screen === 'result' && result && (
          <AlumniCard
            alumnus={ALUMNI[result.winner]}
            runnerUp={ALUMNI[result.runnerUp]}
            onShare={() => {
              track('share_open');
              setSharing(true);
            }}
            onRetake={retake}
          />
        )}
      </div>
      {sharing && result && <ShareCard alumnus={ALUMNI[result.winner]} onClose={closeShare} onRetake={retake} />}
    </>
  );
}
