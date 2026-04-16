import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../../utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const targetUserId = typeof payload?.targetUserId === 'string' ? payload.targetUserId.trim() : '';
    const reason = typeof payload?.reason === 'string' ? payload.reason.trim() : '';
    const details = payload?.details && typeof payload.details === 'object' ? payload.details : {};

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    if (targetUserId === user.id) {
      return NextResponse.json({ error: 'You cannot report yourself' }, { status: 400 });
    }

    const { error } = await supabase.from('reports').insert({
      reporter_user_id: user.id,
      reported_user_id: targetUserId,
      reason: reason || 'other',
      details,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
