import Link from 'next/link';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-2xl font-extrabold text-white mb-3">Page Not Found</h2>
      <p className="text-slate-400 text-sm mb-8 max-w-[280px] mx-auto leading-relaxed">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-8 py-4 bg-primary text-white font-extrabold rounded-2xl hover:opacity-90 transition-opacity shadow-[0_8px_20px_rgba(98,100,244,0.25)] flex items-center gap-2"
      >
        <Home className="w-5 h-5" /> Back to Home
      </Link>
    </div>
  );
}
