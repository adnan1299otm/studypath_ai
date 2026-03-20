import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-dark flex flex-col max-w-[640px] mx-auto relative shadow-2xl overflow-hidden">
      <Header />
      
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>
      
      <BottomNav />
    </div>
  );
}
