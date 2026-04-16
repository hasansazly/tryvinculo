import Link from 'next/link';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/auth/LogoutButton';
import MatchCard from '@/components/matches/MatchCard';
import { getMatchesForUser } from '@/lib/matches';
import { createSupabaseServerClient } from '../../../utils/supabase/server';

export default async function DashboardPage() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/auth/login');
    }

    const { data: preferenceRow } = await supabase
      .from('match_preferences')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!preferenceRow) {
      redirect('/onboarding');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    const { count: rawResponsesCount, error: responsesCountError } = await supabase
      .from('onboarding_responses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    const responsesTableMissing =
      responsesCountError?.code === 'PGRST205' ||
      responsesCountError?.message?.includes("public.onboarding_responses");
    const responsesCount = responsesTableMissing ? 0 : rawResponsesCount;
    const matches = await getMatchesForUser(supabase, user.id);
    const displayName =
      profile?.first_name ||
      profile?.full_name ||
      user.email?.split('@')[0] ||
      user.email ||
      'Member';

    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:py-10">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(1200px 700px at -10% -10%, rgba(168,85,247,0.18), transparent 55%), radial-gradient(1100px 700px at 110% 0%, rgba(236,72,153,0.14), transparent 55%), radial-gradient(900px 500px at 50% 120%, rgba(59,130,246,0.14), transparent 60%)',
          }}
        />

        <div className="relative mx-auto w-full max-w-6xl space-y-6">
          <header className="rounded-3xl border border-slate-700/80 bg-slate-900/75 p-6 shadow-[0_28px_110px_rgba(2,6,23,0.55)] backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-violet-300">Dashboard</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Welcome back, {displayName}</h1>
                <p className="mt-2 text-sm text-slate-400">
                  {matches.length > 0
                    ? `${matches.length} active match${matches.length > 1 ? 'es' : ''} ready with compatibility insights.`
                    : 'Your dashboard is ready. New matches will appear here as soon as they are available.'}
                </p>
              </div>
              <LogoutButton className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-800/80" />
            </div>
          </header>

          <section className="grid gap-4 xl:grid-cols-[1fr,1.1fr]">
            <div className="space-y-4">
              <article className="rounded-3xl border border-slate-700/80 bg-slate-900/65 p-6 backdrop-blur">
                <h2 className="text-lg font-medium">Profile Completion</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-700/70 bg-slate-800/55 p-3.5">
                    <p className="text-[11px] uppercase tracking-wider text-slate-400">Onboarding status</p>
                    <p className="mt-1 text-sm font-medium text-emerald-300">Complete</p>
                  </div>
                  <div className="rounded-xl border border-slate-700/70 bg-slate-800/55 p-3.5">
                    <p className="text-[11px] uppercase tracking-wider text-slate-400">Saved categories</p>
                    <p className="mt-1 text-sm font-medium text-slate-100">{responsesCount ?? 0}</p>
                  </div>
                </div>
                <Link
                  href="/app/profile"
                  className="mt-5 inline-flex items-center justify-center rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2.5 text-sm font-medium text-violet-200 hover:border-violet-300/50 hover:bg-violet-500/20"
                >
                  Go to profile →
                </Link>
              </article>

              <article className="rounded-3xl border border-slate-700/80 bg-slate-900/65 p-6 backdrop-blur">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-300">Today at a glance</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-700/70 bg-slate-800/55 p-3.5">
                    <p className="text-[11px] uppercase tracking-wider text-slate-400">Best matches</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-100">{matches.length}</p>
                  </div>
                  <div className="rounded-xl border border-slate-700/70 bg-slate-800/55 p-3.5">
                    <p className="text-[11px] uppercase tracking-wider text-slate-400">Profile quality</p>
                    <p className="mt-1 text-2xl font-semibold text-violet-200">Strong</p>
                  </div>
                </div>
              </article>
            </div>

            <article className="rounded-3xl border border-slate-700/80 bg-slate-900/65 p-5 backdrop-blur">
              <div className="mb-4">
                <h2 className="text-xl font-semibold tracking-tight">Your Best Matches</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {matches.length > 0
                    ? `${matches.length} active match${matches.length > 1 ? 'es' : ''} with compatibility insight`
                    : 'No active matches yet.'}
                </p>
              </div>

              {matches.length > 0 ? (
                <div className="space-y-4">
                  {matches.slice(0, 1).map(match => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                  <Link
                    href="/matches"
                    className="inline-flex w-full items-center justify-center rounded-xl border border-violet-400/35 bg-gradient-to-r from-violet-500/30 to-fuchsia-500/25 px-4 py-3 text-sm font-semibold text-violet-100 hover:from-violet-500/45 hover:to-fuchsia-500/40"
                  >
                    View all matches →
                  </Link>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/55 px-4 py-8 text-center text-sm text-slate-400">
                  No real matches yet. Add manual rows in `matches`.
                </div>
              )}
            </article>
          </section>
        </div>
      </main>
    );
  } catch (error) {
    console.error('dashboard page failed:', error);
    redirect('/auth/login');
  }
}
