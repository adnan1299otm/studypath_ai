import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { roadmap_id, day_number, duration_secs, mood } = await request.json()
    
    console.log('Session complete API called', { day_number, roadmap_id })

    const xp_earned = Math.max(10, Math.floor(duration_secs / 60) * 2)

    // Create admin client to bypass RLS for updates
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
    const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const adminClient = createAdminClient(
      supabaseUrl,
      supabaseServiceKey
    )

    // 1. Save study session
    await adminClient.from('study_sessions').insert({
      user_id: user.id,
      roadmap_id,
      day_number,
      duration_secs,
      xp_earned,
      mood,
      started_at: new Date(Date.now() - duration_secs * 1000).toISOString(),
      ended_at: new Date().toISOString(),
    })

    // 2. Mark current day as completed
    await adminClient
      .from('day_progress')
      .update({ status: 'completed', completed_at: new Date().toISOString(), mood })
      .eq('user_id', user.id)
      .eq('roadmap_id', roadmap_id)
      .eq('day_number', day_number)

    // 3. Unlock next day (Fixes existing data without manual SQL)
    // Only update if it's currently 'locked' to prevent downgrading completed days
    const { data: nextDay } = await adminClient
      .from('day_progress')
      .select('status')
      .eq('user_id', user.id)
      .eq('roadmap_id', roadmap_id)
      .eq('day_number', day_number + 1)
      .single()

    if (nextDay && nextDay.status === 'locked') {
      const { error: unlockError } = await adminClient
        .from('day_progress')
        .update({ status: 'available' })
        .eq('user_id', user.id)
        .eq('roadmap_id', roadmap_id)
        .eq('day_number', day_number + 1)

      if (unlockError) {
        console.error('Failed to unlock next day:', unlockError)
      } else {
        console.log(`Successfully unlocked day ${day_number + 1}`)
      }
    }

    // 4. Add XP and update streak
    const { data: profile } = await adminClient
      .from('profiles')
      .select('xp, streak, level')
      .eq('id', user.id)
      .single()

    if (profile) {
      const new_xp = (profile.xp || 0) + xp_earned
      const new_level = Math.floor(new_xp / 200) + 1
      const new_streak = (profile.streak || 0) + 1

      await adminClient
        .from('profiles')
        .update({ 
          xp: new_xp, 
          level: new_level,
          streak: new_streak,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
    }

    return NextResponse.json({ success: true, xp_earned })
  } catch (error: any) {
    console.error('Session complete error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
