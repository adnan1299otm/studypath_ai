import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { study_id } = await req.json()

    // 1. Validate study_id format (SP- + 6 alphanumeric chars)
    if (!study_id || !study_id.startsWith('SP-') || study_id.length !== 9) {
      return NextResponse.json({ error: 'Invalid Study ID format. Use SP-XXXXXX' }, { status: 400 })
    }

    const sixChars = study_id.substring(3).toUpperCase()
    if (!/^[A-Z0-9]{6}$/.test(sixChars)) {
      return NextResponse.json({ error: 'Invalid Study ID format. Use SP-XXXXXX' }, { status: 400 })
    }

    const formattedStudyId = `SP-${sixChars}`

    // 2. Find profile with that study_id
    const { data: receiver, error: findError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('study_id', formattedStudyId)
      .single()

    if (findError || !receiver) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 3. Check: not self
    if (receiver.id === user.id) {
      return NextResponse.json({ error: 'নিজেকে add করা যাবে না' }, { status: 400 })
    }

    // 4. Check: no existing friendship/request between the two
    const { data: existing } = await supabase
      .from('friendships')
      .select('status')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiver.id}),and(sender_id.eq.${receiver.id},receiver_id.eq.${user.id})`)
      .maybeSingle()

    if (existing) {
      if (existing.status === 'accepted') return NextResponse.json({ error: 'তোমরা আগে থেকেই বন্ধু' }, { status: 409 })
      if (existing.status === 'pending') return NextResponse.json({ error: 'Friend request already pending' }, { status: 409 })
      // If declined, we might want to allow a re-request or just block. Usually re-request is fine if it was a mistake.
      // But let's stick to the prompt's simplicity.
    }

    // 5. Insert into friendships
    const { error: insertError } = await supabase
      .from('friendships')
      .insert({
        sender_id: user.id,
        receiver_id: receiver.id,
        status: 'pending'
      })

    if (insertError) throw insertError

    // 6. Insert notification for receiver
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    await supabase.from('notifications').insert({
      user_id: receiver.id,
      type: 'friend_request',
      from_user_id: user.id,
      title: 'নতুন Friend Request',
      body: `${senderProfile?.full_name || 'কেউ একজন'} তোমাকে friend request পাঠিয়েছে।`
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Send Friend Request Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
