import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../../utils/supabase/server';

type BlockRow = {
  blocked_user_id: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
};

function fallbackLabel(userId: string) {
  if (!userId) return 'Unknown user';
  return `User ${userId.slice(0, 8)}`;
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: blocks, error: blocksError } = await supabase
      .from('blocks')
      .select('blocked_user_id, created_at')
      .eq('blocker_user_id', user.id)
      .order('created_at', { ascending: false })
      .returns<BlockRow[]>();

    if (blocksError) {
      return NextResponse.json({ error: blocksError.message }, { status: 500 });
    }

    const blockedIds = Array.from(
      new Set((blocks ?? []).map((row) => row.blocked_user_id).filter(Boolean))
    );

    const profileMap = new Map<string, string>();
    if (blockedIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', blockedIds)
        .returns<ProfileRow[]>();

      for (const profile of profiles ?? []) {
        if (profile?.id && profile?.full_name?.trim()) {
          profileMap.set(profile.id, profile.full_name.trim());
        }
      }
    }

    const items = (blocks ?? []).map((row) => ({
      userId: row.blocked_user_id,
      name: profileMap.get(row.blocked_user_id) ?? fallbackLabel(row.blocked_user_id),
      blockedAt: row.created_at,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

