'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks/use-profile';
import { Topic } from '@/types';
import { Play, Pause, CheckCircle2, ArrowLeft, X, Send } from 'lucide-react';

const supabase = createClient();

// ── Theme Config ────────────────────────────────────────
type ThemeName = 'default' | 'forest' | 'midnight' | 'sunset' | 'minimal' | 'ramadan';

const THEMES: Record<ThemeName, {
  bg: string;
  ringStroke: string;
  ringGlow: string;
  symbol: string;
  accentBg: string;
  accentText: string;
  motives: string[];
  isPro: boolean;
  label: string;
  emoji: string;
  gradient: string;
}> = {
  default: {
    bg: 'radial-gradient(circle at top, #1a1a2e 0%, #05070a 100%)',
    ringStroke: 'url(#grad-default)',
    ringGlow: 'drop-shadow(0 0 22px rgba(139,92,246,.45))',
    symbol: '🔮',
    accentBg: 'linear-gradient(135deg,#8b5cf6,#6264f4)',
    accentText: '#a78bfa',
    motives: ['তুমি পারবে 💪', 'Focus থাকো 🎯', 'Almost there! ⚡'],
    isPro: false,
    label: 'Default',
    emoji: '🔮',
    gradient: 'linear-gradient(145deg,#2d1b69,#6264f4)',
  },
  forest: {
    bg: 'radial-gradient(ellipse at 50% 0%, #0d3320 0%, #071a0e 50%, #020a05 100%)',
    ringStroke: '#10b981',
    ringGlow: 'drop-shadow(0 0 22px rgba(16,185,129,.4))',
    symbol: '🌿',
    accentBg: 'linear-gradient(135deg,#059669,#10b981)',
    accentText: '#34d399',
    motives: ['প্রকৃতির মতো বড় হও 🌱', 'শান্ত মনে পড়ো 🌳', 'তুমি grow করছ 🍃'],
    isPro: true,
    label: 'Forest',
    emoji: '🌿',
    gradient: 'linear-gradient(145deg,#0d3320,#10b981)',
  },
  midnight: {
    bg: 'radial-gradient(ellipse at 50% 0%, #0f1a3d 0%, #060c20 60%, #020408 100%)',
    ringStroke: 'url(#grad-midnight)',
    ringGlow: 'drop-shadow(0 0 22px rgba(96,165,250,.4))',
    symbol: '🌙',
    accentBg: 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
    accentText: '#60a5fa',
    motives: ['রাতের নীরবতায় পড়ো 🌌', 'Stars তোমাকে দেখছে ✨', 'Night owl mode ON 🦉'],
    isPro: true,
    label: 'Midnight',
    emoji: '🌙',
    gradient: 'linear-gradient(145deg,#060c20,#3b82f6)',
  },
  sunset: {
    bg: 'radial-gradient(ellipse at 50% 100%, #7c2d12 0%, #3d1505 40%, #0a0402 100%)',
    ringStroke: 'url(#grad-sunset)',
    ringGlow: 'drop-shadow(0 0 22px rgba(251,146,60,.45))',
    symbol: '🌅',
    accentBg: 'linear-gradient(135deg,#c2410c,#f97316)',
    accentText: '#fb923c',
    motives: ['সূর্যের মতো উজ্জ্বল হও ☀️', 'আজকের পড়া আজই শেষ করো 🌅', 'Horizon দেখা যাচ্ছে! 🔥'],
    isPro: true,
    label: 'Sunset',
    emoji: '🌅',
    gradient: 'linear-gradient(145deg,#7c2d12,#f97316)',
  },
  minimal: {
    bg: '#0a0a0a',
    ringStroke: '#e5e7eb',
    ringGlow: 'drop-shadow(0 0 16px rgba(255,255,255,.2))',
    symbol: '◼',
    accentBg: 'linear-gradient(135deg,#374151,#6b7280)',
    accentText: '#e5e7eb',
    motives: ['Less is more. ▪', 'Clarity. Focus. ◼', 'Pure concentration. ●'],
    isPro: true,
    label: 'Minimal',
    emoji: '⬛',
    gradient: 'linear-gradient(145deg,#111,#333)',
  },
  ramadan: {
    bg: 'radial-gradient(ellipse at 50% 0%, #1c1400 0%, #0d0b00 50%, #030200 100%)',
    ringStroke: 'url(#grad-ramadan)',
    ringGlow: 'drop-shadow(0 0 22px rgba(212,175,55,.4))',
    symbol: '☪️',
    accentBg: 'linear-gradient(135deg,#92400e,#d4af37)',
    accentText: '#fcd34d',
    motives: ['আল্লাহর উপর ভরসা রাখো ☪️', 'ইলম অর্জন করো 📖', 'প্রতিটি মুহূর্ত মূল্যবান ✨'],
    isPro: true,
    label: 'Ramadan',
    emoji: '☪️',
    gradient: 'linear-gradient(145deg,#1c1400,#d4af37)',
  },
};

