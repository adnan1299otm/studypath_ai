'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Brain, 
  Flame, 
  BookOpen, 
  Sprout, 
  Check, 
  ArrowRight, 
  Info, 
  Timer, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

function ConfigureContent() {
  const searchParams = useSearchParams();
  const id = searchParams?.get('id');
  const router = useRouter();
  
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dailyHours, setDailyHours] = useState(4.5);
  const [level, setLevel] = useState('mid');
  const [loading, setLoading] = useState(false);
  const [shakeCalendar, setShakeCalendar] = useState(false);

  const monthNames = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();
  const todayWithoutTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  };

  const handleSelectDay = (d: number) => {
    setSelectedDate(new Date(calYear, calMonth, d));
  };

  let countdownText = 'তারিখ বেছে নাও';
  let countdownClass = 'text-primary';
  if (selectedDate) {
    const diffMs = selectedDate.getTime() - todayWithoutTime.getTime();
    const diffDays = Math.ceil(diffMs / 86400000);
    countdownText = diffDays > 0 ? `${diffDays} দিন বাকি!` : 'আজই!';
  } else if (shakeCalendar) {
    countdownText = '← তারিখ বেছে নাও!';
    countdownClass = 'text-rose-400';
  }

  const intensityMap: Record<number, string> = {
    0.5:'🌙 Very Light', 1:'🌙 Very Light', 1.5:'😴 Light', 2:'😴 Light',
    2.5:'🌱 Moderate', 3:'🌱 Moderate', 3.5:'⚖️ Balanced', 4:'⚖️ Balanced',
    4.5:'⚖️ Balanced', 5:'💪 Focused', 5.5:'💪 Focused', 6:'🔥 Intensive',
    6.5:'🔥 Intensive', 7:'⚡ High Intensive', 7.5:'⚡ High Intensive', 8:'🚀 Maximum'
  };
  const intensityLabel = intensityMap[dailyHours] || '⚖️ Balanced';

  const handleGenerate = async () => {
    if (!selectedDate) {
      setShakeCalendar(true);
      setTimeout(() => setShakeCalendar(false), 2000);
      return;
    }
    
    if (!id) return;

    setLoading(true);
<<<<<<< HEAD
    const apiLevel = level === 'talented' ? 'advanced' : level === 'mid' ? 'intermediate' : 'beginner';
    const localDate = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000));
    
    // Configure data টা URL params এ পাঠাও, creating-roadmap page নিজেই API call করবে
    const params = new URLSearchParams({
      syllabusId: id,
      examDeadline: localDate.toISOString().split('T')[0],
      dailyHours: String(dailyHours),
      studentLevel: apiLevel
    });
    router.push(`/creating-roadmap?${params.toString()}`);
