import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { paymentId, userId, action } = await req.json();
    const supabase = await createClient();
    
    // 1. Verify Authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verify Admin Role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    if (!paymentId || !userId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'approve') {
      // Update payment status
      await supabase
        .from('payments')
        .update({ status: 'approved' })
        .eq('id', paymentId);

      // Upgrade user to PRO
      await supabase
        .from('profiles')
        .update({ plan: 'pro' })
        .eq('id', userId);
        
    } else if (action === 'reject') {
      // Update payment status only
      await supabase
        .from('payments')
        .update({ status: 'rejected' })
        .eq('id', paymentId);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin Payment Action Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
