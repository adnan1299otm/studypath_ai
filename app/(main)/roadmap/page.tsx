'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks/use-profile';
import { DayProgress, Roadmap } from '@/types';
import { Lock, Check, Plus, Star, Clock, BookOpen } from 'lucide-react';

export default function RoadmapPage() {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [days, setDays] = useState<DayProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useProfile();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchRoadmap = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: rData } = await supabase
        .from('roadmaps')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!rData) {
        setLoading(false);
        return;
      }

      setRoadmap(rData as Roadmap);

      const { data: dData } = await supabase
        .from('day_progress')
        .select('*')
        .eq('roadmap_id', rData.id)
        .order('day_number');

      let currentDays = dData as DayProgress[] || [];

      // PROBLEM 1: Create day_progress rows if missing
      if (currentDays.length === 0 && rData.total_days > 0) {
        const res = await fetch('/api/roadmap/init-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            roadmap_id: rData.id, 
            total_days: rData.total_days 
          }),
        });

        if (res.ok) {
          const { data: newDData } = await supabase
            .from('day_progress')
            .select('*')
            .eq('roadmap_id', rData.id)
            .order('day_number');

          if (newDData) {
            currentDays = newDData as DayProgress[];
          }
        } else {
          console.error("Error inserting day_progress via API");
        }
      }

      setDays(currentDays);
      setLoading(false);
      
      console.log('roadmap:', rData);
      console.log('dayProgress:', currentDays);
      console.log('schedule:', rData?.schedule);
    };

    fetchRoadmap();
  }, [supabase]);

  if (loading) return <div className="p-6 text-center text-slate-400">Loading roadmap...</div>;

  if (!roadmap) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] p-6 text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <span className="text-3xl">🗺️</span>
        </div>
        <h2 className="text-2xl font-extrabold text-white mb-3">No Roadmap Yet</h2>
        <p className="text-slate-400 text-sm mb-8 max-w-[250px] mx-auto">
          Upload your syllabus to generate a personalized study schedule.
        </p>
        <button
          onClick={() => router.push('/upload')}
          className="px-8 py-4 bg-gradient-to-r from-primary to-violet-500 text-white font-extrabold rounded-2xl shadow-[0_8px_20px_rgba(98,100,244,0.25)] hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Create Roadmap
        </button>
      </div>
    );
  }

  // Parse schedule safely
  let parsedSchedule: any[] = [];
  if (typeof roadmap.schedule === 'string') {
    try {
      parsedSchedule = JSON.parse(roadmap.schedule);
    } catch (e) {
      console.error("Failed to parse schedule string:", e);
    }
  } else if (Array.isArray(roadmap.schedule)) {
    parsedSchedule = roadmap.schedule;
  }

  return (
    <div className="p-6 pb-24">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-extrabold text-white mb-2">Your Journey</h1>
        <p className="text-slate-400 text-sm">
          {days.filter(d => d.status === 'completed').length} / {roadmap.total_days} Days Completed
        </p>
      </div>

      <div className="relative py-10 max-w-md mx-auto">
        {/* Vertical connecting line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1.5 bg-border-dark -translate-x-1/2 rounded-full" />
        
        {days.map((day, i) => {
          const isLeft = i % 2 === 0;
          const isUnlocked = profile?.plan === 'pro' || day.status !== 'locked';
          const isCompleted = day.status === 'completed';
          
          // Find schedule for this day
          const daySchedule = parsedSchedule.find((s: any) => s.day === day.day_number);
          const hours = daySchedule?.hours || 0;
          const topics = daySchedule?.topics || daySchedule?.topic_ids || [];
          const topicCount = Array.isArray(topics) ? topics.length : 0;
          
          return (
            <div key={day.id || `day-${day.day_number}`} className={`relative flex items-center justify-center mb-16 ${isLeft ? 'flex-row-reverse' : ''}`}>
              
              {/* Node Button */}
              <button 
                disabled={!isUnlocked}
                onClick={() => router.push(`/timer?day=${day.day_number}&roadmap=${roadmap.id}`)}
                className={`w-16 h-16 rounded-full flex items-center justify-center z-10 border-[6px] border-bg-dark transition-all shadow-xl shrink-0 ${
                  isCompleted 
                    ? 'bg-emerald-500 text-white' 
                    : isUnlocked 
                      ? 'bg-primary text-white hover:scale-110' 
                      : 'bg-card-dark-2 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-6 h-6 stroke-[3]" />
                ) : !isUnlocked ? (
                  <Lock className="w-5 h-5" />
                ) : (
                  <span className="font-extrabold text-lg">{day.day_number}</span>
                )}
              </button>

              {/* Day Label Card */}
              <div className={`absolute ${isLeft ? 'right-1/2 mr-12' : 'left-1/2 ml-12'} w-[140px] bg-card-dark p-3 rounded-xl border border-border-dark shadow-lg`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-xs font-bold text-slate-400">Day {day.day_number}</div>
                  <div className={`text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${isCompleted ? 'bg-emerald-500/10 text-emerald-400' : isUnlocked ? 'bg-primary/10 text-primary' : 'bg-slate-800 text-slate-500'}`}>
                    {isCompleted ? 'Done' : isUnlocked ? 'Start' : 'Locked'}
                  </div>
                </div>
                
                <div className="space-y-1.5 mt-2">
                  {topicCount > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                      <span className="truncate">{topicCount} {topicCount === 1 ? 'Topic' : 'Topics'}</span>
                    </div>
                  )}
                  {hours > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{hours} hrs</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
