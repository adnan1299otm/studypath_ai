'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrainCircuit } from 'lucide-react';

function ProcessContent() {
  const searchParams = useSearchParams();
  const id = searchParams?.get('id');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      router.push('/upload');
      return;
    }

    const processSyllabus = async () => {
      try {
        const res = await fetch('/api/ai/extract-topics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ syllabusId: id })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to process');
        
        router.push(`/topics?id=${id}`);
      } catch (err: any) {
        setError(err.message);
      }
    };

    processSyllabus();
  }, [id, router]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] p-6 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Processing Failed</h2>
        <p className="text-red-400 text-sm mb-6">{error}</p>
        <button 
          onClick={() => router.push('/upload')}
          className="px-6 py-3 bg-card-dark border border-border-dark rounded-xl text-white font-bold"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-[70vh] p-6 text-center">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
        <div className="absolute inset-2 bg-primary/40 rounded-full animate-pulse" />
        <div className="absolute inset-4 bg-primary rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(98,100,244,0.6)]">
          <BrainCircuit className="w-8 h-8 text-white animate-bounce" />
        </div>
      </div>
      
      <h2 className="text-2xl font-extrabold text-white mb-3">AI is analyzing...</h2>
      <p className="text-slate-400 text-sm max-w-[250px] mx-auto leading-relaxed">
        Breaking down your syllabus into manageable topics and estimating study hours.
      </p>
    </div>
  );
}

export default function ProcessPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-400">Loading...</div>}>
      <ProcessContent />
    </Suspense>
  );
}
