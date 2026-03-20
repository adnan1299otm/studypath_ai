'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Topic } from '@/types';
import { ArrowRight, Clock, BarChart } from 'lucide-react';

function TopicsContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();
  const supabase = createClient();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchTopics = async () => {
      const { data } = await supabase
        .from('topics')
        .select('*')
        .eq('syllabus_id', id)
        .order('display_order');
      if (data) setTopics(data as Topic[]);
      setLoading(false);
    };
    fetchTopics();
  }, [id, supabase]);

  if (loading) return <div className="p-6 text-center text-slate-400">Loading topics...</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white mb-2">Extracted Topics</h1>
        <p className="text-slate-400 text-sm">Review the topics AI found. You can proceed to configure your roadmap.</p>
      </div>

      <div className="space-y-3 mb-24">
        {topics.map((topic) => (
          <div key={topic.id} className="bg-card-dark border border-border-dark rounded-2xl p-4 flex flex-col gap-3">
            <h3 className="text-white font-bold">{topic.name}</h3>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-4 h-4 text-primary" />
                {topic.estimated_hours} hours
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 capitalize">
                <BarChart className={`w-4 h-4 ${
                  topic.difficulty === 'hard' ? 'text-red-400' : 
                  topic.difficulty === 'medium' ? 'text-yellow-400' : 'text-emerald-400'
                }`} />
                {topic.difficulty}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-[80px] left-0 right-0 p-4 bg-gradient-to-t from-bg-dark via-bg-dark to-transparent z-10">
        <div className="max-w-[640px] mx-auto">
          <button
            onClick={() => router.push(`/configure?id=${id}`)}
            className="w-full py-4 bg-gradient-to-r from-primary to-violet-500 text-white font-extrabold rounded-2xl shadow-[0_8px_20px_rgba(98,100,244,0.25)] hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Configure Roadmap <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TopicsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-400">Loading...</div>}>
      <TopicsContent />
    </Suspense>
  );
}
