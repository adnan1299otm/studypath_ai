'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks/use-profile';
import { DayProgress, Roadmap } from '@/types';
import { Lock, Check, Plus, Star, Clock, BookOpen, Play, X, ChevronRight, Zap } from 'lucide-react';

export default function RoadmapPage() {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [days, setDays] = useState<DayProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useProfile();
  const router = useRouter();
  const supabase = createClient();

  // Roadmap switcher states
  const [allRoadmaps, setAllRoadmaps] = useState<{id: string; title: string; total_days: number; created_at: string}[]>([]);
  const [showSwitcher, setShowSwitcher] = useState(false);

  // Bottom sheet states
  const [selectedDay, setSelectedDay] = useState<DayProgress | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [sheetTopics, setSheetTopics] = useState<{name: string; difficulty: string}[]>([]);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetTopicNames, setSheetTopicNames] = useState<Record<number, string>>({});

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

      const { data: allR } = await supabase
        .from('roadmaps')
        .select('id, syllabus_id, total_days, created_at, is_active')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Get syllabus title for each roadmap
      if (allR && allR.length > 0) {
        const syllabusIds = allR.map((r: any) => r.syllabus_id).filter(Boolean);
        const { data: syllabuses } = await supabase
          .from('syllabuses')
          .select('id, title')
          .in('id', syllabusIds);

        const syllabusMap: Record<string, string> = {};
        syllabuses?.forEach((s: any) => { syllabusMap[s.id] = s.title; });

        setAllRoadmaps(allR.map((r: any) => ({
          id: r.id,
          title: syllabusMap[r.syllabus_id] || `Roadmap ${r.total_days} days`,
          total_days: r.total_days,
          created_at: r.created_at,
        })));
      }

      const { data: dData } = await supabase
        .from('day_progress')
        .select('*')
        .eq('roadmap_id', rData.id)
        .order('day_number');

      let currentDays = dData as DayProgress[] || [];

      // Create day_progress rows if missing
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
        }
      }

      setDays(currentDays);
      setLoading(false);

      // Parse schedule safely
      let parsedSchedule: any[] = [];
      if (typeof rData.schedule === 'string') {
        try {
          parsedSchedule = JSON.parse(rData.schedule);
        } catch (e) {
          // Ignore
        }
      } else if (Array.isArray(rData.schedule)) {
        parsedSchedule = rData.schedule;
      }

      // Build a map of day_number → first topic name
      const nameMap: Record<number, string> = {};
      for (const s of parsedSchedule) {
        const dayNum = s.day_number || s.day;
        const topicIds = s.topic_ids || s.topics || [];
        if (topicIds.length > 0) {
          const { data: t } = await supabase
            .from('topics')
            .select('name')
            .eq('id', topicIds[0])
            .single();
          if (t) nameMap[dayNum] = t.name;
        }
      }
      setSheetTopicNames(nameMap);
    };

    fetchRoadmap();
  }, [supabase]);

  // Parse schedule safely for render
  let parsedSchedule: any[] = [];
  if (roadmap) {
    if (typeof roadmap.schedule === 'string') {
      try {
        parsedSchedule = JSON.parse(roadmap.schedule);
      } catch (e) {
        // Ignore
      }
    } else if (Array.isArray(roadmap.schedule)) {
      parsedSchedule = roadmap.schedule;
    }
  }

  const openSheet = async (day: DayProgress) => {
    setSelectedDay(day);
    setShowSheet(true);
    setSheetLoading(true);

    const daySchedule = parsedSchedule.find(
      (s: any) => (s.day_number || s.day) === day.day_number
    );
    const topicIds = daySchedule?.topic_ids || daySchedule?.topics || [];

    if (topicIds.length > 0) {
      const { data } = await supabase
        .from('topics')
        .select('name, difficulty')
        .in('id', topicIds);
      setSheetTopics(data || []);
    } else {
      setSheetTopics([]);
    }
    setSheetLoading(false);
  };

  const closeSheet = () => {
    setShowSheet(false);
    setSelectedDay(null);
  };

  const switchRoadmap = async (newRoadmapId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // Set all roadmaps inactive, then set selected one active
    await supabase.from('roadmaps').update({ is_active: false }).eq('user_id', user.id);
    await supabase.from('roadmaps').update({ is_active: true }).eq('id', newRoadmapId);
    setShowSwitcher(false);
    setLoading(true);
    window.location.reload();
  };

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

  const currentDayIndex = days.findIndex(
    d => d.status === 'available' || d.status === 'in_progress'
  );

  return (
    <div className="p-6 pb-32">
      <style>{`
        @keyframes bounceY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulseRing {
          0% { box-shadow: 0 0 0 0 rgba(98,100,244,0.5); }
          70% { box-shadow: 0 0 0 14px rgba(98,100,244,0); }
          100% { box-shadow: 0 0 0 0 rgba(98,100,244,0); }
        }
        @keyframes spinStar {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes sheetIn {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dashMove { to { stroke-dashoffset: -26; } }
      `}</style>

      {allRoadmaps.length > 1 && (
        <div className="mb-4">
          <button
            onClick={() => setShowSwitcher(true)}
            className="w-full flex items-center justify-between px-4 py-3 bg-card-dark border border-border-dark rounded-2xl hover:border-primary/40 transition-all"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-white truncate max-w-[180px]">
                {roadmap ? (allRoadmaps.find(r => r.id === roadmap.id)?.title || 'Current Roadmap') : 'Select Roadmap'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500 font-bold">{allRoadmaps.length} roadmaps</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>
          </button>
        </div>
      )}

      {/* SECTION 1 — Level Badge */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-2 bg-card-dark border border-border-dark px-4 py-2 rounded-full">
          <span className="text-base">🎓</span>
          <span className="text-xs font-bold text-slate-300">Level {profile?.level || 1}</span>
          <span className="text-primary text-xs font-bold">
            {200 - ((profile?.xp || 0) % 200)} XP to next
          </span>
        </div>
      </div>

      {/* SECTION 2 — Zigzag Node Layout */}
      <div className="relative flex flex-col items-center gap-0 max-w-lg mx-auto">
        {/* SVG curved connector lines behind nodes */}
        <svg
          className="absolute top-0 left-0 w-full pointer-events-none"
          style={{ height: '100%' }}
          overflow="visible"
        >
          {days.map((day, i) => {
            if (i === 0) return null;
            
            const nodeHeight = 160; // approximate px per node including margin
            const isCheckpointInserted = Math.floor(i / 5) > Math.floor((i - 1) / 5);
            const checkpointOffset = isCheckpointInserted ? 180 : 0;
            
            const prevY = i * nodeHeight + checkpointOffset - nodeHeight / 2;
            const currY = i * nodeHeight + checkpointOffset + nodeHeight / 2;
            
            const prevIsLeft = (i - 1) % 2 === 0;
            const currIsLeft = i % 2 === 0;
            
            const prevX = prevIsLeft ? '30%' : '70%';
            const currX = currIsLeft ? '30%' : '70%';
            
            const prevDay = days[i - 1];
            const isDone = prevDay?.status === 'completed' && day.status === 'completed';
            const isActive = prevDay?.status === 'completed' && day.status !== 'completed';
            
            const strokeColor = isDone ? '#22c55e' : isActive ? '#6264f4' : '#252538';
            const strokeOpacity = isDone ? 0.6 : isActive ? 0.5 : 0.3;
            const dashArray = isDone ? 'none' : '8 5';
            
            return (
              <path
                key={`connector-${i}`}
                d={`M ${prevX} ${prevY} Q 50% ${(prevY + currY) / 2} ${currX} ${currY}`}
                fill="none"
                stroke={strokeColor}
                strokeWidth="2.5"
                strokeOpacity={strokeOpacity}
                strokeDasharray={dashArray}
                style={!isDone ? { animation: 'dashMove 1.2s linear infinite' } : undefined}
              />
            );
          })}
        </svg>
        {days.map((day, i) => {
          const isLeft = i % 2 === 0;
          const isCurrent = i === currentDayIndex;
          const isCompleted = day.status === 'completed';
          const isLocked = !isCurrent && !isCompleted && (profile?.plan !== 'pro' || day.status === 'locked');

          return (
            <div key={day.id || `day-${day.day_number}`} className="w-full flex flex-col items-center">
              {isCompleted ? (
                <div style={{ alignSelf: isLeft ? 'flex-start' : 'flex-end', marginLeft: isLeft ? '10%' : 0, marginRight: !isLeft ? '10%' : 0 }}
                  className="flex flex-col items-center mb-16 z-10">
                  <button
                    onClick={() => openSheet(day)}
                    className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center border-4 border-bg-dark shadow-xl hover:scale-105 transition-transform cursor-pointer"
                    style={{ boxShadow: '0 0 16px 4px rgba(34,197,94,0.3)' }}
                  >
                    <Check className="w-8 h-8 text-white" strokeWidth={3} />
                  </button>
                  <div className="mt-3 text-center">
                    <p className="text-sm font-bold text-white">Day {day.day_number}</p>
                    <p className="text-xs text-slate-500">{sheetTopicNames[day.day_number] || 'Topics'}</p>
                    <p className="text-[10px] text-emerald-500 font-bold mt-0.5">✓ Completed</p>
                  </div>
                </div>
              ) : isCurrent ? (
                <div style={{ alignSelf: isLeft ? 'flex-start' : 'flex-end', marginLeft: isLeft ? '10%' : 0, marginRight: !isLeft ? '10%' : 0 }}
                  className="flex flex-col items-center mb-16 z-10">
                  {/* Bouncing badge above */}
                  <div style={{ animation: 'bounceY 1.8s ease-in-out infinite' }} className="mb-2">
                    <div className="bg-primary text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-lg relative whitespace-nowrap">
                      Start here ✨
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rotate-45" />
                    </div>
                  </div>
                  <button
                    onClick={() => openSheet(day)}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center border-4 border-bg-dark shadow-2xl hover:scale-110 transition-transform cursor-pointer"
                    style={{ boxShadow: '0 0 24px 6px rgba(98,100,244,0.45)', animation: 'pulseRing 2s ease-out infinite' }}
                  >
                    <Play className="w-10 h-10 text-white fill-white" />
                  </button>
                  <div className="mt-3 text-center">
                    <p className="text-base font-extrabold text-primary">Day {day.day_number}</p>
                    <p className="text-sm font-semibold text-slate-200">{sheetTopicNames[day.day_number] || 'Topics'}</p>
                  </div>
                </div>
              ) : (
                <div style={{ alignSelf: isLeft ? 'flex-start' : 'flex-end', marginLeft: isLeft ? '10%' : 0, marginRight: !isLeft ? '10%' : 0 }}
                  className="flex flex-col items-center mb-16 z-10 opacity-40">
                  <button
                    onClick={() => openSheet(day)}
                    className="w-20 h-20 rounded-full bg-card-dark flex items-center justify-center border-4 border-border-dark shadow-lg grayscale cursor-pointer"
                  >
                    <Lock className="w-7 h-7 text-slate-600" />
                  </button>
                  <div className="mt-3 text-center">
                    <p className="text-sm font-bold text-slate-600">Day {day.day_number}</p>
                    <p className="text-xs text-slate-700">{sheetTopicNames[day.day_number] || ''}</p>
                  </div>
                </div>
              )}

              {/* Checkpoint node */}
              {day.day_number % 5 === 0 && day.status === 'completed' && (
                <div style={{ alignSelf: 'center' }} className="flex flex-col items-center mb-16 z-10">
                  <div className="relative">
                    <div
                      className="w-28 h-28 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center border-4 border-bg-dark shadow-2xl"
                      style={{ boxShadow: '0 0 30px 8px rgba(251,191,36,0.25)' }}
                    >
                      <span className="text-4xl" style={{ display: 'inline-block', animation: 'spinStar 6s linear infinite' }}>⭐</span>
                    </div>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest whitespace-nowrap shadow-lg">
                      Checkpoint {Math.floor(day.day_number / 5)}
                    </div>
                  </div>
                  <div className="mt-4 bg-yellow-400/10 border border-yellow-400/30 px-4 py-2 rounded-xl text-center">
                    <p className="text-xs font-bold text-yellow-400">🏆 Milestone!</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Days 1–{day.day_number} complete</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Backdrop */}
      {showSheet && (
        <div
          className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
          onClick={closeSheet}
        />
      )}

      {/* Sheet */}
      {showSheet && selectedDay && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] max-w-lg mx-auto"
          style={{ animation: 'sheetIn .3s cubic-bezier(.32,.72,0,1) forwards' }}>
          <div className="bg-card-dark border-t border-border-dark rounded-t-3xl p-6">
            {/* Handle */}
            <div className="w-10 h-1 bg-border-dark rounded-full mx-auto mb-5" />

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                    selectedDay.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-primary/20 text-primary'
                  }`}>
                    Day {selectedDay.day_number}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    selectedDay.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {selectedDay.status === 'completed' ? '✓ Completed' : '▶ Current'}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-white">
                  {sheetTopics[0]?.name || `Day ${selectedDay.day_number}`}
                </h3>
              </div>
              <button
                onClick={closeSheet}
                className="w-8 h-8 rounded-full bg-border-dark flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-bg-dark border border-border-dark rounded-xl p-3 text-center">
                <p className="text-lg font-black text-white">{sheetTopics.length}</p>
                <p className="text-[10px] text-slate-500 font-bold">Topics</p>
              </div>
              <div className="bg-bg-dark border border-border-dark rounded-xl p-3 text-center">
                <p className="text-lg font-black text-primary">
                  {roadmap?.daily_hours ? `${roadmap.daily_hours} hrs` : '—'}
                </p>
                <p className="text-[10px] text-slate-500 font-bold">Study Time</p>
              </div>
              <div className="bg-bg-dark border border-border-dark rounded-xl p-3 text-center">
                <p className="text-lg font-black text-yellow-400">+{sheetTopics.length * 50} XP</p>
                <p className="text-[10px] text-slate-500 font-bold">Reward</p>
              </div>
            </div>

            {/* Topic list */}
            {sheetLoading ? (
              <div className="text-center py-4 text-slate-500 text-sm">Loading topics...</div>
            ) : (
              <div className="mb-5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Today&apos;s Topics</p>
                <div className="flex flex-col gap-2">
                  {sheetTopics.map((topic, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-bg-dark border border-border-dark rounded-xl">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        selectedDay.status === 'completed'
                          ? 'bg-emerald-500/20 border border-emerald-500/30'
                          : 'bg-primary/10 border border-primary/20'
                      }`}>
                        {selectedDay.status === 'completed'
                          ? <Check className="w-3 h-3 text-emerald-400" />
                          : <span className="text-xs font-black text-primary">{i + 1}</span>
                        }
                      </div>
                      <span className={`text-sm font-medium ${
                        selectedDay.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-200'
                      }`}>
                        {topic.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA button */}
            {selectedDay.status === 'completed' ? (
              <button
                onClick={() => { closeSheet(); router.push(`/timer?day=${selectedDay.day_number}&roadmap=${roadmap!.id}`); }}
                className="w-full py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-all"
              >
                Review Again
              </button>
            ) : selectedDay.status === 'locked' && profile?.plan !== 'pro' ? (
              <button
                onClick={() => { closeSheet(); router.push('/pro'); }}
                className="w-full py-4 border-2 border-dashed border-border-dark rounded-2xl flex items-center justify-center gap-2 text-slate-500 hover:border-yellow-400/30 hover:text-yellow-400 transition-all font-bold"
              >
                🔒 Unlock with PRO
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { closeSheet(); router.push(`/timer?day=${selectedDay.day_number}&roadmap=${roadmap!.id}`); }}
                  className="w-full py-4 bg-gradient-to-r from-primary to-violet-500 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/30 hover:opacity-90 transition-all"
                >
                  <Play className="w-5 h-5 fill-white" /> Start Day {selectedDay.day_number}
                </button>
                <p className="text-center text-xs text-slate-600">Timer starts — AI tutor will be with you</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showSwitcher && (
        <>
          <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm" onClick={() => setShowSwitcher(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[100] max-w-lg mx-auto"
            style={{ animation: 'sheetIn .3s cubic-bezier(.32,.72,0,1) forwards' }}>
            <div className="bg-card-dark border-t border-border-dark rounded-t-3xl p-6">
              <div className="w-10 h-1 bg-border-dark rounded-full mx-auto mb-5" />
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-extrabold text-white">আমার Roadmaps</h3>
                <button onClick={() => setShowSwitcher(false)}
                  className="w-8 h-8 rounded-full bg-border-dark flex items-center justify-center text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto">
                {allRoadmaps.map((r) => {
                  const isActive = roadmap?.id === r.id;
                  return (
                    <button key={r.id} onClick={() => !isActive && switchRoadmap(r.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                        isActive
                          ? 'border-primary bg-primary/10 cursor-default'
                          : 'border-border-dark hover:border-primary/40 bg-bg-dark cursor-pointer'
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-primary/20' : 'bg-border-dark'}`}>
                          <BookOpen className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-slate-500'}`} />
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${isActive ? 'text-primary' : 'text-white'}`}>{r.title}</p>
                          <p className="text-xs text-slate-500">{r.total_days} days · {new Date(r.created_at).toLocaleDateString('bn-BD')}</p>
                        </div>
                      </div>
                      {isActive && <span className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded-full font-bold">Active</span>}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => { setShowSwitcher(false); router.push('/upload'); }}
                className="w-full mt-4 py-3 border-2 border-dashed border-border-dark rounded-2xl text-slate-500 font-bold text-sm hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> নতুন Roadmap তৈরি করো
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
