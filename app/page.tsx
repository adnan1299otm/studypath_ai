import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function RootPage() {
  const supabase = await createClient();

  // 1. Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();

  // 2. If NOT logged in -> redirect to /auth
  if (!user) {
    redirect('/auth');
  }

  // 3. Check if user has an active roadmap
  const { data: roadmap } = await supabase
    .from('roadmaps')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  // 4. If logged in AND has an active roadmap -> redirect to /roadmap
  if (roadmap) {
    redirect('/roadmap');
  } else {
    // If logged in BUT no roadmap exists -> redirect to /upload
    redirect('/upload');
  }
}
