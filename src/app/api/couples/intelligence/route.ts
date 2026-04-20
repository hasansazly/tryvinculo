import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../../utils/supabase/server';
import { ensureCoupleTrack, getCycleKeyForModule, resolveCoupleContext, type CoupleQuestionRow, type CoupleResponseRow } from '@/server/couples/service';
import { getCoupleModeState } from '@/server/couples/mode';
import { generateCoupleIntelligence } from '@/server/couples/intelligence';

type ProfileRow = {
  first_name?: string | null;
  full_name?: string | null;
  email?: string | null;
};

function looksLikeMissingTable(error: { code?: string; message?: string } | null | undefined, table: string) {
  if (!error) return false;
  return error.code === 'PGRST205' || Boolean(error.message?.includes(`public.${table}`));
}

function toPreview(row: CoupleResponseRow) {
  if (row.response_text?.trim()) return row.response_text.trim();
  const value = row.response_value ?? {};
  if (typeof value.connectedScore === 'number') {
    return `Connected ${value.connectedScore}/5`;
  }
  if (typeof value.feltGood === 'string') return value.feltGood.trim();
  return '';
}

function nameFromProfile(profile: ProfileRow | null | undefined) {
  const first = typeof profile?.first_name === 'string' ? profile.first_name.trim() : '';
  if (first) return first;
  const full = typeof profile?.full_name === 'string' ? profile.full_name.trim() : '';
  if (full) return full.split(/\s+/)[0] || 'Partner';
  const email = typeof profile?.email === 'string' ? profile.email.split('@')[0]?.trim() : '';
  return email || 'Partner';
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const mode = await getCoupleModeState(supabase, user.id);
    if (!mode.featureEnabled || !mode.hasCouple || !mode.partnerUserId) {
      return NextResponse.json({ error: 'Couple context is required.' }, { status: 403 });
    }
    if (!mode.selfEnabled) {
      return NextResponse.json({ error: 'Turn Couple Mode ON to access couple insights.' }, { status: 403 });
    }

    const context = await resolveCoupleContext(supabase, user.id);
    if (!context) {
      return NextResponse.json({ error: 'Couple context not found.' }, { status: 404 });
    }

    const track = await ensureCoupleTrack(supabase, context);
    const weeklyKey = getCycleKeyForModule('weekly');

    const [{ data: questionRows }, { data: responseRows }, { data: partnerProfile }] = await Promise.all([
      supabase
        .from('connection_track_questions')
        .select('id,type')
        .eq('type', 'weekly_pulse')
        .eq('is_active', true)
        .returns<Array<Pick<CoupleQuestionRow, 'id' | 'type'>>>(),
      track
        ? supabase
            .from('connection_track_responses')
            .select('id,question_id,user_id,cycle_key,response_text,response_value,created_at')
            .eq('connection_track_id', track.id)
            .eq('cycle_key', weeklyKey)
            .returns<CoupleResponseRow[]>()
        : Promise.resolve({ data: [] as CoupleResponseRow[] }),
      supabase
        .from('profiles')
        .select('first_name,full_name,email')
        .eq('id', context.partnerUserId)
        .maybeSingle<ProfileRow>(),
    ]);

    const weeklyQuestionIds = new Set((questionRows ?? []).map(item => item.id));
    const weeklyResponses = (responseRows ?? []).filter(item => weeklyQuestionIds.has(item.question_id));
    const weeklySelf = weeklyResponses.filter(item => item.user_id === user.id).map(toPreview).filter(Boolean).slice(0, 4);
    const weeklyPartner = weeklyResponses
      .filter(item => item.user_id === context.partnerUserId)
      .map(toPreview)
      .filter(Boolean)
      .slice(0, 4);

    let openReminderCount = 0;
    const { count: remindersCount, error: remindersError } = await supabase
      .from('couple_reminders')
      .select('*', { count: 'exact', head: true })
      .eq('couple_id', context.couple.id)
      .eq('completed', false);
    if (!remindersError) {
      openReminderCount = remindersCount ?? 0;
    } else if (!looksLikeMissingTable(remindersError, 'couple_reminders')) {
      return NextResponse.json({ error: remindersError.message }, { status: 500 });
    }

    let recentMessages: string[] = [];
    if (context.couple.conversation_id) {
      const { data: messageRows } = await supabase
        .from('messages')
        .select('body,created_at')
        .eq('conversation_id', context.couple.conversation_id)
        .order('created_at', { ascending: false })
        .limit(20);
      recentMessages = (messageRows ?? [])
        .map(item => (typeof item.body === 'string' ? item.body.trim() : ''))
        .filter(Boolean)
        .slice(0, 8);
    }

    const partnerName = nameFromProfile(partnerProfile ?? null);
    const result = await generateCoupleIntelligence({
      partnerName,
      openReminderCount,
      weeklySelf,
      weeklyPartner,
      recentMessages,
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
