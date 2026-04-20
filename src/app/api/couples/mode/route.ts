import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../../utils/supabase/server';
import { getCoupleModeState } from '@/server/couples/mode';

type TogglePayload = {
  enabled?: boolean;
};

function looksLikeMissingTable(error: { code?: string; message?: string } | null | undefined, table: string) {
  if (!error) return false;
  return error.code === 'PGRST205' || Boolean(error.message?.includes(`public.${table}`));
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const state = await getCoupleModeState(supabase, user.id);
    return NextResponse.json({
      enabled: state.featureEnabled,
      hasCouple: state.hasCouple,
      pairUnavailable: state.pairUnavailable,
      migrationRequired: state.migrationRequired,
      selfEnabled: state.selfEnabled,
      partnerEnabled: state.partnerEnabled,
      effectiveOn: state.effectiveOn,
      partnerUserId: state.partnerUserId,
      updatedAt: state.updatedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = (await req.json().catch(() => ({}))) as TogglePayload;
    if (typeof payload.enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled(boolean) is required' }, { status: 400 });
    }

    const current = await getCoupleModeState(supabase, user.id);

    if (!current.featureEnabled) {
      return NextResponse.json({ error: 'Couple mode feature is disabled.' }, { status: 403 });
    }

    if (payload.enabled) {
      if (!current.hasCouple || !current.coupleId || !current.partnerUserId) {
        return NextResponse.json({ error: 'Couple mode can only be enabled with a confirmed couple.' }, { status: 403 });
      }
      if (current.pairUnavailable) {
        return NextResponse.json({ error: 'This pair is unavailable due to a safety state.' }, { status: 403 });
      }
      if (current.migrationRequired) {
        return NextResponse.json({ error: 'Couple mode tables are not initialized yet.' }, { status: 503 });
      }
    }

    const { error: upsertError } = await supabase
      .from('couple_mode_preferences')
      .upsert(
        {
          user_id: user.id,
          enabled: payload.enabled,
        },
        { onConflict: 'user_id' }
      );

    if (upsertError) {
      if (looksLikeMissingTable(upsertError, 'couple_mode_preferences')) {
        return NextResponse.json({ error: 'Couple mode preferences are not initialized yet.' }, { status: 503 });
      }
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    if (current.coupleId) {
      await supabase.from('couple_mode_events').insert({
        couple_id: current.coupleId,
        actor_user_id: user.id,
        event_type: payload.enabled ? 'enabled' : 'disabled',
        metadata: {
          source: 'couples_mode_toggle',
        },
      });
    }

    const next = await getCoupleModeState(supabase, user.id);

    return NextResponse.json({
      ok: true,
      enabled: next.featureEnabled,
      hasCouple: next.hasCouple,
      pairUnavailable: next.pairUnavailable,
      migrationRequired: next.migrationRequired,
      selfEnabled: next.selfEnabled,
      partnerEnabled: next.partnerEnabled,
      effectiveOn: next.effectiveOn,
      partnerUserId: next.partnerUserId,
      updatedAt: next.updatedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
