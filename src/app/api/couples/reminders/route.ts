import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../../utils/supabase/server';
import { getCoupleModeState } from '@/server/couples/mode';

type ReminderPayload = {
  title?: string;
  note?: string;
  dueAt?: string;
  completeId?: string;
};

function looksLikeMissingTable(error: { code?: string; message?: string } | null | undefined, table: string) {
  if (!error) return false;
  return error.code === 'PGRST205' || Boolean(error.message?.includes(`public.${table}`));
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const mode = await getCoupleModeState(supabase, user.id);
    if (!mode.featureEnabled || !mode.hasCouple || !mode.coupleId) {
      return NextResponse.json({ error: 'Couple context is required.' }, { status: 403 });
    }
    if (mode.pairUnavailable) {
      return NextResponse.json({ error: 'This pair is unavailable due to a safety state.' }, { status: 403 });
    }
    if (!mode.selfEnabled) {
      return NextResponse.json({ error: 'Turn Couple Mode ON to manage reminders.' }, { status: 403 });
    }

    const payload = (await req.json().catch(() => ({}))) as ReminderPayload;
    if (typeof payload.completeId === 'string' && payload.completeId.trim()) {
      const completeId = payload.completeId.trim();
      const { error: updateError } = await supabase
        .from('couple_reminders')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', completeId)
        .eq('couple_id', mode.coupleId)
        .eq('completed', false);

      if (updateError) {
        if (looksLikeMissingTable(updateError, 'couple_reminders')) {
          return NextResponse.json({ error: 'Reminder tables are not initialized yet.' }, { status: 503 });
        }
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    const title = typeof payload.title === 'string' ? payload.title.trim() : '';
    const note = typeof payload.note === 'string' ? payload.note.trim() : '';
    const dueAtRaw = typeof payload.dueAt === 'string' ? payload.dueAt.trim() : '';

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }
    if (!dueAtRaw) {
      return NextResponse.json({ error: 'dueAt is required' }, { status: 400 });
    }

    const due = new Date(dueAtRaw);
    if (Number.isNaN(due.getTime())) {
      return NextResponse.json({ error: 'Invalid dueAt date' }, { status: 400 });
    }

    const { error: insertError } = await supabase.from('couple_reminders').insert({
      couple_id: mode.coupleId,
      created_by_user_id: user.id,
      title,
      note,
      due_at: due.toISOString(),
    });

    if (insertError) {
      if (looksLikeMissingTable(insertError, 'couple_reminders')) {
        return NextResponse.json({ error: 'Reminder tables are not initialized yet.' }, { status: 503 });
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