=======
    try {
      const apiLevel = level === 'talented' ? 'advanced' : level === 'mid' ? 'intermediate' : 'beginner';
      const localDate = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000));
      
      const res = await fetch('/api/ai/generate-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syllabusId: id,
          examDeadline: localDate.toISOString().split('T')[0],
          dailyHours: dailyHours,
          studentLevel: apiLevel
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
>>>>>>> e778abf694b250563359473f2a170eba7bc0f202
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center px-4 py-10 w-full overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/8 blur-[100px] rounded-full"></div>
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(#6264f4 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      <div className="w-full max-w-4xl mb-10">
        <div className="flex justify-between items-end mb-3">
          <div>
            <span className="text-primary text-xs font-bold uppercase tracking-widest">Step 3 of 3</span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mt-1">তোমার Path Configure করো</h1>
          </div>
          <div className="text-right">
            <p className="text-slate-500 text-sm font-medium">Progress</p>
            <p className="text-primary text-lg font-bold leading-none">100%</p>
          </div>
        </div>
        <div className="h-2.5 w-full bg-border-dark rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full shadow-sm transition-all duration-500" style={{ width: '100%' }}></div>
        </div>
        <p className="text-slate-500 text-sm mt-2">AI তোমার deadline ও daily hours অনুযায়ী perfect roadmap বানাবে।</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-4xl">
        {/* Card 1: Exam Date */}
        <div className={`flex flex-col gap-4 bg-card-dark border ${shakeCalendar ? 'border-rose-500/50' : 'border-border-dark'} hover:border-primary/40 rounded-2xl p-6 transition-all`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <CalendarIcon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-base font-bold text-white">Exam কবে?</h3>
          </div>

          <div className="bg-bg-dark rounded-xl p-4 border border-border-dark">
            <div className="flex items-center justify-between mb-4">
              <button type="button" onClick={handlePrevMonth} className="p-1.5 hover:text-primary hover:bg-primary/10 rounded-lg transition-all">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <p className="text-sm font-bold">{monthNames[calMonth]} {calYear}</p>
              <button type="button" onClick={handleNextMonth} className="p-1.5 hover:text-primary hover:bg-primary/10 rounded-lg transition-all">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-500 mb-2">
              <span>রবি</span><span>সোম</span><span>মঙ্গ</span><span>বুধ</span><span>বৃহ</span><span>শুক্র</span><span>শনি</span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-xs">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8"></div>
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const d = i + 1;
                const date = new Date(calYear, calMonth, d);
                const isPast = date < todayWithoutTime;
                const isSelected = selectedDate && selectedDate.getDate() === d && selectedDate.getMonth() === calMonth && selectedDate.getFullYear() === calYear;
                const isToday = today.getDate() === d && today.getMonth() === calMonth && today.getFullYear() === calYear;

                let cls = 'h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all ';
                if (isPast) cls += 'text-slate-700 cursor-not-allowed';
                else if (isSelected) cls += 'bg-primary text-white font-bold shadow-lg shadow-primary/30 cursor-pointer';
                else if (isToday) cls += 'border border-primary/50 text-primary cursor-pointer hover:bg-primary/10';
                else cls += 'text-slate-300 cursor-pointer hover:bg-primary/10 hover:text-white';

                return (
                  <button 
                    key={d} 
                    type="button"
                    disabled={isPast} 
                    onClick={() => handleSelectDay(d)} 
                    className={cls}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-between mt-auto">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Countdown</p>
              <p className={`text-lg font-extrabold ${countdownClass}`}>{countdownText}</p>
            </div>
            <Timer className="w-8 h-8 text-primary" />
          </div>
        </div>

        {/* Card 2: Daily Hours */}
        <div className="flex flex-col gap-4 bg-card-dark border border-border-dark hover:border-primary/40 rounded-2xl p-6 transition-all text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-base font-bold text-white">প্রতিদিন কত ঘণ্টা?</h3>
          </div>

          <div className="flex flex-col items-center py-6">
            <div className="relative flex items-end justify-center mb-5">
              <div className="absolute inset-0 bg-primary/15 blur-3xl rounded-full pointer-events-none"></div>
              <span className="relative text-6xl font-black text-primary">{dailyHours}</span>
              <span className="ml-1.5 text-base font-bold text-slate-500 mb-1.5">hrs</span>
            </div>

            <div className="w-full px-2 mb-4">
              <input 
                type="range" 
                min="0.5" 
                max="8" 
                step="0.5" 
                value={dailyHours}
                onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                className="w-full custom-slider" 
              />
              <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                <span>0.5h</span><span>8h</span>
              </div>
            </div>

            <div className="px-5 py-2 rounded-full bg-bg-dark border border-border-dark text-primary text-sm font-bold transition-all">
              {intensityLabel}
            </div>
          </div>

          <p className="text-xs text-slate-600 italic mt-auto">AI complexity তোমার সময় অনুযায়ী adjust হবে।</p>
        </div>

        {/* Card 3: Skill Level */}
        <div className="flex flex-col gap-4 bg-card-dark border border-border-dark hover:border-primary/40 rounded-2xl p-6 transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-base font-bold text-white">তোমার Level?</h3>
          </div>

          <div className="flex flex-col gap-3 flex-1">
            {/* Talented */}
            <div 
              onClick={() => setLevel('talented')}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${level === 'talented' ? 'border-orange-500 bg-orange-500/10' : 'border-border-dark hover:border-orange-500/30'}`}
            >
              <div className={`p-2.5 rounded-xl transition-all ${level === 'talented' ? 'bg-orange-500 text-white' : 'bg-orange-500/10 text-orange-400'}`}>
                <Flame className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-sm leading-tight">Talented</p>
                <p className="text-xs text-slate-500 mt-0.5">Fast-paced, concise সারাংশ।</p>
              </div>
              {level === 'talented' && (
                <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {/* Mid */}
            <div 
              onClick={() => setLevel('mid')}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${level === 'mid' ? 'border-primary bg-primary/10' : 'border-border-dark hover:border-primary/30'}`}
            >
              <div className={`p-2.5 rounded-xl transition-all ${level === 'mid' ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-white text-sm leading-tight">Mid</p>
                  <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded font-black uppercase tracking-tight">Recommended</span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">Balanced depth ও speed।</p>
              </div>
              {level === 'mid' && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {/* Beginner */}
            <div 
              onClick={() => setLevel('beginner')}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${level === 'beginner' ? 'border-emerald-500 bg-emerald-500/10' : 'border-border-dark hover:border-emerald-500/30'}`}
            >
              <div className={`p-2.5 rounded-xl transition-all ${level === 'beginner' ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-400'}`}>
                <Sprout className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-sm leading-tight">Beginner</p>
                <p className="text-xs text-slate-500 mt-0.5">Step-by-step, বিস্তারিত guidance।</p>
              </div>
              {level === 'beginner' && (
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 w-full max-w-md flex flex-col items-center gap-4">
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-primary to-violet-500 text-white text-lg font-extrabold py-5 px-10 rounded-2xl shadow-[0_20px_50px_rgba(98,100,244,0.3)] hover:shadow-[0_25px_60px_rgba(98,100,244,0.5)] hover:-translate-y-1 transition-all group disabled:opacity-70 disabled:hover:translate-y-0"
        >
          <span>🚀</span>
          <span>{loading ? 'Generating...' : 'Roadmap Generate করো'}</span>
          {!loading && <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
        </button>
        <p className="text-slate-600 text-xs text-center flex items-center gap-1.5">
          <Info className="w-4 h-4" />
          AI প্রায় ১৫-২০ সেকেন্ড সময় নেবে।
        </p>
      </div>
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
