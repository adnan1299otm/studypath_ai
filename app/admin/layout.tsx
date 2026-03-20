export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-dark flex flex-col max-w-[1200px] mx-auto relative shadow-2xl overflow-hidden">
      {/* Admin Header */}
      <header className="bg-card-dark border-b border-border-dark p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center">
            <span className="text-xl">🛡️</span>
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white leading-tight">StudyPath Admin</h1>
            <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">Control Panel</p>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}
