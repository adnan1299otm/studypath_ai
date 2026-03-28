import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center p-4 text-center">
      <h2 className="text-4xl font-extrabold text-white mb-4">404</h2>
      <p className="text-slate-400 mb-8">Page not found</p>
      <Link 
        href="/"
        className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
      >
        Return Home
      </Link>
    </div>
  );
}
