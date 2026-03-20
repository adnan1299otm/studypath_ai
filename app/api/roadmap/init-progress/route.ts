import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { roadmap_id, total_days } = await request.json()

  const rows = Array.from({ length: total_days }, (_, i) => ({
    user_id: user.id,
    roadmap_id,
    day_number: i + 1,
    status: i === 0 ? 'available' : 'locked',
  }))

  const { error } = await supabase
    .from('day_progress')
    .upsert(rows, { onConflict: 'user_id,roadmap_id,day_number' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
