'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Password reset link sent to your email.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to send reset link.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Link href="/auth" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to Login
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Reset Password</h1>
        <p className="text-slate-400 text-sm">Enter your email to receive a reset link.</p>
      </div>

      <form onSubmit={handleReset} className="space-y-4">
        {message && (
          <div className={`p-3 rounded-xl text-sm text-center border ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
              : 'bg-red-500/10 border-red-500/50 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="email"
            required
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-bg-dark border-[1.5px] border-border-dark rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/60 focus:ring-3 focus:ring-primary/10 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 py-4 bg-gradient-to-r from-primary to-violet-500 text-white font-extrabold rounded-2xl shadow-[0_8px_20px_rgba(98,100,244,0.25)] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
    </div>
  );
}
