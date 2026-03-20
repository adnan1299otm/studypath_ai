import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { method, trxId, screenshotUrl } = await req.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!method || !trxId) {
      return NextResponse.json({ error: 'Method and Transaction ID are required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        method,
        trx_id: trxId,
        screenshot_url: screenshotUrl || null,
        status: 'pending'
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Payment Submit Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
