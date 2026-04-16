import Link from 'next/link';
import { User } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '../../../../utils/supabase/server';
import { findMatchById, getMatchesForUser } from '@/lib/matches';

type MatchDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MatchDetailPage({ params }: MatchDetailPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?next=/matches/${id}`);
  }

  const { data: preferenceRow } = await supabase
    .from('match_preferences')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!preferenceRow) {
    redirect('/onboarding');
  }

  const matches = await getMatchesForUser(supabase, user.id);
  const match = findMatchById(matches, id);
  if (!match) {
    notFound();
  }
  const createdAtLabel = new Date(match.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const trustSignals = [
    match.matchedProfile.photos.length > 0
      ? `${match.matchedProfile.photos.length} profile photo${match.matchedProfile.photos.length > 1 ? 's' : ''}`
      : 'Profile ready for photos',
    match.compatibilityReasons.length >= 3 ? 'Strong compatibility coverage' : 'Early compatibility snapshot',
    `Matched on ${createdAtLabel}`,
  ];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <Link href="/matches" className="inline-flex text-sm text-violet-300 hover:text-violet-200">
          ← Back to matches
        </Link>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
          <div className="relative h-56 sm:h-72">
            {match.matchedProfile.photoUrl ? (
              <img
                src={match.matchedProfile.photoUrl}
                alt={match.matchedProfile.firstName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                <User size={56} className="text-slate-500" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/25 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h1 className="text-3xl font-semibold tracking-tight">
                {match.matchedProfile.firstName}
                {typeof match.matchedProfile.age === 'number' ? `, ${match.matchedProfile.age}` : ''}
              </h1>
              <p className="mt-1 text-sm text-slate-200/90">{match.matchedProfile.location || 'Location not shared yet'}</p>
            </div>
          </div>
          <div className="p-6">
            <p className="text-sm leading-6 text-slate-300">
              {match.matchedProfile.bio || 'No bio shared yet.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {trustSignals.map(signal => (
                <span
                  key={signal}
                  className="rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1 text-xs text-slate-300"
                >
                  {signal}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-lg font-medium">Photos</h2>
          {match.matchedProfile.photos.length > 0 ? (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {match.matchedProfile.photos.map(photo => (
                <div key={photo} className="aspect-square overflow-hidden rounded-xl border border-slate-800">
                  <img src={photo} alt={match.matchedProfile.firstName} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-400">No photos uploaded yet.</p>
          )}
        </section>

        <section className="rounded-2xl border border-violet-500/25 bg-violet-500/10 p-6">
          <h2 className="text-lg font-medium">Why this match fits</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {match.explanation || 'This match was manually curated based on profile fit and onboarding alignment.'}
          </p>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-lg font-medium">Compatibility reasons</h2>
          {match.compatibilityReasons.length > 0 ? (
            <ul className="mt-3 grid gap-2">
              {match.compatibilityReasons.map(reason => (
                <li
                  key={reason}
                  className="rounded-xl border border-slate-700/70 bg-slate-800/60 px-3 py-2 text-sm text-slate-200"
                >
                  {reason}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-400">No compatibility reasons were added yet.</p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-lg font-medium">Trust signals</h2>
          <p className="mt-2 text-sm text-slate-400">
            This match is shown in your private match feed and visible only to your authenticated account.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {trustSignals.map(signal => (
              <div key={signal} className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300">
                {signal}
              </div>
            ))}
          </div>
        </section>

        <section className="pb-1">
          <Link
            href="/app/messages"
            className="inline-flex w-full items-center justify-center rounded-xl border border-violet-400/35 bg-gradient-to-r from-violet-500/30 to-fuchsia-500/25 px-4 py-3 text-sm font-semibold text-violet-100 hover:from-violet-500/45 hover:to-fuchsia-500/40"
          >
            Message This Match
          </Link>
        </section>
      </div>
    </main>
  );
}
