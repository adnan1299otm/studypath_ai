'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProfile } from '@/hooks/use-profile';
import { Flame, Zap, Heart } from 'lucide-react';

export default function Header() {
  const { profile } = useProfile();
  const pathname = usePathname();

  if (pathname === '/configure') {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-bg-dark/95 backdrop-blur-md border-b border-border-dark px-4 py-3 flex items-center justify-between">
      <Link href="/roadmap" className="font-extrabold text-xl text-white tracking-tight">
        StudyPath <span className="text-primary">AI</span>
      </Link>
      
      <div className="flex items-center gap-2">
        {/* Streak */}
        <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 px-2 py-1 rounded-full">
          <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
          <span className="text-orange-400 font-black text-sm">{profile?.streak || 0}</span>
        </div>
        
        {/* XP */}
        <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded-full">
          <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-yellow-400 font-black text-sm">{profile?.xp || 0}</span>
        </div>
        
        {/* Hearts */}
        <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-full">
          <Heart className="w-4 h-4 text-red-400 fill-red-400" />
          <span className="text-red-400 font-black text-sm">{profile?.hearts ?? 5}</span>
        </div>
        
        {/* Avatar */}
        <Link 
          href="/profile" 
          className="ml-1 w-9 h-9 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-xl overflow-hidden"
        >
          {profile?.avatar_emoji ? (
            <span>{profile.avatar_emoji}</span>
          ) : (
            <span className="text-primary font-bold text-sm">
              {profile?.full_name ? profile.full_name[0].toUpperCase() : 'U'}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
