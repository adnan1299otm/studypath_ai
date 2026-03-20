'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, Clock, GraduationCap, Sparkles } from 'lucide-react';

function ConfigureContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();
  
  const [examDate, setExamDate] = useState('');
  const [dailyHours, setDailyHours] = useState('3');
  const [level, setLevel] = useState('intermediate');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !examDate) return;
    setLoading(true);

    try {
      const res = await fetch('/api/ai/generate-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syllabusId: id,
          examDeadline: examDate,
          dailyHours: Number(dailyHours),
          studentLevel: level
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      router.push('/roadmap');
    } catch (err) {
      console.error(err);
      alert('Failed to generate roadmap');
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white mb-2">Study Setup</h1>
        <p className="text-slate-400 text-sm">Tell us about your goals to generate a personalized daily schedule.</p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        {/* Exam Date */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-2">
            <Calendar className="w-4 h-4 text-primary" /> Exam Deadline
          </label>
          <input
            type="date"
            required
            min={new Date().toISOString().split('T')[0]}
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="w-full bg-card-dark border-[1.5px] border-border-dark rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-primary/60 transition-all [color-scheme:dark]"
          />
        </div>

        {/* Daily Hours */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-2">
            <Clock className="w-4 h-4 text-primary" /> Daily Study Hours
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="12"
              step="0.5"
              value={dailyHours}
              onChange={(e) => setDailyHours(e.target.value)}
              className="flex-1 accent-primary"
            />
            <div className="w-16 text-center bg-card-dark border border-border-dark rounded-lg py-2 text-white font-bold">
              {dailyHours}h
            </div>
          </div>
        </div>

        {/* Level */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-2">
            <GraduationCap className="w-4 h-4 text-primary" /> Current Level
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['beginner', 'intermediate', 'advanced'].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                className={`py-3 rounded-xl text-xs font-bold capitalize transition-all border ${
                  level === l 
                    ? 'bg-primary/20 border-primary text-primary' 
                    : 'bg-card-dark border-border-dark text-slate-400 hover:bg-border-dark'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !examDate}
          className="w-full mt-8 py-4 bg-gradient-to-r from-primary to-violet-500 text-white font-extrabold rounded-2xl shadow-[0_8px_20px_rgba(98,100,244,0.25)] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? 'Generating...' : (
            <>
              <Sparkles className="w-5 h-5" /> Generate Roadmap
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function ConfigurePage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-400">Loading...</div>}>
      <ConfigureContent />
    </Suspense>
  );
}
