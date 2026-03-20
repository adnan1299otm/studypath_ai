'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const router = useRouter();
  const supabase = createClient();
  
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || otp.length !== 6) return;
    
    setVerifying(true);
    setError(null);
    setMessage(null);
    
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup',
      });
      
      if (error) throw error;
      
      // Redirect based on User Flow Document rules
      // Typically newly registered users go to /upload or /roadmap
      window.location.href = '/';
    } catch (err: any) {
      setError('ভুল কোড, আবার চেষ্টা করো');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setMessage(null);
    setError(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      if (error) throw error;
      setMessage('Verification code resent successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full bg-card-dark border border-border-dark rounded-3xl p-8 text-center shadow-2xl">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
        <span className="text-4xl">✉️</span>
      </div>
      
      <h2 className="text-2xl font-extrabold text-white mb-3">Check your email</h2>
      <p className="text-slate-400 text-sm mb-8 leading-relaxed">
        We&apos;ve sent a 6-digit verification code to <br/>
        <span className="text-primary font-bold">{email || 'your email'}</span>
      </p>

      {error && (
        <div className="mb-6 text-sm font-medium text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/20">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-6 text-sm font-medium text-emerald-400 bg-emerald-400/10 p-3 rounded-xl border border-emerald-400/20">
          {message}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4 mb-6">
        <input
          type="text"
          maxLength={6}
          required
          placeholder="6-digit code"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          className="w-full bg-bg-dark border-[1.5px] border-border-dark rounded-xl px-4 py-4 text-center text-2xl tracking-[0.5em] font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/60 focus:ring-3 focus:ring-primary/10 transition-all"
        />
        
        <button
          type="submit"
          disabled={verifying || otp.length !== 6}
          className="w-full py-4 bg-gradient-to-r from-primary to-violet-500 text-white font-extrabold rounded-2xl shadow-[0_8px_20px_rgba(98,100,244,0.25)] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
        >
          {verifying ? 'Verifying...' : 'Verify Email'}
        </button>
      </form>

      <div className="space-y-3">
        <button
          onClick={handleResend}
          disabled={resending}
          className="w-full py-4 bg-transparent border-2 border-border-dark text-slate-300 font-bold rounded-2xl hover:bg-border-dark/50 active:scale-95 transition-all disabled:opacity-50"
        >
          {resending ? 'Sending...' : 'আবার পাঠাও'}
        </button>
        <button
          onClick={() => router.push('/auth')}
          className="w-full py-3 text-sm text-slate-400 hover:text-white transition-colors"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center text-slate-400">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
