import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../../../utils/supabase/server';
import { stableHash } from '@/server/connectionTrack/service';

type TrackRow = {
  id: string;
  user_one_id: string;
  user_two_id: string;
  status: 'active' | 'inactive';
};

type QuestionRow = {
  id: string;
  type: 'pre_date_check';
  question_text: string;
  category: string;
  metadata?: Record<string, unknown> | null;
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

function pickQuestion(trackId: string, startCount: number, questions: QuestionRow[]) {
  const idx = stableHash(`${trackId}:pre-date:${startCount}`) % questions.length;
  return questions[idx] ?? null;
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

    if (!connectionTrackId) {
      return NextResponse.json({ error: 'connectionTrackId is required' }, { status: 400 });
    }

    const { data: track, error: trackError } = await supabase
      .from('connection_tracks')
      .select('id,user_one_id,user_two_id,status')
      .eq('id', connectionTrackId)
      .maybeSingle<TrackRow>();

    if (trackError || !track) {
      return NextResponse.json({ error: trackError?.message ?? 'Connection track not found' }, { status: 404 });
    }

    if (track.status !== 'active') {
      return NextResponse.json({ error: 'Connection track is inactive' }, { status: 403 });
    }

    const isParticipant = track.user_one_id === user.id || track.user_two_id === user.id;
    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const otherUserId = track.user_one_id === user.id ? track.user_two_id : track.user_one_id;

    if (await pairIsDisabled(supabase, user.id, otherUserId)) {
      return NextResponse.json({ error: 'Connection track unavailable for this pair.' }, { status: 403 });
    }

    const { data: activeMatches, error: activeMatchError } = await supabase
      .from('matches')
      .select('id')
      .eq('status', 'active')
      .or(
        `and(user_id.eq.${user.id},matched_user_id.eq.${otherUserId}),and(user_id.eq.${otherUserId},matched_user_id.eq.${user.id})`
      )
      .limit(1);

    if (activeMatchError) {
      return NextResponse.json({ error: activeMatchError.message }, { status: 500 });
    }

    if (!activeMatches || activeMatches.length === 0) {
      return NextResponse.json({ error: 'Pre-date check requires an active match.' }, { status: 403 });
    }

    const { data: questionPool, error: questionError } = await supabase
      .from('connection_track_questions')
      .select('id,type,question_text,category,metadata')
      .eq('type', 'pre_date_check')
      .eq('is_active', true)
      .returns<QuestionRow[]>();

    if (questionError || !questionPool || questionPool.length === 0) {
      return NextResponse.json({ error: questionError?.message ?? 'No pre-date questions available' }, { status: 500 });
    }

    const { data: existingEvents } = await supabase
      .from('connection_track_events')
      .select('id')
      .eq('connection_track_id', connectionTrackId)
      .eq('event_type', 'pre_date_started');

    const startCount = (existingEvents?.length ?? 0) + 1;
    const question = pickQuestion(connectionTrackId, startCount, questionPool);

    if (!question) {
      return NextResponse.json({ error: 'Unable to select pre-date question' }, { status: 500 });
    }

    const cycleKey = `predate:${Date.now()}`;

    const { error: eventError } = await supabase.from('connection_track_events').insert({
      connection_track_id: connectionTrackId,
      event_type: 'pre_date_started',
      metadata: {
        cycle_key: cycleKey,
        question_id: question.id,
        started_by: user.id,
      },
    });

    if (eventError) {
      return NextResponse.json({ error: eventError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      preDate: {
        cycleKey,
        question: {
          id: question.id,
          text: question.question_text,
          category: question.category,
          metadata: question.metadata ?? {},
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
