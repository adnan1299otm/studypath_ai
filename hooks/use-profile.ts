import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types';

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  // Use a ref so the supabase client is stable across renders
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;
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

          if (!error && data && mounted) {
            setProfile(data as Profile);
          }
        }
      } catch {
        // Silently handle errors
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfile();

    // Real-time profile updates — channel name is unique per user session
    const channelName = `profile_updates_${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelName)
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
  }, []); // Empty dependency array — runs only once

  return { profile, loading };
}