// ── AI Chat Message type ─────────────────────────────────
interface ChatMsg { role: 'user' | 'assistant'; content: string; }

function TimerContent() {
  const searchParams = useSearchParams();
  const day = searchParams?.get('day');
  const roadmapId = searchParams?.get('roadmap');
  const router = useRouter();
  const { profile } = useProfile();

  // Timer state
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyHours, setDailyHours] = useState(2);
  const [targetSeconds, setTargetSeconds] = useState(7200);
  const [secondsLeft, setSecondsLeft] = useState(7200);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const isCompleteRef = useRef(false);
  const [isComplete, setIsComplete] = useState(false);

  // Theme state
  const [theme, setTheme] = useState<ThemeName>('default');
  const [showThemeSheet, setShowThemeSheet] = useState(false);
  const [showProUpsell, setShowProUpsell] = useState(false);

  // Mood sheet state
  const [showMoodSheet, setShowMoodSheet] = useState(false);
  const [selectedMood, setSelectedMood] = useState<'bad' | 'neutral' | 'good' | 'fire'>('good');

  // Resume modal
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [savedElapsed, setSavedElapsed] = useState(0);

  // AI Tutor state
  const [showAI, setShowAI] = useState(false);
  const [aiMessages, setAiMessages] = useState<ChatMsg[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiEndRef = useRef<HTMLDivElement>(null);

  // Motivation cycling
  const [motiveIdx, setMotiveIdx] = useState(0);

  const t = THEMES[theme];

  // Load profile theme on mount
  useEffect(() => {
    if (profile?.timer_theme && THEMES[profile.timer_theme as ThemeName]) {
      setTheme(profile.timer_theme as ThemeName);
    }
  }, [profile]);

  // Fetch daily_hours + topics
  useEffect(() => {
    if (!day || !roadmapId) return;
    const fetch = async () => {
      const { data: roadmap } = await supabase
        .from('roadmaps')
        .select('schedule, daily_hours')
        .eq('id', roadmapId)
        .single();
      if (roadmap) {
        const hours = roadmap.daily_hours || 2;
        setDailyHours(hours);
        const target = Math.round(hours * 3600);
        setTargetSeconds(target);
        const saved = localStorage.getItem('active_session');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.roadmapId === roadmapId && parsed.dayNumber === Number(day)) {
              setSavedElapsed(parsed.elapsed || 0);
              setShowResumeModal(true);
            } else { setSecondsLeft(target); setIsRunning(true); }
          } catch { setSecondsLeft(target); setIsRunning(true); }
        } else { setSecondsLeft(target); setIsRunning(true); }
        if (roadmap.schedule) {
          const ds = (roadmap.schedule as any[]).find((d: any) => d.day_number === Number(day));
          if (ds?.topic_ids?.length > 0) {
            const { data: td } = await supabase.from('topics').select('*').in('id', ds.topic_ids);
            if (td) setTopics(td as Topic[]);
          }
        }
      }
      setLoading(false);
    };
    fetch();
  }, [day, roadmapId]);

  // Countdown
  useEffect(() => {
    if (!isRunning || showResumeModal) return;
    const iv = setInterval(() => {
      if (isCompleteRef.current) { clearInterval(iv); return; }
      setSecondsLeft(prev => {
        const next = prev - 1;
        if (next <= 0) {
          isCompleteRef.current = true;
          setIsComplete(true);
          setIsRunning(false);
          clearInterval(iv);
          return 0;
        }
        return next;
      });
      setElapsedSeconds(e => {
        const ne = e + 1;
        if (ne % 30 === 0) {
          localStorage.setItem('active_session', JSON.stringify({ roadmapId, dayNumber: Number(day), elapsed: ne }));
        }
        if (ne % 300 === 0) setMotiveIdx(i => (i + 1) % t.motives.length);
        return ne;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [isRunning, showResumeModal, roadmapId, day, t.motives.length]);

  // Auto-scroll AI chat
  useEffect(() => { aiEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiMessages]);

  const fmt = (s: number) => {
    const v = Math.max(0, s);
    return `${String(Math.floor(v/3600)).padStart(2,'0')}:${String(Math.floor((v%3600)/60)).padStart(2,'0')}:${String(v%60).padStart(2,'0')}`;
  };

  const pct = targetSeconds > 0 ? Math.min((elapsedSeconds / targetSeconds) * 100, 100) : 0;
  const radius = 110;
  const circ = 2 * Math.PI * radius;
  const strokeOffset = circ * (1 - pct / 100);

  const handleResumeChoice = useCallback((resume: boolean) => {
    if (resume && savedElapsed > 0) {
      const rem = Math.max(0, targetSeconds - savedElapsed);
      setSecondsLeft(rem);
      setElapsedSeconds(savedElapsed);
      if (rem <= 0) { isCompleteRef.current = true; setIsComplete(true); }
    } else {
      localStorage.removeItem('active_session');
      setSecondsLeft(targetSeconds);
      setElapsedSeconds(0);
    }
    setShowResumeModal(false);
    setIsRunning(true);
  }, [savedElapsed, targetSeconds]);

  const handleFinish = () => { if (isComplete) setShowMoodSheet(true); };

  const handleCompleteSession = async () => {
    setFinishing(true);
    setShowMoodSheet(false);
    try {
      const res = await fetch('/api/sessions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roadmap_id: roadmapId, day_number: Number(day), duration_secs: elapsedSeconds, mood: selectedMood }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.error || 'Failed');
      localStorage.removeItem('active_session');
      router.push(`/timer/complete?xp=${data.xp_earned}&duration=${Math.floor(elapsedSeconds/60)}&day=${day}&roadmap=${roadmapId}&pro=${profile?.plan === 'pro' ? 'true' : 'false'}`);
    } catch { setFinishing(false); }
  };

  // Apply theme and save to DB
  const applyTheme = async (name: ThemeName) => {
    const isPro = profile?.plan === 'pro';
    if (THEMES[name].isPro && !isPro) { setShowProUpsell(true); return; }
    setShowProUpsell(false);
    setTheme(name);
    setShowThemeSheet(false);
    localStorage.setItem('timer_theme', name);
    if (profile) {
      await supabase.from('profiles').update({ timer_theme: name }).eq('id', profile.id);
    }
  };

  // AI chat send
  const handleAISend = async () => {
    if (!aiInput.trim() || aiLoading) return;
    const userMsg = aiInput.trim();
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setAiLoading(true);

    // Build context: current topics
    const topicContext = topics.length > 0
      ? `The student is currently studying Day ${day} with topics: ${topics.map(t => t.name).join(', ')}.`
      : `The student is in a study session (Day ${day}).`;

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: aiMessages.slice(-6), // last 6 messages for context
          systemContext: topicContext,
        }),
      });
      const data = await res.json();
      setAiMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'কিছু সমস্যা হয়েছে। আবার চেষ্টা করো।' }]);
    } catch {
      setAiMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Try again.' }]);
    }
    setAiLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: t.bg }}>
        <div className="w-10 h-10 rounded-full animate-spin" style={{ borderWidth: '4px', borderStyle: 'solid', borderColor: `${t.accentText} transparent transparent transparent` }} />
      </div>
    );
  }

  const xpPreview = Math.max(10, Math.floor(elapsedSeconds / 60) * 2);

  return (
    <div
      className="flex flex-col min-h-screen items-center select-none w-full"
      style={{ background: t.bg, height: '100dvh', overflow: 'hidden', color: '#fff', transition: 'background 0.8s ease' }}
    >
      <style>{`
        @keyframes sheetIn { from{transform:translateY(100%)} to{transform:translateY(0)} }
        .sheet-enter { animation: sheetIn .3s cubic-bezier(.32,.72,0,1) forwards; }
        @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        .ai-float { animation: floatY 3s ease-in-out infinite; }
        .ai-float:hover { animation: none; transform: scale(1.08); }
        .mood-btn { transition: all .2s; cursor: pointer; }
        .mood-btn:hover { transform: scale(1.12); }
        .mood-btn.sel { transform: scale(1.2); }
        .th-btn { cursor: pointer; transition: transform .2s, box-shadow .2s; border-radius: 20px; overflow: hidden; aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 12px; border: 2.5px solid transparent; }
        .th-btn:hover { transform: scale(1.04); }
        .th-btn.active { border-color: rgba(255,255,255,.8); box-shadow: 0 0 20px rgba(255,255,255,.2); }
        .glass { background: rgba(255,255,255,0.04); backdrop-filter: blur(14px); border: 1px solid rgba(255,255,255,0.07); }
        textarea:focus { outline: none; }
      `}</style>

      {/* Header */}
      <header className="w-full flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-2 max-w-sm mx-auto">
        <button onClick={() => router.push('/roadmap')}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Day {day}</p>
          <p className="text-xs font-bold text-white">{topics[0]?.name || 'Study Session'}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => { setShowThemeSheet(true); setShowProUpsell(false); }}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <span className="text-xl">🎨</span>
          </button>
        </div>
      </header>

      {/* Status pill */}
      <div className="flex-shrink-0 text-center mb-2">
        <div className="inline-flex items-center gap-1.5 bg-white/8 border border-white/10 px-3 py-1 rounded-full">
          <div className={`w-1.5 h-1.5 rounded-full ${isComplete ? 'bg-emerald-400' : isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'}`} />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: isComplete ? '#34d399' : isRunning ? '#34d399' : '#facc15' }}>
            {isComplete ? 'সম্পন্ন! ✓' : isRunning ? 'চলছে' : 'বিরতি'}
          </span>
        </div>
      </div>

      {/* Timer Ring */}
      <section className="flex-shrink-0 mb-3 relative">
        <div style={{ filter: t.ringGlow }}>
          <svg className="w-64 h-64 -rotate-90" viewBox="0 0 256 256">
            <defs>
              <linearGradient id="grad-default" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6"/>
                <stop offset="100%" stopColor="#6264f4"/>
              </linearGradient>
              <linearGradient id="grad-midnight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60a5fa"/>
                <stop offset="100%" stopColor="#1d4ed8"/>
              </linearGradient>
              <linearGradient id="grad-sunset" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24"/>
                <stop offset="50%" stopColor="#f97316"/>
                <stop offset="100%" stopColor="#ef4444"/>
              </linearGradient>
              <linearGradient id="grad-ramadan" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fcd34d"/>
                <stop offset="100%" stopColor="#d4af37"/>
              </linearGradient>
            </defs>
            <circle cx="128" cy="128" r={radius} fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="10"/>
            <circle cx="128" cy="128" r={radius} fill="transparent"
              stroke={isComplete ? '#10b981' : t.ringStroke}
              strokeWidth="13"
              strokeDasharray={circ}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span className="text-3xl mb-0.5">{t.symbol}</span>
            <span className="text-[10px] font-bold uppercase tracking-[.15em] text-gray-500">
              {isComplete ? 'সম্পন্ন' : 'বাকি আছে'}
            </span>
            <span className="text-4xl font-black font-mono text-white">{fmt(secondsLeft)}</span>
            <span className="text-[10px] font-bold" style={{ color: t.accentText }}>
              Goal: {dailyHours}h · {fmt(elapsedSeconds)} elapsed
            </span>
          </div>
        </div>
      </section>

      {/* Motivation */}
      <section className="text-center flex-shrink-0 mb-3 px-4">
        <p className="text-base font-extrabold text-white">
          {isComplete ? 'অসাধারণ! দিন শেষ! 🏆' : t.motives[motiveIdx]}
        </p>
        <p className="text-gray-500 text-xs mt-0.5">
          {isComplete ? 'Mood বেছে session শেষ করো' : `${Math.round(pct)}% completed`}
        </p>
      </section>

      {/* Topics */}
      <section className="w-full max-w-sm mx-auto px-4 mb-4 flex-shrink-0">
        <div className="glass rounded-2xl p-4" style={{ borderColor: `${t.accentText}22` }}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">আজকের Topics</h3>
            <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full font-bold">{topics.length} topics</span>
          </div>
          <div className="flex flex-col gap-2.5 max-h-[100px] overflow-y-auto pr-1">
            {topics.map((topic, i) => (
              <div key={topic.id} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ border: `1px solid ${t.accentText}60` }}>
                  <span className="text-[9px] font-black" style={{ color: t.accentText }}>{i+1}</span>
                </div>
                <span className="text-sm text-slate-200 font-medium">{topic.name}</span>
              </div>
            ))}
            {topics.length === 0 && <p className="text-sm text-slate-500 italic">Topics load হচ্ছে...</p>}
          </div>
        </div>
      </section>

      {/* Controls */}
      <footer className="flex-shrink-0 w-full max-w-sm mx-auto flex justify-center items-center gap-5 px-4 pb-6 mt-auto">
        <button onClick={() => setIsRunning(r => !r)} disabled={isComplete}
          className="w-14 h-14 rounded-full border-2 border-white/15 flex items-center justify-center hover:bg-white/10 transition-all active:scale-95 disabled:opacity-30">
          {isRunning ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-0.5" />}
        </button>

        {/* AI Help button */}
        <button onClick={() => setShowAI(true)}
          className="px-5 py-3 rounded-2xl text-white font-bold text-sm flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg"
          style={{ background: t.accentBg }}>
          <span className="text-lg">🤖</span> AI Help
        </button>

        <button onClick={handleFinish} disabled={!isComplete || finishing}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${isComplete ? 'hover:opacity-90' : 'opacity-30 cursor-not-allowed'}`}
          style={{ background: isComplete ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(255,255,255,0.05)', border: isComplete ? 'none' : '2px solid rgba(255,255,255,0.1)' }}>
          <CheckCircle2 className="w-6 h-6 text-white" />
        </button>
      </footer>

      {/* Floating AI bubble (when AI panel closed) */}
      {!showAI && (
        <button onClick={() => setShowAI(true)}
          className="ai-float fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border-2 border-white/10"
          style={{ background: t.accentBg }}>
          <span className="text-2xl">🤖</span>
          <span className="absolute -top-1 -right-1 bg-emerald-400 text-emerald-900 text-[9px] font-black px-1.5 py-0.5 rounded-full">AI!</span>
        </button>
      )}

      {/* ── AI TUTOR PANEL ─────────────────────────────────── */}
      {showAI && (
        <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
          {/* AI Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: t.accentBg }}>🤖</div>
              <div>
                <p className="font-bold text-white text-sm">AI Tutor</p>
                <p className="text-gray-500 text-xs">Day {day} · {topics.length} topics</p>
              </div>
            </div>
            <button onClick={() => setShowAI(false)}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Topic context pills */}
          {topics.length > 0 && (
            <div className="px-4 py-2 flex gap-2 flex-wrap flex-shrink-0">
              {topics.map(tp => (
                <button key={tp.id}
                  onClick={() => setAiInput(`${tp.name} সম্পর্কে বলো`)}
                  className="text-xs px-3 py-1 rounded-full border font-medium hover:opacity-80 transition-opacity"
                  style={{ borderColor: `${t.accentText}50`, color: t.accentText, background: `${t.accentText}15` }}>
                  {tp.name}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {aiMessages.length === 0 && (
              <div className="text-center pt-8">
                <div className="text-4xl mb-3">🤖</div>
                <p className="text-gray-300 font-bold text-sm mb-1">AI Tutor এখানে আছি!</p>
                <p className="text-gray-600 text-xs">যেকোনো topic সম্পর্কে জিজ্ঞেস করো</p>
                {topics.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {[
                      `${topics[0]?.name} explain করো`,
                      'আজকের সবচেয়ে গুরুত্বপূর্ণ concept কী?',
                      'একটা practice question দাও',
                    ].map(suggestion => (
                      <button key={suggestion} onClick={() => setAiInput(suggestion)}
                        className="block w-full text-left px-4 py-2.5 rounded-xl text-xs font-medium transition-colors"
                        style={{ background: `${t.accentText}10`, color: t.accentText, border: `1px solid ${t.accentText}25` }}>
                        💬 {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {aiMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-1"
                    style={{ background: t.accentBg }}>🤖</div>
                )}
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'text-white rounded-tr-sm'
                    : 'text-gray-200 rounded-tl-sm'
                }`} style={{
                  background: msg.role === 'user' ? t.accentBg : 'rgba(255,255,255,0.08)',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0"
                  style={{ background: t.accentBg }}>🤖</div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white/8">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={aiEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 pb-6 pt-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex gap-3 items-end">
              <textarea
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAISend(); } }}
                placeholder="প্রশ্ন করো..."
                rows={1}
                className="flex-1 bg-white/8 border border-white/15 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-600 resize-none"
                style={{ maxHeight: '120px' }}
              />
              <button onClick={handleAISend} disabled={!aiInput.trim() || aiLoading}
                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
                style={{ background: t.accentBg }}>
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── THEME SHEET ──────────────────────────────────────── */}
      {showThemeSheet && (
        <>
          <div className="fixed inset-0 z-[80] bg-black/65 backdrop-blur-sm" onClick={() => setShowThemeSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[90] max-w-sm mx-auto sheet-enter">
            <div className="rounded-t-3xl p-6" style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-5" />
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-extrabold text-white text-lg">Timer Theme</h3>
                <span className="text-[10px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2 py-1 rounded-full font-bold">⭐ PRO Themes</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {(Object.entries(THEMES) as [ThemeName, typeof THEMES[ThemeName]][]).map(([name, cfg]) => (
                  <button key={name} onClick={() => applyTheme(name)}
                    id={`tb-${name}`}
                    className={`th-btn ${theme === name ? 'active' : ''}`}
                    style={{ background: cfg.gradient }}>
                    <span className="text-3xl">{cfg.emoji}</span>
                    <span className="text-xs font-extrabold text-white">{cfg.label}</span>
                    <span className={`text-[9px] font-bold ${cfg.isPro ? 'text-yellow-400' : 'text-emerald-400'}`}>
                      {cfg.isPro ? 'PRO' : 'FREE'}
                    </span>
                  </button>
                ))}
              </div>
              {showProUpsell && (
                <div className="bg-yellow-400/8 border border-yellow-400/20 rounded-2xl p-4 mb-4">
                  <p className="text-sm font-bold text-yellow-300 mb-1">⭐ এটি PRO theme</p>
                  <p className="text-xs text-slate-400 mb-3">সব ৬টি exclusive theme unlock করতে Pro নাও।</p>
                  <button onClick={() => { setShowThemeSheet(false); router.push('/pro'); }}
                    className="block w-full text-center py-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900 font-extrabold text-sm rounded-xl hover:opacity-90 transition-all">
                    Pro Upgrade → ৳১৫০/মাস
                  </button>
                </div>
              )}
              <button onClick={() => setShowThemeSheet(false)}
                className="w-full py-3 text-gray-600 text-sm font-bold hover:text-white transition-colors">
                বন্ধ করো
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── RESUME MODAL ─────────────────────────────────────── */}
      {showResumeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)' }}>
          <div className="rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center" style={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-4xl mb-4">⏱️</div>
            <h3 className="text-xl font-extrabold text-white mb-2">Session Found</h3>
            <p className="text-gray-400 text-sm mb-6">
              Day {day} এর একটা unfinished session পাওয়া গেছে।<br />
              <span className="font-bold" style={{ color: t.accentText }}>{fmt(savedElapsed)}</span> পড়া হয়েছে।
            </p>
            <div className="flex gap-3">
              <button onClick={() => handleResumeChoice(false)}
                className="flex-1 py-3 rounded-xl font-bold text-gray-300 hover:bg-white/10 transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                নতুন শুরু
              </button>
              <button onClick={() => handleResumeChoice(true)}
                className="flex-1 py-3 rounded-xl font-bold text-white hover:opacity-90 transition-opacity"
                style={{ background: t.accentBg }}>
                Resume
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MOOD SHEET ───────────────────────────────────────── */}
      {showMoodSheet && (
        <>
          <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm" onClick={() => setShowMoodSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[90] max-w-sm mx-auto sheet-enter">
            <div className="rounded-t-3xl p-6" style={{ background: '#13131f', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-4" />
              <h3 className="text-xl font-extrabold text-white text-center mb-1">আজকে কেমন গেল? 🎯</h3>
              <p className="text-gray-500 text-sm text-center mb-5">Mood বেছে নাও তারপর complete করো।</p>
              <div className="grid grid-cols-4 gap-3 mb-5">
                {(['bad','neutral','good','fire'] as const).map((mood, i) => {
                  const emojis = ['😔','😐','🙂','🔥'];
                  return (
                    <button key={mood} onClick={() => setSelectedMood(mood)}
                      className={`mood-btn aspect-square rounded-2xl flex items-center justify-center text-3xl ${selectedMood === mood ? 'sel' : ''}`}
                      style={{
                        background: selectedMood === mood ? `${t.accentText}20` : 'rgba(255,255,255,0.05)',
                        border: selectedMood === mood ? `2px solid ${t.accentText}60` : '1px solid rgba(255,255,255,0.1)',
                      }}>
                      {emojis[i]}
                    </button>
                  );
                })}
              </div>
              <div className="rounded-2xl p-4 flex items-center justify-between mb-5"
                style={{ background: `${t.accentText}12`, border: `1px solid ${t.accentText}30` }}>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">অর্জিত XP</p>
                  <p className="text-2xl font-black" style={{ color: t.accentText }}>+{xpPreview} XP</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">সময়</p>
                  <p className="text-lg font-black text-white">{dailyHours}h</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowMoodSheet(false)}
                  className="flex-1 py-3.5 border-2 border-white/10 text-gray-400 font-bold rounded-2xl hover:bg-white/5 transition-all text-sm">
                  ← ফিরে যাই
                </button>
                <button onClick={handleCompleteSession} disabled={finishing}
                  className="flex-[1.5] py-3.5 text-white font-extrabold rounded-2xl hover:opacity-90 transition-all text-sm disabled:opacity-50"
                  style={{ background: t.accentBg, boxShadow: `0 8px 20px ${t.accentText}30` }}>
                  {finishing ? 'Saving...' : 'সম্পন্ন! →'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function TimerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f0a1e' }}>
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <TimerContent />
    </Suspense>
  );
}