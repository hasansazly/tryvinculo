import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../../utils/supabase/server';

async function archiveMyMatchRow(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, userId: string, targetUserId: string, reason: string) {
  const updatePayload = {
    status: 'archived',
    conversation_disabled: true,
    conversation_disabled_reason: reason,
  };

  const { error } = await supabase
    .from('matches')
    .update(updatePayload)
    .eq('user_id', userId)
    .eq('matched_user_id', targetUserId)
    .eq('status', 'active');

  if (!error) return null;

  if (error.message.toLowerCase().includes('conversation_disabled')) {
    const { error: fallbackError } = await supabase
      .from('matches')
      .update({ status: 'archived' })
      .eq('user_id', userId)
      .eq('matched_user_id', targetUserId)
      .eq('status', 'active');
    return fallbackError;
  }

  return error;
}

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
    const reason = typeof payload?.reason === 'string' ? payload.reason.trim() : 'unmatched';

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    if (targetUserId === user.id) {
      return NextResponse.json({ error: 'You cannot unmatch yourself' }, { status: 400 });
    }

    const { error: insertUnmatchError } = await supabase.from('unmatches').insert({
      initiated_by_user_id: user.id,
      unmatched_user_id: targetUserId,
      reason,
      details: {},
    });

    if (insertUnmatchError) {
      return NextResponse.json({ error: insertUnmatchError.message }, { status: 500 });
    }

    const archiveError = await archiveMyMatchRow(supabase, user.id, targetUserId, reason);
    if (archiveError) {
      return NextResponse.json({ error: archiveError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
