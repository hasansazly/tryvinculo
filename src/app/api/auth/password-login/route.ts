import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../../utils/supabase/server';
import { normalizeEmail } from '@/lib/utils';

type LoginPayload = {
  email?: string;
  password?: string;
  next?: string;
};

function sanitizeNext(next: string | undefined) {
  const candidate = (next ?? '').trim();
  if (!candidate.startsWith('/') || candidate.startsWith('//')) return '';
  if (candidate.startsWith('/auth')) return '';
  return candidate;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as LoginPayload;
    const email = normalizeEmail(body.email ?? '');
    const password = typeof body.password === 'string' ? body.password : '';
    const safeNext = sanitizeNext(body.next);

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ error: 'Sign in failed.' }, { status: 400 });
    }

    if (safeNext) {
      return NextResponse.json({ ok: true, next: safeNext });
    }

    const { data: preferenceRow } = await supabase
      .from('match_preferences')
      .select('user_id')
      .eq('user_id', data.user.id)
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      next: preferenceRow ? '/dashboard' : '/onboarding',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
