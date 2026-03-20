'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Mail, Lock, User, Building, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function AuthPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [institution, setInstitution] = useState('');
  const [subject, setSubject] = useState('');

  const getPreviewId = (name: string) => {
    if (!name.trim()) return '??????';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash).toString(36).toUpperCase().padStart(6, '0').substring(0, 6);
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 1; // weak
    if (pass.length >= 6 && /[0-9]/.test(pass)) score = 2; // medium
    if (pass.length >= 8 && /[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) score = 3; // strong
    return score;
  };

  const passwordStrength = getPasswordStrength(password);
  const previewId = getPreviewId(fullName);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        window.location.replace('/');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || 'Student',
              ...(institution ? { institution } : {}),
              ...(subject ? { subject } : {}),
            },
          },
        });
        if (error) throw error;
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      }
    } catch (err: any) {
      if (err.message?.includes('Database error saving new user')) {
        setError('Database trigger failed. Please ensure you ran the SQL migration in Supabase.');
      } else {
        setError(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Logo / Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">StudyPath <span className="text-primary">AI</span></h1>
        <p className="text-slate-400 text-sm mt-2">&quot;তোমার syllabus, তোমার pace&quot;</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-card-dark border border-border-dark rounded-2xl p-1 mb-6">
        <button
          type="button"
          onClick={() => { setTab('login'); setError(null); }}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
            tab === 'login' 
              ? 'bg-primary text-white shadow-[0_4px_12px_rgba(98,100,244,0.3)]' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => { setTab('register'); setError(null); }}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
            tab === 'register' 
              ? 'bg-primary text-white shadow-[0_4px_12px_rgba(98,100,244,0.3)]' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Register
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleAuth} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-xl text-center">
            {error}
          </div>
        )}

        {tab === 'register' && (
          <>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                required
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-bg-dark border-[1.5px] border-border-dark rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/60 focus:ring-3 focus:ring-primary/10 transition-all"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Institution"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full bg-bg-dark border-[1.5px] border-border-dark rounded-xl pl-9 pr-3 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/60 focus:ring-3 focus:ring-primary/10 transition-all"
                />
              </div>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-bg-dark border-[1.5px] border-border-dark rounded-xl pl-9 pr-3 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/60 focus:ring-3 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>
          </>
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

        <div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-bg-dark border-[1.5px] border-border-dark rounded-xl pl-11 pr-12 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/60 focus:ring-3 focus:ring-primary/10 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {tab === 'register' && password.length > 0 && (
            <div className="mt-3 flex gap-1.5">
              <div className={`h-1.5 flex-1 rounded-full ${passwordStrength >= 1 ? 'bg-red-500' : 'bg-border-dark'}`} />
              <div className={`h-1.5 flex-1 rounded-full ${passwordStrength >= 2 ? 'bg-yellow-400' : 'bg-border-dark'}`} />
              <div className={`h-1.5 flex-1 rounded-full ${passwordStrength >= 3 ? 'bg-emerald-500' : 'bg-border-dark'}`} />
            </div>
          )}
        </div>

        {tab === 'login' && (
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs font-bold text-primary hover:text-violet-400 transition-colors">
              ভুলে গেছ?
            </Link>
          </div>
        )}

        {tab === 'register' && (
          <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 flex items-center justify-between mt-2">
            <span className="text-xs font-medium text-slate-400">Your Study ID</span>
            <span className="font-mono font-bold text-primary tracking-wider">
              SP-{previewId}
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 py-4 bg-gradient-to-r from-primary to-violet-500 text-white font-extrabold rounded-2xl shadow-[0_8px_20px_rgba(98,100,244,0.25)] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? 'Processing...' : tab === 'login' ? 'Login' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}
