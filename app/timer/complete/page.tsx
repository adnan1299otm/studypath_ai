'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trophy, Zap, Clock, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function ExamSection({ dayNumber, roadmapId }: { dayNumber: number; roadmapId: string }) {
  const supabase = createClient();
  const [phase, setPhase] = useState<'loading' | 'questions' | 'submitted' | 'error'>('loading');
  const [questions, setQuestions] = useState<{type:'short'|'long', question:string}[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<{scores: number[], total: number, feedback: string[]} | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch AI-generated questions
    fetch('/api/ai/exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roadmapId, dayNumber }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.questions) {
          setQuestions(data.questions);
          setAnswers(new Array(data.questions.length).fill(''));
          setPhase('questions');
        } else {
          setPhase('error');
        }
      })
      .catch(() => setPhase('error'));
  }, [roadmapId, dayNumber]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/ai/exam', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roadmapId, dayNumber, questions, answers }),
      });
      const data = await res.json();
      if (data.result) {
        setResult(data.result);
        setPhase('submitted');
      } else {
        setPhase('error');
      }
    } catch (err) {
      setPhase('error');
    }
    setSubmitting(false);
  };

  if (phase === 'loading') return (
    <div className="w-full p-5 bg-card-dark border border-border-dark rounded-2xl text-center">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
      <p className="text-xs text-slate-500">AI প্রশ্ন তৈরি করছে...</p>
    </div>
  );

  if (phase === 'error') return (
    <div className="w-full p-4 bg-card-dark border border-border-dark rounded-2xl text-center text-slate-500 text-sm">
      প্রশ্ন তৈরিতে সমস্যা হয়েছে।
    </div>
  );

  if (phase === 'submitted' && result) return (
    <div className="w-full bg-card-dark border border-primary/30 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📊</span>
        <h3 className="font-extrabold text-white">তোমার Result</h3>
        <span className="ml-auto text-lg font-black text-primary">{result.total} marks</span>
      </div>
      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={i} className="bg-bg-dark border border-border-dark rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-1">{q.type === 'short' ? '1 mark' : '2 marks'}</p>
            <p className="text-sm font-bold text-white mb-2">{q.question}</p>
            <p className="text-xs text-slate-400 mb-1">তোমার উত্তর: <span className="text-slate-300">{answers[i] || '(blank)'}</span></p>
            <p className="text-xs text-emerald-400">Score: {result.scores[i]} | {result.feedback[i]}</p>
          </div>
        ))}
      </div>
    </div>
  );

  // phase === 'questions'
  return (
    <div className="w-full bg-card-dark border border-primary/20 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📝</span>
        <h3 className="font-extrabold text-white text-sm">AI Assessment</h3>
        <span className="ml-auto text-xs text-slate-500">{questions.filter(q=>q.type==='short').length} × 1mark + {questions.filter(q=>q.type==='long').length} × 2mark</span>
      </div>
      <div className="space-y-4 mb-5">
        {questions.map((q, i) => (
          <div key={i} className="bg-bg-dark border border-border-dark rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${q.type === 'short' ? 'bg-primary/10 text-primary' : 'bg-violet-500/10 text-violet-400'}`}>
                {q.type === 'short' ? '1 mark' : '2 marks'}
              </span>
              <p className="text-sm font-bold text-white">{q.question}</p>
            </div>
            <textarea
              value={answers[i]}
              onChange={e => {
                const newAnswers = [...answers];
                newAnswers[i] = e.target.value;
                setAnswers(newAnswers);
              }}
              placeholder="তোমার উত্তর লেখো..."
              rows={q.type === 'long' ? 3 : 2}
              className="w-full bg-card-dark border border-border-dark rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/60 resize-none"
            />
          </div>
        ))}
      </div>
      <button onClick={handleSubmit} disabled={submitting}
        className="w-full py-3.5 bg-gradient-to-r from-primary to-violet-500 text-white font-extrabold rounded-2xl hover:opacity-90 disabled:opacity-50 transition-all">
        {submitting ? 'AI বিশ্লেষণ করছে...' : 'Submit করো'}
      </button>
    </div>
  );
}

