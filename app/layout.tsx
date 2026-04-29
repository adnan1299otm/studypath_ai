import type {Metadata, Viewport} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StudyPath AI',
  description: 'Gamified, AI-powered study planner for Bangladeshi students.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
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
  // Read environment variables dynamically to prevent Next.js from inlining them at build time
  const getEnv = (key: string) => process.env[key] || '';

  const envScript = `
    window.ENV = {
      NEXT_PUBLIC_SUPABASE_URL: ${JSON.stringify(getEnv('NEXT_PUBLIC_SUPABASE_URL'))},
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${JSON.stringify(getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'))},
    };
  `;

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: envScript }} suppressHydrationWarning />
      </head>
      <body className="bg-bg-dark text-slate-200 font-sans antialiased selection:bg-primary/30 selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
