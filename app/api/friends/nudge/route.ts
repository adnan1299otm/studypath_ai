import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { receiver_id } = await req.json()

    // 1. Verify they are accepted friends
    const { data: friendship } = await supabase
      .from('friendships')
      .select('id')
      .eq('status', 'accepted')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiver_id}),and(sender_id.eq.${receiver_id},receiver_id.eq.${user.id})`)
      .single()

    if (!friendship) {
      return NextResponse.json({ error: 'Not friends' }, { status: 403 })
    }

    // 2. Check nudges table: has sender already nudged receiver today?
    const today = new Date().toISOString().split('T')[0]
    const { data: existingNudge } = await supabase
      .from('nudges')
      .select('id')
      .eq('sender_id', user.id)
      .eq('receiver_id', receiver_id)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
      .maybeSingle()

    if (existingNudge) {
      return NextResponse.json({ error: 'আজকে already nudge করা হয়েছে' }, { status: 403 })
    }

    // 4. Insert into nudges
    const { error: insertError } = await supabase
      .from('nudges')
      .insert({
        sender_id: user.id,
        receiver_id
      })

    if (insertError) throw insertError

    // 5. Insert notification for receiver
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    await supabase.from('notifications').insert({
      user_id: receiver_id,
      type: 'nudge',
      from_user_id: user.id,
      title: 'Nudge! 👋',
      body: `${senderProfile?.full_name || 'কেউ একজন'} তোমাকে পড়তে বলছে!`
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Nudge Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
