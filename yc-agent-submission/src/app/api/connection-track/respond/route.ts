import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../../utils/supabase/server';

type TrackRow = {
  id: string;
  user_one_id: string;
  user_two_id: string;
  status: 'active' | 'inactive';
};

type QuestionRow = {
  id: string;
  type: 'daily_micro_question' | 'weekly_pulse' | 'pre_date_check';
  is_active: boolean;
};

async function pairIsDisabled(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  currentUserId: string,
  otherUserId: string
) {
  const [{ data: blockRows }, { data: unmatchRows }] = await Promise.all([
    supabase
      .from('blocks')
      .select('id')
      .or(
        `and(blocker_user_id.eq.${currentUserId},blocked_user_id.eq.${otherUserId}),and(blocker_user_id.eq.${otherUserId},blocked_user_id.eq.${currentUserId})`
      ),
    supabase
      .from('unmatches')
      .select('id')
      .or(
        `and(initiated_by_user_id.eq.${currentUserId},unmatched_user_id.eq.${otherUserId}),and(initiated_by_user_id.eq.${otherUserId},unmatched_user_id.eq.${currentUserId})`
      ),
  ]);

  return (blockRows ?? []).length > 0 || (unmatchRows ?? []).length > 0;
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
    const connectionTrackId = typeof payload?.connectionTrackId === 'string' ? payload.connectionTrackId.trim() : '';
    const questionId = typeof payload?.questionId === 'string' ? payload.questionId.trim() : '';
    const cycleKey = typeof payload?.cycleKey === 'string' ? payload.cycleKey.trim() : '';
    const responseText = typeof payload?.responseText === 'string' ? payload.responseText.trim() : '';
    const responseValue =
      payload?.responseValue && typeof payload.responseValue === 'object' ? payload.responseValue : null;

    if (!connectionTrackId || !questionId || !cycleKey) {
      return NextResponse.json({ error: 'connectionTrackId, questionId, and cycleKey are required' }, { status: 400 });
    }

    if (!responseText && !responseValue) {
      return NextResponse.json({ error: 'Provide responseText or responseValue' }, { status: 400 });
    }

    const { data: track, error: trackError } = await supabase
      .from('connection_tracks')
      .select('id,user_one_id,user_two_id,status')
      .eq('id', connectionTrackId)
      .maybeSingle<TrackRow>();

    if (trackError || !track) {
      return NextResponse.json({ error: trackError?.message ?? 'Connection track not found' }, { status: 404 });
    }

    const isParticipant = track.user_one_id === user.id || track.user_two_id === user.id;
    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (track.status !== 'active') {
      return NextResponse.json({ error: 'Connection track is inactive' }, { status: 403 });
    }

    const otherUserId = track.user_one_id === user.id ? track.user_two_id : track.user_one_id;
    if (await pairIsDisabled(supabase, user.id, otherUserId)) {
      return NextResponse.json({ error: 'Connection track unavailable for this pair.' }, { status: 403 });
    }

    const { data: question, error: questionError } = await supabase
      .from('connection_track_questions')
      .select('id,type,is_active')
      .eq('id', questionId)
      .eq('is_active', true)
      .maybeSingle<QuestionRow>();

    if (questionError || !question) {
      return NextResponse.json({ error: questionError?.message ?? 'Question unavailable' }, { status: 404 });
    }

    const { error: upsertError } = await supabase.from('connection_track_responses').upsert(
      {
        connection_track_id: connectionTrackId,
        question_id: questionId,
        user_id: user.id,
        cycle_key: cycleKey,
        response_text: responseText || null,
        response_value: responseValue,
      },
      {
        onConflict: 'connection_track_id,question_id,user_id,cycle_key',
      }
    );

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    await supabase.from('connection_track_events').insert({
      connection_track_id: connectionTrackId,
      event_type: 'response_submitted',
      metadata: {
        question_id: questionId,
        cycle_key: cycleKey,
        user_id: user.id,
      },
    });

    if (question.type === 'pre_date_check') {
      const { data: pairResponses } = await supabase
        .from('connection_track_responses')
        .select('id,user_id')
        .eq('connection_track_id', connectionTrackId)
        .eq('question_id', questionId)
        .eq('cycle_key', cycleKey);

      const responders = new Set((pairResponses ?? []).map(item => item.user_id));
      if (responders.has(track.user_one_id) && responders.has(track.user_two_id)) {
        await supabase.from('connection_track_events').insert({
          connection_track_id: connectionTrackId,
          event_type: 'pre_date_completed',
          metadata: {
            cycle_key: cycleKey,
            question_id: questionId,
          },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
