'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UploadCloud, FileText, ArrowRight } from 'lucide-react';

export default function UploadPage() {
  const [title, setTitle] = useState('');
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !rawText) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Free plan: max 1 active syllabus
      const { data: profileData } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()

      if (profileData?.plan !== 'pro') {
        const { count } = await supabase
          .from('syllabuses')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_active', true)

        if ((count ?? 0) >= 1) {
          alert('Free plan allows only 1 syllabus. Upgrade to PRO to create more. (/pro)')
          setLoading(false)
          return
        }
      }

      const { data, error } = await supabase
        .from('syllabuses')
        .insert({
          user_id: user.id,
          title,
          raw_text: rawText,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      
      router.push(`/process?id=${data.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to upload syllabus');
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white mb-2">Upload Syllabus</h1>
        <p className="text-slate-400 text-sm">Paste your syllabus text below and let AI break it down into a structured roadmap.</p>
      </div>

      <form onSubmit={handleUpload} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">Syllabus Title</label>
          <input
            type="text"
            required
            placeholder="e.g. HSC Physics 1st Paper"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-card-dark border-[1.5px] border-border-dark rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/60 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">Syllabus Content</label>
          <textarea
            required
            placeholder="Paste your syllabus topics, chapters, or learning objectives here..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={8}
            className="w-full bg-card-dark border-[1.5px] border-border-dark rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/60 transition-all resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !title || !rawText}
          className="w-full py-4 bg-gradient-to-r from-primary to-violet-500 text-white font-extrabold rounded-2xl shadow-[0_8px_20px_rgba(98,100,244,0.25)] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? 'Uploading...' : (
            <>
              Continue <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
