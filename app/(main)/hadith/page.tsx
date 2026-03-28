'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Copy, Share2, History, Check } from 'lucide-react';
import Link from 'next/link';

interface Hadith {
  text: string;
  source: string;
  narrator: string;
}

const hadiths: Hadith[] = [
  { text: "জ্ঞান অর্জন করা প্রত্যেক মুসলিমের জন্য ফরজ।", source: "ইবনে মাজাহ", narrator: "আনাস ইবনে মালিক (রা.)" },
  { text: "যে ব্যক্তি জ্ঞান অন্বেষণে পথ চলে, আল্লাহ তার জন্য জান্নাতের পথ সহজ করে দেন।", source: "মুসলিম", narrator: "আবু হুরায়রা (রা.)" },
  { text: "মুমিনের সর্বোত্তম সম্পদ হলো উত্তম চরিত্র।", source: "বুখারী", narrator: "আবু হুরায়রা (রা.)" },
  { text: "তোমাদের মধ্যে সে-ই সর্বোত্তম যে কুরআন শেখে এবং অপরকে শেখায়।", source: "বুখারী", narrator: "উসমান (রা.)" },
  { text: "সহজ করো, কঠিন করো না। সুসংবাদ দাও, বিমুখ করো না।", source: "বুখারী", narrator: "আনাস (রা.)" },
  { text: "যে ব্যক্তি আল্লাহর উপর ভরসা রাখে, আল্লাহ তার জন্য যথেষ্ট।", source: "তিরমিযী", narrator: "উমর (রা.)" },
  { text: "পরিষ্কার-পরিচ্ছন্নতা ঈমানের অর্ধেক।", source: "মুসলিম", narrator: "আবু মালিক আল-আশআরী (রা.)" },
];