function CompleteContent() {
  const searchParams = useSearchParams();
  const xp = searchParams?.get('xp') || '0';
  const duration = searchParams?.get('duration') || '0';
  const day = searchParams?.get('day');
  const roadmapId = searchParams?.get('roadmap');
  const isPro = searchParams?.get('pro') === 'true';
  const router = useRouter();

  // Simple confetti effect using emojis
  useEffect(() => {
    const createConfetti = () => {
      const emojis = ['🎉', '✨', '🔥', '⭐', '🏆'];
      const container = document.getElementById('confetti-container');
      if (!container) return;

      for (let i = 0; i < 30; i++) {
        const el = document.createElement('div');
        el.innerText = emojis[Math.floor(Math.random() * emojis.length)];
        el.style.position = 'absolute';
        el.style.left = `${Math.random() * 100}%`;
        el.style.top = `-20px`;
        el.style.fontSize = `${Math.random() * 15 + 15}px`;
        el.style.opacity = '0';
        el.style.transform = `rotate(${Math.random() * 360}deg)`;
        el.style.transition = `all ${Math.random() * 2 + 1}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
        
        container.appendChild(el);

        setTimeout(() => {
          el.style.top = '100%';
          el.style.opacity = '1';
          el.style.transform = `rotate(${Math.random() * 360 + 360}deg)`;
        }, 50);

        setTimeout(() => {
          el.remove();
        }, 3000);
      }
    };

    createConfetti();
  }, []);

  return (
    <div className="flex flex-col min-h-screen p-6 items-center justify-center relative overflow-hidden">
      <div id="confetti-container" className="absolute inset-0 pointer-events-none z-0" />
      
      <div className="relative z-10 w-full max-w-sm text-center mt-10">
        <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(250,204,21,0.4)] animate-bounce">
          <Trophy className="w-12 h-12 text-white" />
        </div>

        <h1 className="text-3xl font-extrabold text-white mb-2">Day Completed!</h1>
        <p className="text-slate-400 text-sm mb-10">Great job! You&apos;re one step closer to your goal.</p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-card-dark border border-border-dark rounded-3xl p-6 flex flex-col items-center justify-center">
            <Zap className="w-8 h-8 text-yellow-400 fill-yellow-400 mb-2" />
            <div className="text-2xl font-black text-white">+{xp}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">XP Earned</div>
          </div>
          
          <div className="bg-card-dark border border-border-dark rounded-3xl p-6 flex flex-col items-center justify-center">
            <Clock className="w-8 h-8 text-primary mb-2" />
            <div className="text-2xl font-black text-white">{duration}m</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Study Time</div>
          </div>
        </div>

        {/* AI Q&A Section */}
        {day && roadmapId && (
          <div className="w-full mt-6 mb-4 text-left">
            {isPro ? (
              <ExamSection dayNumber={Number(day)} roadmapId={roadmapId} />
            ) : (
              <button onClick={() => router.push('/pro')}
                className="w-full p-4 border-2 border-dashed border-border-dark rounded-2xl flex items-center justify-between hover:border-yellow-400/30 transition-all group">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔒</span>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-400">AI Q&A Assessment</p>
                    <p className="text-xs text-slate-600">PRO users পায় — day শেষে AI quiz</p>
                  </div>
                </div>
                <span className="text-[10px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2 py-1 rounded-full font-bold">PRO</span>
              </button>
            )}
          </div>
        )}

        {/* MCQ Test — every 5 days */}
        {day && roadmapId && Number(day) % 5 === 0 && (
          <div className="w-full mt-4 mb-6 text-left">
            {isPro ? (
              <button
                onClick={() => router.push(`/mcq?roadmap=${roadmapId}&day=${day}`)}
                className="w-full p-4 bg-card-dark border border-primary/30 rounded-2xl flex items-center justify-between hover:border-primary/60 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📋</span>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">MCQ Test — Day {day}</p>
                    <p className="text-xs text-slate-500">10 questions · AI generated · Gemini 2.5 Flash</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-primary" />
              </button>
            ) : (
              <button
                onClick={() => router.push('/pro')}
                className="w-full p-4 border-2 border-dashed border-border-dark rounded-2xl flex items-center justify-between hover:border-yellow-400/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔒</span>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-400">MCQ Test — Day {day}</p>
                    <p className="text-xs text-slate-600">10 questions · 10 minutes · PRO only</p>
                  </div>
                </div>
                <span className="text-[10px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2 py-1 rounded-full font-bold">
                  PRO
                </span>
              </button>
            )}
          </div>
        )}

        <button
          onClick={() => router.push('/roadmap')}
          className="w-full py-4 mt-6 mb-10 bg-gradient-to-r from-primary to-violet-500 text-white font-extrabold rounded-2xl shadow-[0_8px_20px_rgba(98,100,244,0.25)] hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          Continue Journey <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default function CompletePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-dark flex items-center justify-center text-slate-400">Loading...</div>}>
      <CompleteContent />
    </Suspense>
  );
}
