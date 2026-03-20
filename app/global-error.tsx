'use client';

import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-display' });

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="bg-bg-dark text-slate-200 font-sans antialiased selection:bg-primary/30 selection:text-white">
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-3">Critical System Error</h2>
          <p className="text-slate-400 text-sm mb-8 max-w-[280px] mx-auto leading-relaxed">
            {error.message || "A critical error occurred that prevented the application from loading."}
          </p>
          <button
            onClick={() => reset()}
            className="px-8 py-4 bg-primary text-white font-extrabold rounded-2xl hover:opacity-90 transition-opacity shadow-[0_8px_20px_rgba(98,100,244,0.25)] flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" /> Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
