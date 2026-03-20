'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks/use-profile';
import { Trophy, Medal, Flame, Zap, Award, Crown } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  full_name: string;
  avatar_emoji: string;
  xp: number;
  streak: number;
  score: number;
  rank: number;
}

interface Achievement {
  id: string;
  badge_name: string;
  unlocked_at: string;
}

export default function RankPage() {
  const { profile } = useProfile();
  const supabase = createClient();
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all profiles to calculate leaderboard
      // In a production app with millions of users, this would be a materialized view or RPC
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_emoji, xp, streak');

      if (profiles) {
        const calculated = profiles.map(p => ({
          ...p,
          score: (p.xp || 0) + ((p.streak || 0) * 45)
        })).sort((a, b) => b.score - a.score);

        const ranked = calculated.map((p, index) => ({
          ...p,
          rank: index + 1
        }));

        setLeaderboard(ranked.slice(0, 50)); // Top 50
        
        const userRank = ranked.find(p => p.id === user.id);
        if (userRank) setCurrentUserRank(userRank);
      }

      // Fetch achievements
      const { data: achData } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });

      if (achData) setAchievements(achData as Achievement[]);
      
      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-extrabold text-white mb-2">Leaderboard</h1>
        <p className="text-slate-400 text-sm">Compete with other students and earn badges.</p>
      </div>

      {/* Current User Stats Card */}
      {currentUserRank && (
        <div className="bg-gradient-to-br from-primary/20 to-violet-500/10 border border-primary/30 rounded-3xl p-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full -mr-10 -mt-10" />
          
          <div className="flex items-center justify-between relative z-10">
            <div>
              <div className="text-sm font-bold text-primary uppercase tracking-wider mb-1">Your Rank</div>
              <div className="text-4xl font-black text-white flex items-baseline gap-1">
                #{currentUserRank.rank}
                <span className="text-sm font-medium text-slate-400">of {leaderboard.length > 0 ? leaderboard[leaderboard.length - 1].rank : 1}</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Score</div>
              <div className="text-2xl font-black text-white">{currentUserRank.score}</div>
            </div>
          </div>
        </div>
      )}

      {/* Achievements Section */}
      <div className="mb-10">
        <h2 className="text-lg font-extrabold text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-400" /> Your Badges
        </h2>
        
        {achievements.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {achievements.map(ach => (
              <div key={ach.id} className="bg-card-dark border border-border-dark rounded-2xl p-4 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-yellow-400/10 rounded-full flex items-center justify-center mb-2 border border-yellow-400/20">
                  <Medal className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="text-xs font-bold text-white leading-tight">{ach.badge_name}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card-dark border border-border-dark border-dashed rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-sm text-slate-400 font-medium">Complete study sessions to earn badges!</p>
          </div>
        )}
      </div>

      {/* Leaderboard List */}
      <div>
        <h2 className="text-lg font-extrabold text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" /> Top Students
        </h2>
        
        <div className="space-y-3">
          {leaderboard.map((entry) => {
            const isCurrentUser = entry.id === profile?.id;
            
            return (
              <div 
                key={entry.id} 
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  isCurrentUser 
                    ? 'bg-primary/10 border-primary/50 shadow-[0_0_15px_rgba(98,100,244,0.15)]' 
                    : 'bg-card-dark border-border-dark'
                }`}
              >
                {/* Rank Number */}
                <div className={`w-8 font-black text-lg text-center ${
                  entry.rank === 1 ? 'text-yellow-400' :
                  entry.rank === 2 ? 'text-slate-300' :
                  entry.rank === 3 ? 'text-amber-600' :
                  'text-slate-500'
                }`}>
                  {entry.rank === 1 ? <Crown className="w-6 h-6 mx-auto" /> : `#${entry.rank}`}
                </div>
                
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-card-dark-2 border border-border-dark flex items-center justify-center text-lg shrink-0">
                  {entry.avatar_emoji || (entry.full_name ? entry.full_name[0].toUpperCase() : 'U')}
                </div>
                
                {/* Name & Stats */}
                <div className="flex-1 min-w-0">
                  <div className={`font-bold truncate ${isCurrentUser ? 'text-primary' : 'text-white'}`}>
                    {entry.full_name || 'Anonymous Student'}
                    {isCurrentUser && <span className="ml-2 text-[10px] bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-wider">You</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs font-medium">
                    <div className="flex items-center gap-1 text-slate-400">
                      <Zap className="w-3 h-3 text-yellow-400" /> {entry.xp}
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <Flame className="w-3 h-3 text-orange-400" /> {entry.streak}
                    </div>
                  </div>
                </div>
                
                {/* Score */}
                <div className="text-right shrink-0">
                  <div className="text-lg font-black text-white">{entry.score}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Score</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
