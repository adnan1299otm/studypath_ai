'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, Trophy, Brain, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === '/configure') {
    return null;
  }

  const tabs = [
    { name: 'Roadmap', href: '/roadmap', icon: Map, activeColor: 'text-primary' },
    { name: 'Rank', href: '/rank', icon: Trophy, activeColor: 'text-primary' },
    { name: 'AI', href: '/ai', icon: Brain, activeColor: 'text-white', isCenter: true },
    { name: 'হাদিস', href: '/hadith', emoji: '☪️', activeColor: 'text-emerald-500' },
    { name: 'Profile', href: '/profile', icon: User, activeColor: 'text-primary' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card-dark/95 backdrop-blur-xl border-t border-border-dark rounded-t-2xl shadow-2xl pb-safe">
      <div className="max-w-[640px] mx-auto px-6 h-16 flex items-center justify-between relative">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const colorClass = isActive ? tab.activeColor : 'text-slate-500';

          if (tab.isCenter) {
            return (
              <Link key={tab.name} href={tab.href} className="relative -mt-8 flex flex-col items-center justify-center">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 border-bg-dark transition-all ${isActive ? 'bg-primary shadow-[0_0_15px_rgba(98,100,244,0.5)]' : 'bg-card-dark-2'}`}>
                  {tab.icon && <tab.icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-primary'}`} />}
                </div>
                <span className={`text-[10px] font-bold mt-1 ${isActive ? 'text-primary' : 'text-slate-500'}`}>{tab.name}</span>
              </Link>
            );
          }

          return (
            <Link key={tab.name} href={tab.href} className="flex flex-col items-center justify-center w-12 transition-colors">
              {tab.emoji ? (
                <span className={`text-xl mb-1 transition-all ${!isActive && 'opacity-50 grayscale'}`}>{tab.emoji}</span>
              ) : (
                tab.icon && <tab.icon className={`w-6 h-6 mb-1 ${colorClass}`} />
              )}
              <span className={`text-[10px] font-bold ${colorClass}`}>{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
