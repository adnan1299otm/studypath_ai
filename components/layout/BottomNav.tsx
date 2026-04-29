'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, Trophy, Brain, User, BookOpen } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

<<<<<<< HEAD
  if (pathname === '/configure' || pathname === '/timer' || pathname === '/creating-roadmap') {
=======
  if (pathname === '/configure' || pathname === '/timer') {
>>>>>>> e778abf694b250563359473f2a170eba7bc0f202
    return null;
  }

  const isHadith = pathname === '/hadith';

  const tabs = [
    { name: 'Roadmap', href: '/roadmap', icon: Map, activeColor: 'text-white' },
    { name: 'Rank', href: '/rank', icon: Trophy, activeColor: 'text-white' },
    { name: 'AI', href: '/ai', icon: Brain, activeColor: 'text-primary', isCenter: true },
    { name: 'হাদিস', href: '/hadith', icon: BookOpen, activeColor: 'text-emerald-400' },
    { name: 'Profile', href: '/profile', icon: User, activeColor: 'text-white' },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-50">
      <div className={`${isHadith ? 'bg-hadith-deep/95 border-hadith-border' : 'bg-card-dark/95 border-border-dark'} backdrop-blur-xl border rounded-2xl shadow-2xl flex items-center justify-around p-2`}>
        {tabs.map((tab) => {
          const isActive = pathname?.startsWith(tab.href);
          const colorClass = isActive ? tab.activeColor : 'text-slate-500';

          if (tab.isCenter) {
            return (
              <Link key={tab.name} href={tab.href} className="flex flex-col items-center -mt-8 gap-1">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 ${isHadith ? 'border-hadith-deep' : 'border-bg-dark'} transition-transform hover:scale-105 ${isActive ? 'bg-primary shadow-[0_0_15px_rgba(98,100,244,0.5)]' : 'bg-primary shadow-[0_0_15px_rgba(98,100,244,0.3)]'}`}>
                  {tab.icon && <tab.icon className={`w-6 h-6 text-white`} />}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? 'text-primary' : 'text-slate-500'}`}>{tab.name}</span>
              </Link>
            );
          }

          return (
            <Link key={tab.name} href={tab.href} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${isActive && tab.name === 'হাদিস' ? 'bg-emerald-900/30' : ''}`}>
              {tab.name === 'হাদিস' ? (
                <BookOpen className={`w-6 h-6 ${colorClass}`} />
              ) : (
                tab.icon && <tab.icon className={`w-5 h-5 ${colorClass}`} />
              )}
              <span className={`text-[9px] font-bold uppercase tracking-wider ${colorClass}`}>{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
