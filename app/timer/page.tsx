'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Topic } from '@/types';
import { Play, Pause, CheckCircle2, X } from 'lucide-react';

function TimerContent() {
  const searchParams = useSearchParams();
  const day = searchParams.get('day');
  const roadmapId = searchParams.get('roadmap');
  const router = useRouter();
  const supabase = createClient();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [finishing, setFinishing] = useState(false);
  
  // Modal states
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [savedSessionSeconds, setSavedSessionSeconds] = useState(0);

  // Fetch topics for this day
  useEffect(() => {
    if (!day || !roadmapId) return;

    const fetchDayData = async () => {
      // Get roadmap to find topic IDs for this day
      const { data: roadmap } = await supabase
        .from('roadmaps')
        .select('schedule')
        .eq('id', roadmapId)
        .single();

      if (roadmap && roadmap.schedule) {
        const daySchedule = (roadmap.schedule as any[]).find(d => d.day_number === Number(day));
        if (daySchedule && daySchedule.topic_ids) {
          const { data: topicsData } = await supabase
            .from('topics')
            .select('*')
            .in('id', daySchedule.topic_ids);
          
          if (topicsData) setTopics(topicsData as Topic[]);
        }
      }
      setLoading(false);
    };

    fetchDayData();
  }, [day, roadmapId, supabase]);

  // Check for active session in localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('active_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.roadmapId === roadmapId && parsed.dayNumber === Number(day)) {
          setSavedSessionSeconds(parsed.seconds);
          setShowResumeModal(true);
          setIsRunning(false); // Pause timer while modal is open
        }
      } catch (e) {
        console.error('Failed to parse active_session', e);
      }
    }
  }, [roadmapId, day]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && !showResumeModal) {
      interval = setInterval(() => {
        setSeconds(s => {
          const newS = s + 1;
          // Save to localStorage every 30 seconds
          if (newS % 30 === 0) {
            localStorage.setItem('active_session', JSON.stringify({
              roadmapId,
              dayNumber: Number(day),
              seconds: newS
            }));
          }
          return newS;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, showResumeModal, roadmapId, day]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleFinish = async () => {
    setFinishing(true);
    setIsRunning(false);

    try {
      const res = await fetch('/api/sessions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roadmap_id: roadmapId,
          day_number: Number(day),
          duration_secs: seconds,
          mood: 'good' // Default mood for now
        })
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.error || 'Failed to save session');

      // Clear local storage
      localStorage.removeItem('active_session');

      // Redirect to complete page
      router.push(`/timer/complete?xp=${data.xp_earned}&duration=${Math.floor(seconds / 60)}`);
    } catch (err) {
      console.error(err);
      // Use a custom modal or inline error in a real app, but for now just re-enable
      setFinishing(false);
      setIsRunning(true);
    }
  };

  const handleResumeChoice = (resume: boolean) => {
    if (resume) {
      setSeconds(savedSessionSeconds);
    } else {
      localStorage.removeItem('active_session');
      setSeconds(0);
    }
    setShowResumeModal(false);
    setIsRunning(true);
  };

  if (loading) return <div className="p-6 text-center text-slate-400 min-h-screen flex items-center justify-center">Loading session...</div>;

  return (
    <div className="flex flex-col min-h-screen p-6">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => router.push('/roadmap')}
          className="w-10 h-10 bg-card-dark border border-border-dark rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Study Session</div>
          <div className="text-white font-extrabold">Day {day}</div>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Timer Display */}
      <div className="flex-1 flex flex-col items-center justify-center py-12">
        <div className="relative w-64 h-64 flex items-center justify-center">
          {/* Animated rings */}
          <div className={`absolute inset-0 rounded-full border-4 border-primary/20 ${isRunning ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
          <div className={`absolute inset-4 rounded-full border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent ${isRunning ? 'animate-[spin_3s_linear_infinite]' : ''}`} />
          
          {/* Time */}
          <div className="text-5xl font-mono font-black text-white tracking-tight">
            {formatTime(seconds)}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 mt-12">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="w-16 h-16 bg-card-dark border border-border-dark rounded-full flex items-center justify-center text-white hover:bg-border-dark transition-colors shadow-lg"
          >
            {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </button>
        </div>
      </div>

      {/* Topics List */}
      <div className="bg-card-dark border border-border-dark rounded-3xl p-6 mb-6">
        <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Today&apos;s Topics</h3>
        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
          {topics.map(topic => (
            <div key={topic.id} className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <div className="text-sm text-slate-200 font-medium">{topic.name}</div>
            </div>
          ))}
          {topics.length === 0 && (
            <div className="text-sm text-slate-500 italic">No specific topics assigned for today. Just study!</div>
          )}
        </div>
      </div>

      {/* Finish Button */}
      <button
        onClick={handleFinish}
        disabled={finishing || seconds < 60} // Require at least 1 minute
        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-extrabold rounded-2xl shadow-[0_8px_20px_rgba(16,185,129,0.25)] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
      >
        {finishing ? 'Saving...' : (
          <>
            <CheckCircle2 className="w-5 h-5" /> Finish Day
          </>
        )}
      </button>

      {/* Resume Modal */}
      {showResumeModal && (
        <div className="absolute inset-0 z-50 bg-bg-dark/90 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-card-dark border border-border-dark rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⏱️</span>
            </div>
            <h3 className="text-xl font-extrabold text-white mb-2">Session Recovered</h3>
            <p className="text-slate-400 text-sm mb-6">
              We found an unfinished session for Day {day} ({formatTime(savedSessionSeconds)}). Would you like to resume it?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleResumeChoice(false)}
                className="flex-1 py-3 bg-card-dark-2 border border-border-dark text-slate-300 font-bold rounded-xl hover:bg-border-dark transition-colors"
              >
                Start Over
              </button>
              <button
                onClick={() => handleResumeChoice(true)}
                className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-[0_4px_12px_rgba(98,100,244,0.3)]"
              >
                Resume
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function TimerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-dark flex items-center justify-center text-slate-400">Loading...</div>}>
      <TimerContent />
    </Suspense>
  );
}
