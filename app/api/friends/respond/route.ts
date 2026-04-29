import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { friendship_id, action } = await req.json()

    if (!friendship_id || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Missing logic' }, { status: 400 })
    }

    // 1. Find friendship by id
    const { data: friendship, error: findError } = await supabase
      .from('friendships')
      .select('*')
      .eq('id', friendship_id)
      .single()

    if (findError || !friendship) {
      return NextResponse.json({ error: 'Friendship not found' }, { status: 404 })
    }

    // 2. Verify current user is the receiver_id
    if (friendship.receiver_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 3. Update friendships.status
    const newStatus = action === 'accept' ? 'accepted' : 'declined'
    const { error: updateError } = await supabase
      .from('friendships')
      .update({ status: newStatus })
      .eq('id', friendship_id)

    if (updateError) throw updateError

    // 4. If accepted: insert notification for sender
    if (action === 'accept') {
      const { data: receiverProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      await supabase.from('notifications').insert({
        user_id: friendship.sender_id,
        type: 'friend_accepted',
        from_user_id: user.id,
        title: 'Friend Request Accepted!',
        body: `${receiverProfile?.full_name || 'কেউ একজন'} তোমার friend request accept করেছে।`
      })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Respond to Request Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
