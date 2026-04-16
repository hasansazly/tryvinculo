import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../../utils/supabase/server';

function toInClause(ids: string[]): string {
  return `(${ids.map(id => `'${id.replace(/'/g, "''")}'`).join(',')})`;
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

    const body = await req.json().catch(() => ({}));
    const matchUserId = typeof body?.matchUserId === 'string' ? body.matchUserId.trim() : '';

    if (!matchUserId) {
      return NextResponse.json({ error: 'matchUserId is required' }, { status: 400 });
    }

    if (matchUserId === user.id) {
      return NextResponse.json({ error: 'Cannot start conversation with yourself' }, { status: 400 });
    }

    const { data: matchRow, error: matchCheckError } = await supabase
      .from('matches')
      .select('id')
      .eq('user_id', user.id)
      .eq('matched_user_id', matchUserId)
      .eq('status', 'active')
      .maybeSingle();

    if (matchCheckError) {
      return NextResponse.json({ error: matchCheckError.message }, { status: 500 });
    }

    if (!matchRow) {
      return NextResponse.json({ error: 'No active match found for this user' }, { status: 403 });
    }

    const { data: myParticipantRows, error: myParticipantError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (myParticipantError) {
      return NextResponse.json({ error: myParticipantError.message }, { status: 500 });
    }

    const ownedConversationIds = (myParticipantRows ?? []).map(row => row.conversation_id);

    if (ownedConversationIds.length > 0) {
      const { data: participantRows, error: pairLookupError } = await supabase
        .from('conversation_participants')
        .select('conversation_id,user_id')
        .filter('conversation_id', 'in', toInClause(ownedConversationIds));

      if (pairLookupError) {
        return NextResponse.json({ error: pairLookupError.message }, { status: 500 });
      }

      const sharedIds = new Set<string>();
      const grouped = new Map<string, Set<string>>();
      for (const row of participantRows ?? []) {
        const set = grouped.get(row.conversation_id) ?? new Set<string>();
        if (row.user_id === user.id || row.user_id === matchUserId) {
          set.add(row.user_id);
        }
        grouped.set(row.conversation_id, set);
      }

      for (const [conversationId, users] of grouped.entries()) {
        if (users.has(user.id) && users.has(matchUserId)) {
          sharedIds.add(conversationId);
        }
      }

      if (sharedIds.size > 0) {
        const sharedConversationIds = [...sharedIds];
        const { data: directConversationRows, error: directLookupError } = await supabase
          .from('conversations')
          .select('id,created_at')
          .eq('kind', 'direct')
          .filter('id', 'in', toInClause(sharedConversationIds))
          .order('created_at', { ascending: true })
          .limit(1);

        if (directLookupError) {
          return NextResponse.json({ error: directLookupError.message }, { status: 500 });
        }

        if (directConversationRows && directConversationRows.length > 0) {
          return NextResponse.json({ conversationId: directConversationRows[0].id, created: false });
        }
      }
    }

    const { data: newConversation, error: createConversationError } = await supabase
      .from('conversations')
      .insert({
        kind: 'direct',
        created_by: user.id,
      })
      .select('id')
      .single();

    if (createConversationError || !newConversation) {
      return NextResponse.json({ error: createConversationError?.message ?? 'Failed to create conversation' }, { status: 500 });
    }

    const { error: participantsInsertError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: newConversation.id, user_id: user.id },
        { conversation_id: newConversation.id, user_id: matchUserId },
      ]);

    if (participantsInsertError) {
      return NextResponse.json({ error: participantsInsertError.message }, { status: 500 });
    }

    return NextResponse.json({ conversationId: newConversation.id, created: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
