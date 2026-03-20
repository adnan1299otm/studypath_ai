'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trophy, Zap, Clock, ArrowRight } from 'lucide-react';

function CompleteContent() {
  const searchParams = useSearchParams();
  const xp = searchParams.get('xp') || '0';
  const duration = searchParams.get('duration') || '0';
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
      
      <div className="relative z-10 w-full max-w-sm text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(250,204,21,0.4)] animate-bounce">
          <Trophy className="w-12 h-12 text-white" />
        </div>

        <h1 className="text-3xl font-extrabold text-white mb-2">Day Completed!</h1>
        <p className="text-slate-400 text-sm mb-10">Great job! You&apos;re one step closer to your goal.</p>

        <div className="grid grid-cols-2 gap-4 mb-10">
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

        <button
          onClick={() => router.push('/roadmap')}
          className="w-full py-4 bg-gradient-to-r from-primary to-violet-500 text-white font-extrabold rounded-2xl shadow-[0_8px_20px_rgba(98,100,244,0.25)] hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
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
