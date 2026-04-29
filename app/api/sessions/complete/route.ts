import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { roadmap_id, day_number, duration_secs, mood } = await request.json()

    if (!roadmap_id || !day_number || !duration_secs) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const xp_earned = Math.max(10, Math.floor(duration_secs / 60) * 2)

    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
    const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey, {
      global: { fetch: (...args) => fetch(...args) }
    })

    // 1. Save study session
    const { error: sessionError } = await adminClient.from('study_sessions').insert({
      user_id: user.id,
      roadmap_id,
      day_number,
      duration_secs,
      xp_earned,
      mood,
      started_at: new Date(Date.now() - duration_secs * 1000).toISOString(),
      ended_at: new Date().toISOString(),
    })
    if (sessionError) throw sessionError

    // 2. Mark current day as completed
    const { error: completeError } = await adminClient
      .from('day_progress')
      .update({ status: 'completed', completed_at: new Date().toISOString(), mood })
      .eq('user_id', user.id)
      .eq('roadmap_id', roadmap_id)
      .eq('day_number', day_number)
    if (completeError) throw completeError

    // 3. Unlock next day only if currently locked
    const { data: nextDay } = await adminClient
      .from('day_progress')
      .select('status')
      .eq('user_id', user.id)
      .eq('roadmap_id', roadmap_id)
      .eq('day_number', day_number + 1)
      .single()

    if (nextDay && nextDay.status === 'locked') {
      await adminClient
        .from('day_progress')
        .update({ status: 'available' })
        .eq('user_id', user.id)
        .eq('roadmap_id', roadmap_id)
        .eq('day_number', day_number + 1)
    }

    // 4. Award XP, level and streak — direct update, no SQL function dependency
    const { data: profileData } = await adminClient
      .from('profiles')
      .select('xp, streak, level')
      .eq('id', user.id)
      .single()

    if (profileData) {
      const new_xp = (profileData.xp || 0) + xp_earned
      const new_level = Math.floor(new_xp / 200) + 1
      // 36-hour streak logic
      const { data: recentSessions } = await adminClient
        .from('study_sessions')
        .select('ended_at')
        .eq('user_id', user.id)
        .order('ended_at', { ascending: false })
        .limit(2)

      // recentSessions[0] = the session just inserted
      // recentSessions[1] = the one before it
      const previousSession = recentSessions?.[1]
      let new_streak = profileData.streak || 0

      if (!previousSession) {
        // First ever session
        new_streak = 1
      } else {
        const hoursDiff = (Date.now() - new Date(previousSession.ended_at).getTime()) / (1000 * 60 * 60)
        if (hoursDiff > 36) {
          new_streak = 1        // gap too large, reset
        } else if (hoursDiff >= 1) {
          new_streak = (profileData.streak || 0) + 1  // new day session
        }
        // hoursDiff < 1: multiple sessions same day, streak stays the same
      }

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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
