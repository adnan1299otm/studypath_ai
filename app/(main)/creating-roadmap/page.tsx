'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// এই messages গুলো একটার পর একটা দেখাবে roadmap বানানোর সময়
const MESSAGES = [
  { icon: '🔍', title: 'Syllabus বিশ্লেষণ করছি...', sub: 'তোমার topics গুলো চিনে নিচ্ছি' },
  { icon: '🧠', title: 'Difficulty বুঝছি...', sub: 'কোন topic কঠিন, কোনটা সহজ ঠিক করছি' },
  { icon: '📅', title: 'Deadline calculate করছি...', sub: 'তোমার exam এর দিন থেকে গণনা করছি' },
  { icon: '⚡', title: 'Daily sessions ভাগ করছি...', sub: 'তোমার hours অনুযায়ী optimize করছি' },
  { icon: '🎯', title: 'Important topics চিহ্নিত করছি...', sub: 'High-weight chapters আগে রাখছি' },
  { icon: '🔄', title: 'Revision দিন যোগ করছি...', sub: 'শেষে সব topic review হবে' },
  { icon: '✨', title: 'Final roadmap সাজাচ্ছি...', sub: 'তোমার perfect study plan প্রস্তুত হচ্ছে' },
];

// AI compliment messages — randomly cycle করবে
const COMPLIMENTS = [
  'তুমি সত্যিই dedicated! 💪',
  'তোমার effort দেখে AI ও inspire হচ্ছে ✨',
  'এই plan তোমাকে exam এ help করবে 🎯',
  'Smart student smart plan বানায় 🧠',
  'তোমার consistency আমাকে impress করছে 🔥',
  'Best roadmap তৈরি হচ্ছে শুধু তোমার জন্য 💜',
];

function CreatingRoadmapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [msgIndex, setMsgIndex] = useState(0);
  const [complimentIndex, setComplimentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [dots, setDots] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const hasCalled = useRef(false);

  // Get params from URL
  const syllabusId = searchParams?.get('syllabusId');
  const examDeadline = searchParams?.get('examDeadline');
  const dailyHours = searchParams?.get('dailyHours');
  const studentLevel = searchParams?.get('studentLevel');

  // Animated dots
  useEffect(() => {
    const iv = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 400);
    return () => clearInterval(iv);
  }, []);

  // Cycle through messages every 2.5s
  useEffect(() => {
    if (done || error) return;
    const iv = setInterval(() => {
      setMsgIndex(i => (i + 1) % MESSAGES.length);
    }, 2500);
    return () => clearInterval(iv);
  }, [done, error]);

  // Cycle compliments every 4s
  useEffect(() => {
    if (done || error) return;
    const iv = setInterval(() => {
      setComplimentIndex(i => (i + 1) % COMPLIMENTS.length);
    }, 4000);
    return () => clearInterval(iv);
  }, [done, error]);

  // Fake progress bar — slowly fills to 90%, then jumps to 100% on success
  useEffect(() => {
    if (done || error) return;
    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= 90) return p; // wait for real completion
        return p + Math.random() * 3;
      });
    }, 600);
    return () => clearInterval(iv);
  }, [done, error]);

  // Actual API call
  useEffect(() => {
    if (hasCalled.current) return;
    hasCalled.current = true;

    if (!syllabusId || !examDeadline || !dailyHours || !studentLevel) {
      setError('Required parameters missing. Please go back and try again.');
      return;
    }

    const generate = async () => {
      try {
        const res = await fetch('/api/ai/generate-roadmap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            syllabusId,
            examDeadline,
            dailyHours: parseFloat(dailyHours),
            studentLevel,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Roadmap generation failed');
        }

        // Success — fill progress to 100 then redirect
        setDone(true);
        setProgress(100);
        setMsgIndex(MESSAGES.length - 1); // show last message

        setTimeout(() => {
          router.push('/roadmap');
        }, 1200);

      } catch (err: any) {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    };

    generate();
  }, [syllabusId, examDeadline, dailyHours, studentLevel, router]);

  const currentMsg = MESSAGES[msgIndex];
  const clampedProgress = Math.min(progress, 100);

  // ─── ERROR STATE ───
  if (error) {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-4">😔</div>
        <h2 className="text-xl font-extrabold text-white mb-2">Roadmap বানাতে সমস্যা হয়েছে</h2>
        <p className="text-slate-400 text-sm mb-2 max-w-xs">{error}</p>
        <p className="text-slate-600 text-xs mb-8">Internet connection check করো অথবা আবার চেষ্টা করো।</p>
        <button
          onClick={() => router.back()}
          className="px-8 py-3.5 bg-gradient-to-r from-primary to-violet-500 text-white font-extrabold rounded-2xl shadow-lg shadow-primary/25 hover:opacity-90 active:scale-95 transition-all"
        >
          ← আবার চেষ্টা করো
        </button>
      </div>
    );
  }

  // ─── LOADING STATE ───
  return (
    <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center px-6 relative overflow-hidden">

      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/8 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-violet-500/5 blur-[100px] rounded-full" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'radial-gradient(#6264f4 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center">

        {/* Animated robot/AI icon */}
        <div className="relative mb-8">
          <div
            className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-2xl shadow-primary/40"
            style={{ animation: 'pulse 2s ease-in-out infinite' }}
          >
            <span className="text-4xl">{done ? '✅' : currentMsg.icon}</span>
          </div>
          {/* Orbiting dot */}
          {!done && (
            <div
              className="absolute inset-0"
              style={{ animation: 'spin 3s linear infinite' }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary/60" />
            </div>
          )}
        </div>

        {/* Main message */}
        <div className="mb-2 min-h-[60px] flex flex-col items-center justify-center">
          <h2 className="text-xl font-extrabold text-white leading-tight">
            {done ? 'Roadmap তৈরি হয়ে গেছে!' : currentMsg.title}{dots}
          </h2>
          <p className="text-slate-400 text-sm mt-1.5">
            {done ? 'তোমার study plan এ নিয়ে যাচ্ছি ✨' : currentMsg.sub}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full mt-6 mb-4">
          <div className="flex justify-between text-xs font-bold mb-2">
            <span className="text-slate-500">Progress</span>
            <span className="text-primary">{Math.round(clampedProgress)}%</span>
          </div>
          <div className="w-full h-2.5 bg-card-dark-2 rounded-full overflow-hidden border border-border-dark">
            <div
              className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full transition-all duration-700 ease-out shadow-sm"
              style={{ width: `${clampedProgress}%` }}
            />
          </div>
        </div>

        {/* Completed steps */}
        <div className="w-full bg-card-dark border border-border-dark rounded-2xl p-4 mb-6">
          <div className="flex flex-col gap-2">
            {MESSAGES.slice(0, msgIndex + 1).map((msg, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 text-left"
                style={{
                  opacity: i === msgIndex ? 1 : 0.4,
                  animation: i === msgIndex ? 'fadeInUp 0.4s ease' : 'none',
                }}
              >
                <span className="text-base">{msg.icon}</span>
                <span
                  className={`text-xs font-bold ${
                    i === msgIndex ? 'text-white' : 'text-slate-500 line-through'
                  }`}
                >
                  {msg.title.replace('...', '')}
                </span>
                {i < msgIndex && (
                  <span className="ml-auto text-emerald-400 text-xs">✓</span>
                )}
                {i === msgIndex && !done && (
                  <span className="ml-auto w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* AI compliment card */}
        {!done && (
          <div
            className="w-full bg-primary/8 border border-primary/20 rounded-2xl px-4 py-3 flex items-center gap-3"
            key={complimentIndex}
            style={{ animation: 'fadeInUp 0.5s ease' }}
          >
            <span className="text-2xl">🤖</span>
            <p className="text-primary text-sm font-bold text-left leading-snug">
              {COMPLIMENTS[complimentIndex]}
            </p>
          </div>
        )}

      </div>

      {/* Keyframe animations — inline style */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(98,100,244,0.4); }
          50% { transform: scale(1.04); box-shadow: 0 0 0 16px rgba(98,100,244,0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default function CreatingRoadmapPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-dark flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CreatingRoadmapContent />
    </Suspense>
  );
}
