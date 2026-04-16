import type { SupabaseClient } from '@supabase/supabase-js';

export type ConnectionTrackRow = {
  id: string;
  match_id?: string | null;
  conversation_id?: string | null;
  user_one_id: string;
  user_two_id: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
};

function sortPair(userA: string, userB: string): [string, string] {
  return userA < userB ? [userA, userB] : [userB, userA];
}

export async function ensureConnectionTrackForPair(
  supabase: SupabaseClient,
  params: {
    userA: string;
    userB: string;
    matchId?: string | null;
    conversationId?: string | null;
  }
): Promise<ConnectionTrackRow | null> {
  const [userOne, userTwo] = sortPair(params.userA, params.userB);

  const { data: existing, error: existingError } = await supabase
    .from('connection_tracks')
    .select('*')
    .eq('user_one_id', userOne)
    .eq('user_two_id', userTwo)
    .eq('status', 'active')
    .maybeSingle<ConnectionTrackRow>();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    const needsUpdate =
      (params.matchId && !existing.match_id) ||
      (params.conversationId && !existing.conversation_id);

    if (needsUpdate) {
      const { data: updated, error: updateError } = await supabase
        .from('connection_tracks')
        .update({
          match_id: existing.match_id ?? params.matchId ?? null,
          conversation_id: existing.conversation_id ?? params.conversationId ?? null,
        })
        .eq('id', existing.id)
        .select('*')
        .maybeSingle<ConnectionTrackRow>();

      if (updateError) {
        throw updateError;
      }

      return updated ?? existing;
    }

    return existing;
  }

  const { data: inserted, error: insertError } = await supabase
    .from('connection_tracks')
    .insert({
      user_one_id: userOne,
      user_two_id: userTwo,
      match_id: params.matchId ?? null,
      conversation_id: params.conversationId ?? null,
      status: 'active',
    })
    .select('*')
    .maybeSingle<ConnectionTrackRow>();

  if (!insertError) {
    return inserted;
  }

  const retriable = insertError.message.toLowerCase().includes('duplicate') || insertError.code === '23505';
  if (!retriable) {
    throw insertError;
  }

  const { data: raceRecovered, error: raceError } = await supabase
    .from('connection_tracks')
    .select('*')
    .eq('user_one_id', userOne)
    .eq('user_two_id', userTwo)
    .eq('status', 'active')
    .maybeSingle<ConnectionTrackRow>();

  if (raceError) {
    throw raceError;
  }

  return raceRecovered ?? null;
}

export async function deactivateConnectionTrackForPair(
  supabase: SupabaseClient,
  params: {
    userA: string;
    userB: string;
    reason: string;
  }
): Promise<void> {
  const [userOne, userTwo] = sortPair(params.userA, params.userB);

  const { data: tracks, error: selectError } = await supabase
    .from('connection_tracks')
    .select('id,status')
    .eq('user_one_id', userOne)
    .eq('user_two_id', userTwo)
    .eq('status', 'active')
    .returns<Array<{ id: string; status: string }>>();

  if (selectError) {
    throw selectError;
  }

  if (!tracks || tracks.length === 0) {
    return;
  }

  const trackIds = tracks.map(track => track.id);

  const { error: updateError } = await supabase
    .from('connection_tracks')
    .update({ status: 'inactive' })
    .in('id', trackIds);

  if (updateError) {
    throw updateError;
  }

  await supabase.from('connection_track_events').insert(
    trackIds.map(trackId => ({
      connection_track_id: trackId,
      event_type: 'track_deactivated',
      metadata: { reason: params.reason },
    }))
  );
}

export function stableHash(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

export function getTodayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function getWeekKey(now = new Date()): string {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
