'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Heart, Share2 } from 'lucide-react';

interface Hadith {
  id: number;
  chapter_id: number;
  book_id: number;
  narrator: string;
  bn: string;
  ar: string;
}

export default function HadithPage() {
  const [hadiths, setHadiths] = useState<Hadith[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMuslim, setIsMuslim] = useState<boolean | null>(null);

  useEffect(() => {
    const init = async () => {
      // Check local storage for preference
      const pref = localStorage.getItem('is_muslim');
      if (pref !== null) {
        setIsMuslim(pref === 'true');
      }

      // Fetch random hadiths from a public API (using a placeholder array for this demo)
      // In a real app, you would fetch from a Bengali Hadith API
      const mockData: Hadith[] = [
        {
          id: 1,
          chapter_id: 1,
          book_id: 1,
          narrator: "উমার ইবনুল খাত্তাব (রাঃ)",
          ar: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
          bn: "নিশ্চয়ই সমস্ত কাজ নিয়তের উপর নির্ভরশীল।"
        },
        {
          id: 2,
          chapter_id: 1,
          book_id: 1,
          narrator: "আবূ হুরায়রা (রাঃ)",
          ar: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ",
          bn: "যে ব্যক্তি জ্ঞান অর্জনের জন্য কোনো পথ অবলম্বন করে, আল্লাহ তার জন্য জান্নাতের পথ সহজ করে দেন।"
        },
        {
          id: 3,
          chapter_id: 1,
          book_id: 1,
          narrator: "আনাস ইবনু মালিক (রাঃ)",
          ar: "طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ",
          bn: "জ্ঞান অন্বেষণ করা প্রত্যেক মুসলমানের উপর ফরজ।"
        }
      ];
      
      setHadiths(mockData);
      setLoading(false);
    };

    init();
  }, []);

  const handlePreference = (value: boolean) => {
    localStorage.setItem('is_muslim', value.toString());
    setIsMuslim(value);
  };

  if (isMuslim === null) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] p-6 text-center">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">☪️</span>
        </div>
        <h2 className="text-2xl font-extrabold text-white mb-3">Welcome to Hadith</h2>
        <p className="text-slate-400 text-sm mb-8 max-w-[250px] mx-auto">
          This section contains daily Islamic reminders. Would you like to enable it?
        </p>
        <div className="flex gap-4 w-full max-w-[300px]">
          <button
            onClick={() => handlePreference(false)}
            className="flex-1 py-3 bg-card-dark border border-border-dark text-slate-300 font-bold rounded-xl hover:bg-border-dark transition-colors"
          >
            No, Thanks
          </button>
          <button
            onClick={() => handlePreference(true)}
            className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
          >
            Yes, Enable
          </button>
        </div>
      </div>
    );
  }

  if (!isMuslim) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] p-6 text-center">
        <BookOpen className="w-16 h-16 text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Section Disabled</h2>
        <p className="text-slate-400 text-sm mb-6">You have chosen to hide the Hadith section.</p>
        <button
          onClick={() => handlePreference(true)}
          className="text-emerald-400 text-sm font-bold hover:underline"
        >
          Enable Hadith Section
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 pb-24">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-extrabold text-white mb-2 text-emerald-400">Daily Hadith</h1>
        <p className="text-slate-400 text-sm">Find peace and motivation in the words of the Prophet (ﷺ).</p>
      </div>

      <div className="space-y-6">
        {hadiths.map((hadith) => (
          <div key={hadith.id} className="bg-card-dark border border-border-dark rounded-3xl p-6 relative overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="text-xs font-bold text-emerald-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> {hadith.narrator} হতে বর্ণিত
              </div>
              
              <div className="text-right font-arabic text-2xl leading-loose text-slate-200 mb-6" dir="rtl">
                {hadith.ar}
              </div>
              
              <div className="text-sm leading-relaxed text-slate-300 font-medium border-t border-border-dark pt-4">
                {hadith.bn}
              </div>

              <div className="flex items-center justify-end gap-4 mt-6 pt-4 border-t border-border-dark/50">
                <button className="text-slate-500 hover:text-emerald-400 transition-colors">
                  <Heart className="w-5 h-5" />
                </button>
                <button className="text-slate-500 hover:text-emerald-400 transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
