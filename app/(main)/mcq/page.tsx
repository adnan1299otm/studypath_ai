'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks/use-profile';
import { ArrowRight, RefreshCw, Timer, Lightbulb } from 'lucide-react';

interface MCQQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

function MCQContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roadmapId = searchParams?.get('roadmap') || '';
  const dayNumber = Number(searchParams?.get('day') || '5');
  const supabase = createClient();
  const { profile } = useProfile();

  const [phase, setPhase] = useState<'loading' | 'quiz' | 'result' | 'error' | 'locked'>('loading');
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(10 * 60);
  const [timerActive, setTimerActive] = useState(false);

  const fetchQuestions = async () => {
    setPhase('loading');
    try {
      const res = await fetch('/api/ai/mcq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roadmapId, dayNumber }),
      });
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setUserAnswers(new Array(data.questions.length).fill(-1));
        setPhase('quiz');
        setTimerActive(true);
      } else {
        setPhase('error');
      }
    } catch {
      setPhase('error');
    }
  };

  const finishQuiz = async (finalScore: number, finalAnswers: number[]) => {
    setPhase('result');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('mcq_results').insert({
          user_id: user.id,
          roadmap_id: roadmapId,
          day_range: `${Math.max(1, dayNumber - 4)}-${dayNumber}`,
          questions: questions,
          user_answers: finalAnswers,
          score: finalScore,
        });
      }
    } catch {
      // Silently fail — result is still shown
    }
  };

  useEffect(() => {
    if (!profile) return;
    if (profile.plan !== 'pro') { setPhase('locked'); return; }
    if (!roadmapId) { setPhase('error'); return; }
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, roadmapId]);

  useEffect(() => {
    if (!timerActive || phase !== 'quiz') return;
    if (timeLeft <= 0) { setTimerActive(false); finishQuiz(score, userAnswers); return; }
    const t = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive, timeLeft, phase]);

  const handleSelectAnswer = (optionIndex: number) => {
    if (answered) return;
    setSelectedAnswer(optionIndex);
    setAnswered(true);
    const isCorrect = optionIndex === questions[currentQ].correct;
    const newScore = isCorrect ? score + 1 : score;
    const newAnswers = [...userAnswers];
    newAnswers[currentQ] = optionIndex;
    setScore(newScore);
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    } else {
      setTimerActive(false);
      finishQuiz(score, userAnswers);
    }
  };

  const handleRetry = () => {
    setCurrentQ(0);
    setScore(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setUserAnswers(new Array(questions.length).fill(-1));
    setTimeLeft(10 * 60);
    setPhase('quiz');
    setTimerActive(true);
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerLabel = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // LOCKED
  if (phase === 'locked') return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-yellow-400/10 border border-yellow-400/20 rounded-full flex items-center justify-center mb-6 text-4xl">🔒</div>
      <h2 className="text-2xl font-extrabold text-white mb-3">PRO Feature</h2>
      <p className="text-slate-400 text-sm mb-8 max-w-[260px]">MCQ Test is only for PRO users. Upgrade to unlock all features.</p>
      <button onClick={() => router.push('/pro')}
        className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-extrabold rounded-2xl hover:opacity-90 transition-all mb-4">
        ⭐ Upgrade to PRO
      </button>
      <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Go back</button>
    </div>
  );

  // LOADING
  if (phase === 'loading') return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6" />
      <p className="text-white font-bold mb-1">Generating questions with AI...</p>
      <p className="text-slate-500 text-sm">Gemini 2.5 Flash · 10 MCQs · Day {Math.max(1, dayNumber - 4)}–{dayNumber}</p>
    </div>
  );

  // ERROR
  if (phase === 'error') return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="text-5xl mb-4">😕</div>
      <h2 className="text-xl font-extrabold text-white mb-3">Something went wrong</h2>
      <p className="text-slate-400 text-sm mb-8">Could not generate questions. Please try again.</p>
      <button onClick={fetchQuestions}
        className="px-8 py-4 bg-primary text-white font-extrabold rounded-2xl hover:opacity-90 transition-all">
        Try Again
      </button>
    </div>
  );

  // RESULT
  if (phase === 'result') {
    const pct = score / questions.length;
    const circumference = 283;
    const offset = circumference - circumference * pct;
    const ringColor = pct >= 0.7 ? '#10b981' : pct >= 0.5 ? '#f59e0b' : '#ef4444';
    const emoji = pct >= 0.9 ? '🏆' : pct >= 0.7 ? '🎯' : pct >= 0.5 ? '💪' : '😔';
    const msg = pct >= 0.9 ? 'Outstanding! You are a master!' : pct >= 0.7 ? 'Great job!' : pct >= 0.5 ? 'Good effort, keep practicing.' : 'Keep trying, you can do it!';
    const xpEarned = score * 30;

    return (
      <div className="max-w-2xl mx-auto px-4 py-10 pb-32">
        <style>{`
          @keyframes ringFill { to { stroke-dashoffset: ${offset}; } }
          .ring-animate { animation: ringFill 1.5s ease forwards; stroke-dashoffset: ${circumference}; }
        `}</style>

        <div className="text-center mb-10">
          <div className="text-6xl mb-4">{emoji}</div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Test Complete!</h1>
          <p className="text-slate-400">{msg}</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#252538" strokeWidth="8" />
              <circle cx="50" cy="50" r="45" fill="none" stroke={ringColor} strokeWidth="8"
                strokeLinecap="round" className="ring-animate"
                style={{ strokeDasharray: circumference }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white">{score}</span>
              <span className="text-xs text-slate-500 font-bold">/ {questions.length}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card-dark border border-border-dark rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-emerald-400">{score}</div>
            <div className="text-xs text-slate-500 font-bold mt-1">Correct</div>
          </div>
          <div className="bg-card-dark border border-border-dark rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-red-400">{questions.length - score}</div>
            <div className="text-xs text-slate-500 font-bold mt-1">Wrong</div>
          </div>
          <div className="bg-card-dark border border-border-dark rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-primary">+{xpEarned}</div>
            <div className="text-xs text-slate-500 font-bold mt-1">XP Earned</div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={handleRetry}
            className="w-full py-4 bg-card-dark border-2 border-border-dark hover:border-primary/40 text-slate-300 font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5" /> Try Again
          </button>
          <button onClick={() => router.push('/roadmap')}
            className="w-full py-4 bg-gradient-to-r from-primary to-violet-500 text-white font-extrabold rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2">
            Back to Roadmap <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // QUIZ
  const q = questions[currentQ];
  const labels = ['A', 'B', 'C', 'D'];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-32">
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp .3s ease forwards; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">📋</span>
            <h1 className="text-xl font-extrabold text-white">MCQ Test</h1>
            <span className="text-xs bg-primary/20 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">
              Day {Math.max(1, dayNumber - 4)}–{dayNumber}
            </span>
          </div>
          <p className="text-slate-500 text-sm">Gemini AI · {questions.length} questions</p>
        </div>
        <div className={`flex items-center gap-1.5 bg-card-dark border px-3 py-2 rounded-xl ${timeLeft < 60 ? 'border-red-500/50' : 'border-border-dark'}`}>
          <Timer className={`w-4 h-4 ${timeLeft < 60 ? 'text-red-400' : 'text-primary'}`} />
          <span className={`font-black text-lg font-mono ${timeLeft < 60 ? 'text-red-400' : 'text-white'}`}>
            {timerLabel}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500 font-medium">
            Question <span className="text-white font-bold">{currentQ + 1}</span> / {questions.length}
          </span>
          <span className="text-xs font-bold text-primary">Score: {score}/{questions.length}</span>
        </div>
        <div className="h-2.5 bg-card-dark rounded-full overflow-hidden border border-border-dark">
          <div className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full transition-all duration-500"
            style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
        </div>
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {questions.map((_, i) => {
            const isDone = i < currentQ;
            const isCurrent = i === currentQ;
            const wasCorrect = isDone && userAnswers[i] === questions[i].correct;
            const wasWrong = isDone && userAnswers[i] !== questions[i].correct && userAnswers[i] !== -1;
            return (
              <div key={i} className={`w-6 h-6 rounded-full border-2 transition-all ${
                isCurrent ? 'bg-primary border-primary' :
                wasCorrect ? 'bg-emerald-500 border-emerald-500' :
                wasWrong ? 'bg-red-500 border-red-500' :
                'bg-card-dark border-border-dark'
              }`} />
            );
          })}
        </div>
      </div>

      {/* Question card */}
      <div key={currentQ} className="bg-card-dark border border-border-dark rounded-2xl p-6 mb-4 fade-up">
        <div className="flex items-start gap-3 mb-6">
          <span className="w-7 h-7 rounded-lg bg-primary/20 text-primary text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
            Q{currentQ + 1}
          </span>
          <p className="text-base font-bold text-white leading-relaxed">{q.question}</p>
        </div>
        <div className="flex flex-col gap-3">
          {q.options.map((opt, i) => {
            let btnClass = 'w-full flex items-center gap-3 p-4 rounded-xl text-left border-2 transition-all ';
            if (!answered) {
              btnClass += 'bg-[#16162a] border-border-dark text-slate-300 hover:bg-primary/10 hover:border-primary/40 hover:text-white cursor-pointer';
            } else {
              if (i === q.correct) btnClass += 'bg-emerald-500/15 border-emerald-500 text-emerald-300';
              else if (i === selectedAnswer && i !== q.correct) btnClass += 'bg-red-500/10 border-red-500/50 text-red-300';
              else btnClass += 'bg-[#16162a] border-border-dark text-slate-600 opacity-50';
            }
            return (
              <button key={i} onClick={() => handleSelectAnswer(i)} disabled={answered} className={btnClass}>
                <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-black flex items-center justify-center flex-shrink-0">
                  {labels[i]}
                </span>
                <span className="text-sm font-medium">{opt}</span>
                {answered && i === q.correct && <span className="ml-auto text-emerald-400 text-lg">✓</span>}
                {answered && i === selectedAnswer && i !== q.correct && <span className="ml-auto text-red-400 text-lg">✗</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Explanation */}
      {answered && (
        <div className="bg-[#16162a] border border-primary/20 rounded-2xl p-5 mb-4 fade-up">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary">Explanation</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{q.explanation}</p>
        </div>
      )}

      {/* Next button */}
      {answered && (
        <button onClick={handleNext}
          className="w-full py-4 bg-gradient-to-r from-primary to-violet-500 text-white font-extrabold rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2 fade-up">
          {currentQ < questions.length - 1
            ? <><span>Next Question</span><ArrowRight className="w-5 h-5" /></>
            : <span>✓ See Result</span>
          }
        </button>
      )}
    </div>
  );
}

export default function MCQPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MCQContent />
    </Suspense>
  );
}
