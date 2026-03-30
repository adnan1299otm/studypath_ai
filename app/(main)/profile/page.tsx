'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks/use-profile';
import { User, LogOut, Zap, Flame, Heart, Crown, ChevronRight, Settings } from 'lucide-react';

export default function ProfilePage() {
  const { profile, loading } = useProfile();
  const router = useRouter();
  const supabase = createClient();
  const [loggingOut, setLoggingOut] = useState(false);
  const [syllabuses, setSyllabuses] = useState<any[]>([]);
  const [loadingSyllabuses, setLoadingSyllabuses] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchSyllabuses = async () => {
      if (!profile) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from('syllabuses')
        .select('id, title, is_active, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (data) {
        setSyllabuses(data);
      }
      setLoadingSyllabuses(false);
    };
    
    fetchSyllabuses();
  }, [profile, supabase]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  const copyStudyId = () => {
    if (profile?.study_id) {
      navigator.clipboard.writeText(profile.study_id);
      setToastMessage('Study ID copied!');
      setTimeout(() => setToastMessage(''), 2000);
    }
  };

  const handleSwitchSyllabus = async (id: string) => {
    if (profile?.plan !== 'pro') return;
    
    // Update all to inactive
    await supabase.from('syllabuses').update({ is_active: false }).eq('user_id', profile.id);
    // Update selected to active
    await supabase.from('syllabuses').update({ is_active: true }).eq('id', id);
    
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="p-6 pb-24">
      {/* Toast Message */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg z-50 animate-in fade-in slide-in-from-top-4">
          {toastMessage}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-extrabold text-white">Profile</h1>
        <button className="w-10 h-10 bg-card-dark border border-border-dark rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* User Info Card */}
      <div className="bg-card-dark border border-border-dark rounded-3xl p-6 mb-6 flex items-center gap-5 relative overflow-hidden">
        {profile.plan === 'pro' && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 blur-3xl rounded-full -mr-10 -mt-10" />
        )}
        
        <div className="w-20 h-20 bg-card-dark-2 border-2 border-border-dark rounded-full flex items-center justify-center text-3xl shrink-0 relative z-10">
          {profile.avatar_emoji || '👤'}
          {profile.plan === 'pro' && (
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center border-4 border-card-dark">
              <Crown className="w-4 h-4 text-bg-dark" />
            </div>
          )}
        </div>
        
        <div className="relative z-10">
          <h2 className="text-xl font-extrabold text-white mb-1">{profile.full_name || 'Student'}</h2>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
              profile.plan === 'pro' 
                ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30' 
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              {profile.plan === 'pro' ? 'PRO Plan' : 'Free Plan'}
            </span>
          </div>
          
          {/* Study ID */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Study ID:</span>
            <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 'bold', color: '#6264f4' }}>
              {profile.study_id}
            </span>
            <button 
              onClick={copyStudyId} 
              style={{ 
                background: 'rgba(255,255,255,0.1)', 
                border: 'none', 
                borderRadius: '4px', 
                padding: '2px 6px', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <span style={{ fontSize: '12px' }}>📋</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-card-dark border border-border-dark rounded-2xl p-4 flex flex-col items-center text-center">
          <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400 mb-2" />
          <div className="text-xl font-black text-white">{profile.xp}</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Total XP</div>
        </div>
        <div className="bg-card-dark border border-border-dark rounded-2xl p-4 flex flex-col items-center text-center">
          <Flame className="w-6 h-6 text-orange-400 fill-orange-400 mb-2" />
          <div className="text-xl font-black text-white">{profile.streak}</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Day Streak</div>
        </div>
        <div className="bg-card-dark border border-border-dark rounded-2xl p-4 flex flex-col items-center text-center">
          <Heart className="w-6 h-6 text-rose-500 fill-rose-500 mb-2" />
          <div className="text-xl font-black text-white">{profile.hearts}</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Hearts</div>
        </div>
      </div>

      {/* My Syllabuses Section */}
      <div className="mb-8">
        <h3 className="text-lg font-extrabold text-white mb-4">My Syllabuses 📚</h3>
        
        <div className="space-y-3">
          {loadingSyllabuses ? (
            <div className="text-slate-400 text-sm">Loading syllabuses...</div>
          ) : (
            syllabuses.map((syllabus) => (
              <div key={syllabus.id} className="bg-card-dark border border-border-dark rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-white text-sm">{syllabus.title}</h4>
                    {syllabus.is_active && (
                      <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 capitalize">
                    Status: {syllabus.status}
                  </div>
                </div>
                
                {!syllabus.is_active && profile?.plan === 'pro' && (
                  <button 
                    onClick={() => handleSwitchSyllabus(syllabus.id)}
                    className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                  >
                    Switch
                  </button>
                )}
              </div>
            ))
          )}
          
          <button
            onClick={() => router.push('/upload')}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px dashed rgba(98,100,244,0.3)',
              borderRadius: '12px',
              background: 'rgba(98,100,244,0.04)',
              color: '#6264f4',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer',
              marginTop: '8px',
            }}
          >
            + নতুন Syllabus যোগ করো
          </button>
          
          {profile?.plan !== 'pro' && syllabuses.length >= 1 && (
            <div className="text-center text-xs text-slate-500 mt-2">
              PRO plan এ unlimited syllabuses
            </div>
          )}
        </div>
      </div>

      {/* PRO Upgrade Banner */}
      {profile.plan !== 'pro' && (
        <button 
          onClick={() => router.push('/pro')}
          className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl p-1 mb-8 text-left hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-[0_8px_20px_rgba(250,204,21,0.25)]"
        >
          <div className="bg-bg-dark/20 backdrop-blur-sm rounded-[22px] p-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-5 h-5 text-white" />
                <h3 className="text-lg font-extrabold text-white">Upgrade to PRO</h3>
              </div>
              <p className="text-white/80 text-sm font-medium">Unlock all days & features for ৳150/mo</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <ChevronRight className="w-6 h-6 text-white" />
            </div>
          </div>
        </button>
      )}

      {/* Menu Options */}
      <div className="space-y-3">
        <button className="w-full bg-card-dark border border-border-dark rounded-2xl p-4 flex items-center justify-between hover:bg-border-dark transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-card-dark-2 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-slate-400" />
            </div>
            <span className="font-bold text-slate-200">Edit Profile</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500" />
        </button>
        
        <button 
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full bg-card-dark border border-border-dark rounded-2xl p-4 flex items-center justify-between hover:bg-rose-500/10 hover:border-rose-500/30 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-card-dark-2 group-hover:bg-rose-500/20 rounded-full flex items-center justify-center transition-colors">
              <LogOut className="w-5 h-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
            </div>
            <span className="font-bold text-slate-200 group-hover:text-rose-500 transition-colors">
              {loggingOut ? 'Logging out...' : 'Log Out'}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
