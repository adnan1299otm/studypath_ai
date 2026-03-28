import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const getEnv = (key: string) => {
    if (typeof window !== 'undefined' && (window as any).ENV && (window as any).ENV[key]) {
      return (window as any).ENV[key];
    }
    return process.env[key] || '';
  };

  return createBrowserClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL') || 'https://placeholder.supabase.co',
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || 'placeholder'
  )
}
