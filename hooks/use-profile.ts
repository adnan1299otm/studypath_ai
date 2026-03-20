import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types';

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && mounted) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (!error && data) {
            setProfile(data as Profile);
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfile();

    // Subscribe to real-time profile updates
    const channel = supabase
      .channel('profile_updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          if (mounted) {
            setProfile((prev) => {
              if (prev && payload.new.id === prev.id) {
                return payload.new as Profile;
              }
              return prev;
            });
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return { profile, loading };
}