export default function HadithPage() {
  const [isMuslim, setIsMuslim] = useState<boolean | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('is_muslim');
    if (stored !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsMuslim(stored === 'true');
    }
  }, []);

  const handleMuslim = (yes: boolean) => {
    localStorage.setItem('is_muslim', yes ? 'true' : 'false');
    setIsMuslim(yes);
  };

  const loadRandomHadith = () => {
    setIsLoading(true);
    setIsAnimating(true);
    
    setTimeout(() => {
      let newIdx = Math.floor(Math.random() * hadiths.length);
      while (newIdx === currentIdx) newIdx = Math.floor(Math.random() * hadiths.length);
      
      setHistory(prev => {
        if (!prev.includes(currentIdx)) {
          return [currentIdx, ...prev];
        }
        return prev;
      });
      setCurrentIdx(newIdx);
      setIsLoading(false);
      
      setTimeout(() => {
        setIsAnimating(false);
      }, 50);
    }, 400);
  };

  const copyHadith = () => {
    const h = hadiths[currentIdx];
    const text = `"${h.text}"\n— ${h.narrator} | ${h.source}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (isMuslim === null) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-hadith-card border border-hadith-border rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="text-5xl mb-4">☪️</div>
          <h2 className="text-xl font-extrabold text-white mb-2">আপনি কি মুসলিম?</h2>
          <p className="text-emerald-600/80 text-sm mb-8 leading-relaxed">হাদিস Section শুধুমাত্র মুসলিম শিক্ষার্থীদের জন্য।</p>
          <div className="flex gap-3">
            <button onClick={() => handleMuslim(false)} className="flex-1 py-3 border-2 border-hadith-border text-slate-400 font-bold rounded-xl hover:bg-white/5 transition-all">না</button>
            <button onClick={() => handleMuslim(true)} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/50">হ্যাঁ</button>
          </div>
        </div>
      </div>
    );
  }

  if (!isMuslim) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-card-dark border border-border-dark rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">🙏</div>
          <h2 className="text-lg font-extrabold text-white mb-2">এই section টি শুধু মুসলিমদের জন্য</h2>
          <p className="text-slate-400 text-sm mb-6">তুমি হাদিস page use করতে পারবে না।</p>
          <Link href="/roadmap" className="block w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all">Roadmap এ ফিরে যাও</Link>
        </div>
      </div>
    );
  }

  const currentHadith = hadiths[currentIdx];

  return (
    <div className="hadith-bg min-h-screen relative">
      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-900/20 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-emerald-800/10 blur-[80px] rounded-full"></div>
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#10b981 1px,transparent 1px)', backgroundSize: '36px 36px' }}></div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-10 pb-32 relative z-10">
        {/* Page title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-900/30 border border-emerald-700/30 px-4 py-1.5 rounded-full mb-4">
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">☪️ হাদিস Section</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">আজকের হাদিস</h1>
          <p className="text-emerald-700/80 text-sm">প্রতিটি মুসলিমের জন্য — সবসময় বিনামূল্যে</p>
        </div>

        {/* Decorative geometric */}
        <div className="flex justify-center mb-8 pointer-events-none select-none">
          <div className="relative w-24 h-24 opacity-20">
            <svg className="spin-slow w-full h-full" viewBox="0 0 100 100" fill="none">
              <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" stroke="#10b981" strokeWidth="1.5" fill="none"/>
              <circle cx="50" cy="50" r="20" stroke="#d4af37" strokeWidth="1" fill="none"/>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-2xl">☪️</div>
          </div>
        </div>

        {/* Hadith card */}
        <div 
          className={`bg-hadith-card border border-hadith-border rounded-2xl p-8 md:p-10 hadith-glow mb-6 relative overflow-hidden transition-all duration-400 ${isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0 fade-in'}`}
        >
          {/* decorative quote mark */}
          <div className="absolute top-4 left-6 text-emerald-900/40 text-8xl font-serif leading-none select-none pointer-events-none">&quot;</div>
          <div className="absolute bottom-4 right-6 text-emerald-900/40 text-8xl font-serif leading-none select-none pointer-events-none rotate-180">&quot;</div>

          <div className="relative z-10">
            {/* Hadith text */}
            <p className="text-xl md:text-2xl font-bold text-white leading-relaxed text-center mb-8 tracking-wide">
              {currentHadith.text}
            </p>

            {/* Source pills */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="bg-emerald-900/50 border border-emerald-700/40 text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-full">{currentHadith.source}</span>
              <span className="text-slate-600 text-xs">থেকে নেওয়া হয়েছে</span>
              <span className="bg-yellow-900/30 border border-yellow-700/30 text-yellow-400/80 text-xs font-bold px-3 py-1.5 rounded-full">{currentHadith.narrator}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 mb-10">
          <button 
            onClick={loadRandomHadith} 
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-emerald-700 hover:bg-emerald-600 active:scale-[0.98] text-white font-extrabold py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/40 group disabled:opacity-70"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            {isLoading ? 'লোড হচ্ছে...' : 'র্যান্ডম হাদিস দেখুন →'}
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={copyHadith} className={`flex items-center justify-center gap-2 py-3 bg-hadith-card border border-hadith-border hover:border-emerald-700/50 font-bold rounded-xl transition-all text-sm hover:bg-emerald-900/20 ${copied ? 'text-emerald-400' : 'text-slate-300'}`}>
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />} 
              {copied ? 'Copied!' : 'Copy করুন'}
            </button>
            <button className="flex items-center justify-center gap-2 py-3 bg-hadith-card border border-hadith-border hover:border-emerald-700/50 text-slate-300 font-bold rounded-xl transition-all text-sm hover:bg-emerald-900/20">
              <Share2 className="w-5 h-5" /> Share করুন
            </button>
          </div>
        </div>

        {/* Always free banner */}
        <div className="bg-emerald-950/60 border border-emerald-800/40 rounded-2xl p-5 flex items-center gap-4 mb-10">
          <div className="text-3xl flex-shrink-0">🔓</div>
          <div>
            <p className="font-extrabold text-emerald-300 text-sm mb-0.5">সবসময় FREE — কখনো Lock হবে না</p>
            <p className="text-emerald-700 text-xs leading-relaxed">এই section টি কোনো paid plan এর অন্তর্ভুক্ত নয়। প্রতিটি মুসলিম শিক্ষার্থীর জন্য সবসময় বিনামূল্যে।</p>
          </div>
        </div>

        {/* Previous hadiths */}
        {history.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <History className="w-4 h-4" /> আগের হাদিস
            </h3>
            <div className="flex flex-col gap-3">
              {history.map((idx, i) => {
                const h = hadiths[idx];
                return (
                  <div key={i} className="bg-hadith-card/60 border border-hadith-border/50 rounded-xl p-4 hover:border-emerald-800/60 transition-all cursor-pointer group">
                    <p className="text-sm text-slate-300 leading-relaxed mb-2 group-hover:text-white transition-colors">{h.text}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600 text-xs font-bold">{h.source}</span>
                      <span className="text-slate-700 text-xs">•</span>
                      <span className="text-slate-600 text-xs">{h.narrator}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
