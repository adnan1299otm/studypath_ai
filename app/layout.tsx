import type {Metadata, Viewport} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StudyPath AI',
  description: 'Gamified, AI-powered study planner for Bangladeshi students.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'StudyPath AI',
  },
};

export const viewport: Viewport = {
  themeColor: '#0B0B0F',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg-dark text-slate-200 font-sans antialiased selection:bg-primary/30 selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
