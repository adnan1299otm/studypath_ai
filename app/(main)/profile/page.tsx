'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks/use-profile';
import { User, LogOut, Zap, Flame, Heart, Crown, ChevronRight, Settings, Copy, Check } from 'lucide-react';

export default function ProfilePage() {
  const { profile, loading } = useProfile();
  const router = useRouter();
  const supabase = createClient();
  
  const [loggingOut, setLoggingOut] = useState(false);
  const [syllabuses, setSyllabuses] = useState<any[]>([]);
  const [loadingSyllabuses, setLoadingSyllabuses] = useState(true);
  
  const [toast, setToast] = useState('');
  
  // Sheets & Modals state
  const [showAvatarSheet, setShowAvatarSheet] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('');
  
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [editName, setEditName] = useState('');
  const [editInstitution, setEditInstitution] = useState('');
  const [editSubject, setEditSubject] = useState('');
  
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const copyId = () => {
    if (profile?.study_id) {
      navigator.clipboard.writeText(profile.study_id);
      showToast('Study ID copied!');
    }
  };

  const handleSwitchSyllabus = async (id: string) => {
    if (profile?.plan !== 'pro') return;
    
    await supabase.from('syllabuses').update({ is_active: false }).eq('user_id', profile.id);
    await supabase.from('syllabuses').update({ is_active: true }).eq('id', id);
    
    window.location.reload();
  };

  const openAvatarPicker = () => {
    setSelectedAvatar(profile?.avatar_emoji || '🎓');
    setShowAvatarSheet(true);
  };

  const saveAvatar = async () => {
    if (!profile) return;
    await supabase.from('profiles').update({ avatar_emoji: selectedAvatar }).eq('id', profile.id);
    setShowAvatarSheet(false);
    showToast('Avatar updated!');
    window.location.reload(); // Quick way to refresh profile data
  };

  const openEditSheet = () => {
    setEditName(profile?.full_name || '');
    setEditInstitution(profile?.institution || '');
    setEditSubject(profile?.subject || '');
    setShowEditSheet(true);
  };

  const saveProfileEdit = async () => {
    if (!profile) return;
    await supabase.from('profiles').update({
      full_name: editName,
      institution: editInstitution,
      subject: editSubject,
    }).eq('id', profile.id);
    setShowEditSheet(false);
    showToast('Profile updated!');
    window.location.reload();
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  const executeLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const canAddSyllabus = profile?.plan === 'pro' || syllabuses.length === 0;

  const achievements = [
    { emoji: '🌟', label: 'প্রথম দিন', unlocked: profile.xp >= 10 },
    { emoji: '🔥', label: '৩ দিন',    unlocked: profile.streak >= 3 },
    { emoji: '⚡', label: '৭ দিন',    unlocked: profile.streak >= 7 },
    { emoji: '💫', label: '১০০ XP',   unlocked: profile.xp >= 100 },
    { emoji: '🏆', label: '৫০০ XP',   unlocked: profile.xp >= 500 },
    { emoji: '👥', label: 'বন্ধু',    unlocked: false },
    { emoji: '🤖', label: 'AI বন্ধু', unlocked: true },
    { emoji: '⭐', label: 'Pro',       unlocked: profile.plan === 'pro' },
    { emoji: '👑', label: '৩০ দিন',   unlocked: profile.streak >= 30 },
    { emoji: '🎯', label: 'Perfect',   unlocked: false },
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const avatarOptions = ['🎓','🦁','🐯','🦊','🐼','🦋','🚀','⚡','🌙','🔥','🎯','🌿'];

  return (
    <div className="p-6 pb-24 min-h-screen bg-bg-dark">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .sheet-slide-up {
          animation: sheetIn 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards;
        }
        @keyframes sheetIn {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-primary text-white text-sm font-bold px-5 py-3 rounded-full shadow-lg shadow-primary/30 whitespace-nowrap">
          {toast}
        </div>
      )}

      {/* 1. PROFILE HERO CARD */}
      <div className="relative bg-gradient-to-br from-[#1a1a2e] to-[#13131f] border border-border-dark rounded-3xl p-5 mb-6 overflow-hidden" style={{ animation: 'fadeUp 0.35s ease forwards' }}>
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 blur-[60px] rounded-full pointer-events-none" />
        
        <button onClick={openEditSheet} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          <Settings className="w-5 h-5" />
        </button>

        <div className="flex gap-4 items-center mb-6 relative z-10">
          <button onClick={openAvatarPicker} className="relative w-20 h-20 rounded-2xl bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-4xl shrink-0">
            {profile.avatar_emoji || '🎓'}
            <div className="absolute -bottom-2 -right-2 bg-primary rounded-lg w-6 h-6 flex items-center justify-center border-2 border-[#13131f]">
              <Settings className="w-3 h-3 text-white" />
            </div>
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-extrabold text-white truncate">{profile.full_name || 'Student'}</h2>
              {profile.plan === 'pro' ? (
                <span className="shrink-0 bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                  ⭐ PRO
                </span>
              ) : (
                <span className="shrink-0 bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  Free
                </span>
              )}
            </div>
            
            <div className="text-sm text-slate-500 mb-2 truncate">
              {profile.institution || 'No Institution'} · {profile.subject || 'No Subject'}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                {profile.study_id}
              </span>
              <button onClick={copyId} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-white">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* XP Level bar */}
        <div className="relative z-10">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-extrabold text-white">Level {profile.level}</span>
            <span className="text-sm font-extrabold text-primary">{profile.xp} XP</span>
          </div>
          <div className="h-2.5 bg-bg-dark rounded-full overflow-hidden mb-1.5">
            <div 
              className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full"
              style={{ width: `${(profile.xp % 200) / 200 * 100}%` }}
            />
          </div>
          <div className="text-[10px] font-bold text-slate-500 text-right">
            {200 - (profile.xp % 200)} XP more → Level {profile.level + 1}
          </div>
        </div>
      </div>

      {/* 2. STATS GRID */}
      <div className="grid grid-cols-4 gap-2 mb-6" style={{ animation: 'fadeUp 0.35s ease 0.05s forwards', opacity: 0 }}>
        <div className="bg-card-dark border border-border-dark rounded-2xl p-3 flex flex-col items-center text-center">
          <div className="text-lg font-black text-white mb-1">🔥 {profile.streak}</div>
          <div className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Streak</div>
        </div>
        <div className="bg-card-dark border border-border-dark rounded-2xl p-3 flex flex-col items-center text-center">
          <div className="text-lg font-black text-white mb-1">⚡ {profile.xp}</div>
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">XP</div>
        </div>
        <div className="bg-card-dark border border-border-dark rounded-2xl p-3 flex flex-col items-center text-center">
          <div className="text-lg font-black text-white mb-1">👥 0</div>
          <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Friends</div>
        </div>
        <div className="bg-card-dark border border-border-dark rounded-2xl p-3 flex flex-col items-center text-center">
          <div className="text-lg font-black text-white mb-1">🏅 0</div>
          <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">Badges</div>
        </div>
      </div>

      {/* 3. MY SYLLABUSES CARD */}
      <div className="bg-card-dark border border-border-dark rounded-3xl p-5 mb-6" style={{ animation: 'fadeUp 0.35s ease 0.1s forwards', opacity: 0 }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold text-white">My Syllabuses 📚</h3>
          {profile.plan === 'pro' ? (
            <span className="bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
              ⭐ PRO · Unlimited
            </span>
          ) : (
            <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
              Free · 1 syllabus
            </span>
          )}
        </div>

        <div className="space-y-3 mb-4">
          {loadingSyllabuses ? (
            <div className="text-slate-400 text-sm text-center py-4">Loading syllabuses...</div>
          ) : (
            syllabuses.map((syllabus) => (
              <div 
                key={syllabus.id} 
                className={`rounded-2xl p-3 flex items-center justify-between transition-colors ${
                  syllabus.is_active 
                    ? 'border border-primary/50 bg-primary/5' 
                    : 'border border-border-dark hover:border-slate-600 bg-bg-dark'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                    syllabus.is_active ? 'bg-primary/20' : 'bg-card-dark'
                  }`}>
                    📄
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm mb-0.5">{syllabus.title}</h4>
                    {syllabus.is_active ? (
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Active</span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider capitalize">{syllabus.status}</span>
                    )}
                  </div>
                </div>
                
                {!syllabus.is_active && profile?.plan === 'pro' && (
                  <button 
                    onClick={() => handleSwitchSyllabus(syllabus.id)}
                    className="bg-card-dark text-white hover:bg-white/10 border border-border-dark px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                  >
                    Switch
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {canAddSyllabus ? (
          <button onClick={() => router.push('/upload')}
            className="w-full p-3 border-2 border-dashed border-primary/30 rounded-xl bg-primary/4 text-primary font-extrabold text-sm flex items-center justify-center gap-2 hover:border-primary/50 transition-all">
            + নতুন Syllabus যোগ করো
          </button>
        ) : (
          <button onClick={() => router.push('/pro')}
            className="w-full p-3 border-2 border-dashed border-border-dark rounded-xl bg-card-dark text-slate-500 font-extrabold text-sm flex items-center justify-center gap-2 hover:border-yellow-400/30 hover:text-yellow-400 transition-all group">
            <span>🔒</span>
            <span>নতুন Syllabus যোগ করো</span>
            <span className="text-[10px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-1.5 py-0.5 rounded font-bold group-hover:bg-yellow-400/20 transition-all">PRO</span>
          </button>
        )}
      </div>

      {/* 4. ACHIEVEMENTS SECTION */}
      <div className="mb-6" style={{ animation: 'fadeUp 0.35s ease 0.15s forwards', opacity: 0 }}>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-lg font-extrabold text-white">🏅 Achievements</h3>
          <span className="text-xs font-bold text-slate-500">{unlockedCount} / 10 unlocked</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {achievements.map((ach, idx) => (
            <div 
              key={idx} 
              className={`border rounded-xl p-2 flex flex-col items-center gap-1 transition-transform ${
                ach.unlocked 
                  ? ach.label === 'Pro' 
                    ? 'bg-primary/10 border-primary/20 hover:scale-105' 
                    : 'bg-bg-dark border-border-dark hover:scale-105'
                  : 'bg-bg-dark border-border-dark grayscale opacity-35'
              }`}
            >
              <div className="text-2xl mb-1">{ach.emoji}</div>
              <div className="text-[9px] font-bold text-center text-slate-300 leading-tight">{ach.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. SETTINGS CARD */}
      <div className="bg-card-dark border border-border-dark rounded-3xl mb-6 overflow-hidden" style={{ animation: 'fadeUp 0.35s ease 0.2s forwards', opacity: 0 }}>
        <div className="px-5 py-4 border-b border-border-dark">
          <h3 className="text-lg font-extrabold text-white">⚙️ Settings</h3>
        </div>
        <div className="divide-y divide-border-dark">
          <button onClick={() => router.push('/timer')} className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-colors">
            <span className="font-bold text-slate-300 text-sm">🎨 Timer Theme</span>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
          <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-colors">
            <span className="font-bold text-slate-300 text-sm">🔔 Notifications</span>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
          <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-colors">
            <span className="font-bold text-slate-300 text-sm">🔒 Password পরিবর্তন</span>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* 6. PRO STATUS SECTION */}
      <div className="mb-6" style={{ animation: 'fadeUp 0.35s ease 0.25s forwards', opacity: 0 }}>
        {profile.plan === 'pro' ? (
          <div className="bg-gradient-to-r from-yellow-400/10 to-orange-500/10 border border-yellow-400/30 rounded-3xl p-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-extrabold text-yellow-400">PRO Active</h3>
              </div>
              <p className="text-slate-400 text-xs font-medium">
                Expires: {profile.pro_expires_at ? new Date(profile.pro_expires_at).toLocaleDateString() : 'Never'}
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-400/20 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
        ) : (
          <button 
            onClick={() => router.push('/pro')}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl p-1 text-left hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-[0_8px_20px_rgba(250,204,21,0.25)]"
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
      </div>

      {/* 7. LOGOUT BUTTON */}
      <div className="bg-card-dark border border-border-dark rounded-2xl overflow-hidden" style={{ animation: 'fadeUp 0.35s ease 0.3s forwards', opacity: 0 }}>
        <button 
          onClick={confirmLogout}
          className="w-full flex items-center justify-center gap-2 p-4 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5 text-rose-500" />
          <span className="font-extrabold text-rose-500 text-sm">Logout</span>
        </button>
      </div>

      {/* SHEETS & MODALS */}
      
      {/* Avatar Picker Sheet */}
      {showAvatarSheet && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAvatarSheet(false)} />
          <div className="relative bg-card-dark border-t border-border-dark rounded-t-3xl p-6 sheet-slide-up">
            <h3 className="text-xl font-extrabold text-white mb-6 text-center">Avatar সিলেক্ট করো</h3>
            <div className="grid grid-cols-6 gap-4 mb-8">
              {avatarOptions.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setSelectedAvatar(emoji)}
                  className={`text-3xl w-12 h-12 flex items-center justify-center rounded-full transition-all ${
                    selectedAvatar === emoji ? 'ring-2 ring-primary bg-primary/15 scale-110' : 'hover:bg-white/5'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <button onClick={saveAvatar} className="w-full bg-primary text-white font-extrabold py-3.5 rounded-xl hover:bg-primary/90 transition-colors">
              Save Avatar
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Sheet */}
      {showEditSheet && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditSheet(false)} />
          <div className="relative bg-card-dark border-t border-border-dark rounded-t-3xl p-6 sheet-slide-up">
            <h3 className="text-xl font-extrabold text-white mb-6 text-center">Profile Edit</h3>
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 ml-1">Full Name</label>
                <input 
                  type="text" 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-bg-dark border-[1.5px] border-border-dark rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/60 transition-all"
                  placeholder="Your Name"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 ml-1">Institution</label>
                <input 
                  type="text" 
                  value={editInstitution} 
                  onChange={e => setEditInstitution(e.target.value)}
                  className="w-full bg-bg-dark border-[1.5px] border-border-dark rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/60 transition-all"
                  placeholder="College/University"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 ml-1">Subject/Group</label>
                <input 
                  type="text" 
                  value={editSubject} 
                  onChange={e => setEditSubject(e.target.value)}
                  className="w-full bg-bg-dark border-[1.5px] border-border-dark rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/60 transition-all"
                  placeholder="Science, Arts, etc."
                />
              </div>
            </div>
            <button onClick={saveProfileEdit} className="w-full bg-primary text-white font-extrabold py-3.5 rounded-xl hover:bg-primary/90 transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !loggingOut && setShowLogoutConfirm(false)} />
          <div className="relative bg-card-dark border border-border-dark rounded-3xl p-6 w-full max-w-sm text-center animate-in zoom-in-95 duration-200">
            <div className="text-5xl mb-4">👋</div>
            <h3 className="text-xl font-extrabold text-white mb-2">Logout করবে?</h3>
            <p className="text-sm text-slate-400 mb-6">Are you sure you want to log out of your account?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
                className="flex-1 bg-bg-dark border border-border-dark text-white font-extrabold py-3 rounded-xl hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeLogout}
                disabled={loggingOut}
                className="flex-1 bg-rose-500 text-white font-extrabold py-3 rounded-xl hover:bg-rose-600 transition-colors flex items-center justify-center"
              >
                {loggingOut ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
