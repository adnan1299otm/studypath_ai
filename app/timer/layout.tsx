export default function TimerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-dark flex flex-col max-w-[640px] mx-auto relative shadow-2xl overflow-hidden">
      {children}
    </div>
  );
}
