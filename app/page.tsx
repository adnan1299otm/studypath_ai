import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  const supabase = await createClient();

  let user = null;
  try {
    // 1. Check if user is logged in
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    console.error('Error fetching user:', error);
  }

  // 2. If NOT logged in -> redirect to /auth
  if (!user) {
    redirect('/auth');
  }

  let roadmap = null;
  try {
    // 3. Check if user has an active roadmap
    const { data } = await supabase
      .from('roadmaps')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();
    roadmap = data;
  } catch (error) {
    console.error('Error fetching roadmap:', error);
  }

  // 4. If logged in AND has an active roadmap -> redirect to /roadmap
  if (roadmap) {
    redirect('/roadmap');
  } else {
    // If logged in BUT no roadmap exists -> redirect to /upload
    redirect('/upload');
  }
}
