'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks/use-profile';
import { 
  Trophy, 
  Flame, 
  Zap, 
  Medal, 
  Search, 
  UserPlus, 
  X, 
  Check, 
  Hand, 
  Loader2,
  Crown,
  Share2,
  ArrowRight
} from 'lucide-react';
import { Profile } from '@/types';

interface LeaderboardUser extends Profile {
  score: number;
}

export default function RankPage() {
  const { profile, loading: profileLoading } = useProfile();
  const supabase = useMemo(() => createClient(), []);

  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nudgedToday, setNudgedToday] = useState<string[]>([]);
  
  // Add Friend Bottom Sheet
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [studyIdInput, setStudyIdInput] = useState('');
  const [searchResult, setSearchResult] = useState<Profile | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRankings = async () => {
    if (!profile) return;
    setLoading(true);

    try {
      // 1. Get accepted friendships
      const { data: friendships } = await supabase
        .from('friendships')
        .select('sender_id, receiver_id')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`);

      const friendIds = friendships?.map(f => 
        f.sender_id === profile.id ? f.receiver_id : f.sender_id
      ) || [];

      // 2. Fetch profiles for friends + self
      const allIds = [profile.id, ...friendIds];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', allIds);

      if (profiles) {
        // 3. Calculate scores
        const ranked: LeaderboardUser[] = profiles.map(p => ({
          ...p,
          score: p.xp + (p.streak * 45)
        }));

        // 4. Sort by score
        ranked.sort((a, b) => b.score - a.score);
        setLeaderboard(ranked);
      }

      // 5. Get pending requests (incoming)
      const { data: requests } = await supabase
        .from('friendships')
        .select(`
          id,
          sender_id,
          profiles:sender_id (
            id,
            full_name,
            study_id,
            avatar_emoji,
            institution
          )
        `)
        .eq('receiver_id', profile.id)
        .eq('status', 'pending');

      setPendingRequests(requests || []);

      // 6. Get today's nudges
      const today = new Date().toISOString().split('T')[0];
      const { data: todayNudges } = await supabase
        .from('nudges')
        .select('receiver_id')
        .eq('sender_id', profile.id)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      setNudgedToday(todayNudges?.map(n => n.receiver_id) || []);

    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchRankings();
    }
  }, [profile]);

  // Handle Search in bottom sheet
  useEffect(() => {
    const searchUser = async () => {
      if (studyIdInput.length !== 6) {
        setSearchResult(null);
        setSearchError(null);
        return;
      }

      setSearchLoading(true);
      setSearchError(null);
      const formattedId = `SP-${studyIdInput.toUpperCase()}`;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('study_id', formattedId)
          .maybeSingle();

        if (error || !data) {
          setSearchError('User not found');
          setSearchResult(null);
        } else if (data.id === profile?.id) {
          setSearchError('নিজেকে add করা যাবে না');
          setSearchResult(null);
        } else {
          setSearchResult(data as Profile);
        }
      } catch (error) {
        setSearchError('Error searching user');
      } finally {
        setSearchLoading(false);
      }
    };

    const debounce = setTimeout(searchUser, 400);
    return () => clearTimeout(debounce);
  }, [studyIdInput, profile, supabase]);

  const sendFriendRequest = async () => {
    if (!searchResult) return;
    setActionLoading('sending');
    try {
      const res = await fetch('/api/friends/send-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ study_id: searchResult.study_id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setShowAddSheet(false);
      setStudyIdInput('');
      setSearchResult(null);
      alert('Friend request পাঠানো হয়েছে!');
    } catch (err: any) {
      setSearchError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const respondToRequest = async (friendshipId: string, action: 'accept' | 'decline') => {
    setActionLoading(friendshipId);
    try {
      const res = await fetch('/api/friends/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendship_id: friendshipId, action })
      });
      if (!res.ok) throw new Error('Action failed');
      
      // Update local state
      setPendingRequests(prev => prev.filter(r => r.id !== friendshipId));
      fetchRankings();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleNudge = async (receiverId: string) => {
    if (nudgedToday.includes(receiverId)) return;
    setActionLoading(`nudge-${receiverId}`);
    try {
      const res = await fetch('/api/friends/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiver_id: receiverId })
      });
      if (!res.ok) throw new Error('Nudge failed');

      setNudgedToday(prev => [...prev, receiverId]);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const getRankStyles = (index: number) => {
    if (index === 0) return {
      container: 'bg-[rgba(255,215,0,0.08)] border-yellow-500/40',
      icon: <span className="text-2xl">🥇</span>,
      score: 'text-yellow-400'
    };
    if (index === 1) return {
      container: 'bg-[rgba(192,192,192,0.08)] border-slate-400/40',
      icon: <span className="text-2xl">🥈</span>,
      score: 'text-slate-300'
    };
    if (index === 2) return {
      container: 'bg-[rgba(205,127,50,0.08)] border-amber-600/40',
      icon: <span className="text-2xl">🥉</span>,
      score: 'text-amber-600'
    };
    return {
      container: 'bg-card-dark border-border-dark',
      icon: <span className="text-sm font-bold text-slate-500 w-6 text-center">{index + 1}</span>,
      score: 'text-slate-400'
    };
  };

  if (profileLoading || (loading && leaderboard.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Rankings লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            Rank <Trophy className="w-6 h-6 text-yellow-400" />
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">বন্ধুদের সাথে লড়াই</p>
        </div>
        {leaderboard.length > 0 && (
          <div className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-xs font-bold">
            {leaderboard.length} Friends
          </div>
        )}
      </div>

      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            Pending Requests <span className="w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{pendingRequests.length}</span>
          </h2>
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div key={req.id} className="bg-card-dark border border-border-dark rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-card-dark-2 border border-border-dark flex items-center justify-center text-xl shadow-inner">
                    {req.profiles.avatar_emoji || '🎓'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">{req.profiles.full_name}</p>
                    <p className="text-[10px] font-mono text-primary uppercase">{req.profiles.study_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => respondToRequest(req.id, 'decline')}
                    disabled={!!actionLoading}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => respondToRequest(req.id, 'accept')}
                    disabled={!!actionLoading}
                    className="h-9 px-4 rounded-xl flex items-center justify-center bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all font-bold text-xs gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" /> Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Friend Button */}
      <button 
        onClick={() => setShowAddSheet(true)}
        className="w-full py-5 border-2 border-dashed border-border-dark hover:border-primary/40 hover:bg-primary/5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all mb-8 group"
      >
        <div className="w-10 h-10 rounded-full bg-border-dark group-hover:bg-primary/20 flex items-center justify-center transition-colors">
          <UserPlus className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
        </div>
        <p className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors">বন্ধু যোগ করো</p>
        <p className="text-[10px] text-slate-600 font-medium">Study ID দিয়ে search করো</p>
      </button>

      {/* Leaderboard List */}
      {leaderboard.length <= 1 ? (
        <div className="text-center py-12 px-6">
          <div className="w-16 h-16 bg-card-dark rounded-3xl mx-auto flex items-center justify-center mb-4 border border-border-dark">
            <Share2 className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-white font-bold mb-1">কোনো বন্ধু নেই!</h3>
          <p className="text-slate-500 text-xs mb-6 max-w-[200px] mx-auto">Study ID দিয়ে বন্ধুদের খুঁজে নাও এবং একসাথে লড়াই করো।</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((user, index) => {
            const isMe = user.id === profile?.id;
            const styles = getRankStyles(index);
            const isNudged = nudgedToday.includes(user.id);
            const isNudging = actionLoading === `nudge-${user.id}`;

            return (
              <div 
                key={user.id} 
                className={`border rounded-3xl p-4 flex items-center justify-between relative transition-all duration-300 ${
                  isMe ? 'bg-primary/8 border-primary/30 border-2' : styles.container
                }`}
              >
                {/* Ranking Icon/Number */}
                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                  <div className="flex-shrink-0 flex items-center justify-center">
                    {styles.icon}
                  </div>

                  {/* Avatar with Online Dot */}
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-full bg-card-dark-2 border border-border-dark flex items-center justify-center text-xl shadow-lg">
                      {user.avatar_emoji || '🎓'}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0B0B0F] shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                  </div>

                  {/* User Info */}
                  <div className="overflow-hidden min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className={`text-sm font-extrabold truncate ${isMe ? 'text-primary' : 'text-white'}`}>
                        {user.full_name}
                      </p>
                      {user.plan === 'pro' && (
                        <div className="text-[10px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5 shrink-0">
                          <Crown className="w-2 h-2" /> PRO
                        </div>
                      )}
                      {isMe && (
                        <span className="text-[9px] font-black bg-primary/20 text-primary px-1.5 py-0.5 rounded-md uppercase tracking-widest shrink-0">তুমি</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                       <p className="text-[9px] font-mono font-bold text-primary tracking-wider">{user.study_id}</p>
                       {user.institution && (
                        <>
                          <span className="text-slate-700 text-[10px]">•</span>
                          <p className="text-[10px] text-slate-500 truncate">{user.institution}</p>
                        </>
                       )}
                    </div>
                  </div>
                </div>

                {/* Score & Actions */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className={`text-lg font-black leading-none ${isMe ? 'text-primary' : styles.score}`}>
                      {user.score.toLocaleString()}
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
                      <span className="text-[10px] font-black text-slate-400">{user.streak}</span>
                    </div>
                  </div>

                  {!isMe && (
                    <button 
                      onClick={() => handleNudge(user.id)}
                      disabled={isNudged || isNudging}
                      className={`h-11 px-3 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all outline-none ${
                        isNudged 
                          ? 'bg-slate-500/10 text-slate-500 border border-slate-500/20 cursor-default'
                          : 'bg-primary/10 text-primary border border-primary/20 active:scale-95'
                      }`}
                    >
                      {isNudging ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Zap className={`w-4 h-4 ${isNudged ? 'opacity-50' : 'fill-primary'}`} />
                          <span className="text-[8px] font-bold uppercase tracking-widest leading-none">
                            {isNudged ? 'Nudged ✓' : 'Nudge'}
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Friend Bottom Sheet */}
      {showAddSheet && (
        <>
          <div 
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => {
              if (actionLoading) return;
              setShowAddSheet(false);
              setStudyIdInput('');
              setSearchResult(null);
              setSearchError(null);
            }}
          />
          <div 
            className="fixed bottom-0 left-0 right-0 z-[110] max-w-lg mx-auto overflow-hidden animate-in slide-in-from-bottom-full duration-500 cubic-bezier(0.32, 0.72, 0, 1)"
            style={{ animationName: 'sheetIn', animationDuration: '0.4s' }}
          >
            <div className="bg-card-dark border-t border-border-dark rounded-t-[32px] p-6 pb-12 shadow-2xl">
              <div className="w-10 h-1.5 bg-border-dark rounded-full mx-auto mb-8" />
              
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-white">বন্ধু যোগ করো</h3>
                <button 
                  onClick={() => setShowAddSheet(false)}
                  className="w-10 h-10 rounded-full bg-border-dark flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Study ID Input */}
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Study ID দিয়ে খুঁজে নাও</p>
                <div className={`relative flex items-center bg-bg-dark border rounded-2xl pl-4 h-16 group transition-all ${
                  searchError ? 'border-red-500/50 animate-[shake_0.4s_ease-in-out]' : 'border-border-dark focus-within:border-primary/50'
                }`}>
                  <span className="text-primary font-black text-lg tracking-widest select-none">SP-</span>
                  <input 
                    autoFocus
                    type="text"
                    maxLength={6}
                    value={studyIdInput}
                    onChange={(e) => setStudyIdInput(e.target.value.toUpperCase())}
                    placeholder="A1B2C3"
                    className="flex-1 bg-transparent border-none outline-none text-xl font-black text-white placeholder:text-slate-800 tracking-widest pl-1 h-full"
                  />
                  <div className="pr-4">
                    {searchLoading ? (
                      <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
                    ) : (
                      <Search className={`w-5 h-5 transition-colors ${studyIdInput.length === 6 ? 'text-primary' : 'text-slate-800'}`} />
                    )}
                  </div>
                </div>
                {searchError && (
                  <p className="text-red-500 text-[10px] font-bold mt-2 ml-1 animate-in fade-in slide-in-from-top-1">
                    {searchError}
                  </p>
                )}
              </div>

              {/* Search Result Card */}
              <div className="min-h-[140px] flex items-center justify-center mb-6">
                {searchResult ? (
                  <div className="w-full p-4 bg-card-dark-2 border border-border-dark rounded-3xl animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-14 h-14 rounded-3xl bg-card-dark border border-border-dark flex items-center justify-center text-2xl shadow-inner">
                        {searchResult.avatar_emoji || '🎓'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-extrabold text-white">{searchResult.full_name}</p>
                          {searchResult.plan === 'pro' && (
                            <div className="text-[10px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-1.5 py-0.5 rounded-full font-bold">
                              ⭐ PRO
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-mono text-primary font-bold uppercase tracking-widest">{searchResult.study_id}</p>
                        {searchResult.institution && (
                          <p className="text-[10px] text-slate-500 mt-0.5">{searchResult.institution}</p>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={sendFriendRequest}
                      disabled={!!actionLoading}
                      className="w-full py-4 bg-primary text-white font-black rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      {actionLoading === 'sending' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5" /> Friend Request পাঠাও
                        </>
                      )}
                    </button>
                  </div>
                ) : !searchLoading && !searchError && studyIdInput.length > 0 ? (
                  <div className="text-center opacity-50 grayscale flex flex-col items-center">
                    <Search className="w-8 h-8 text-slate-600 mb-2" />
                    <p className="text-xs text-slate-500 font-medium">আইডি টাইপ করে খুঁজে নাও</p>
                  </div>
                ) : null}
              </div>

              <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                   <Medal className="w-4 h-4" />
                 </div>
                 <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                   বন্ধুদের সাথে ranking লড়লে প্রতিদিন <span className="text-yellow-400 font-black">+৫০ XP</span> বোনাস পাওয়া যায়!
                 </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Global CSS for animations */}
      <style jsx global>{`
        @keyframes sheetIn {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
