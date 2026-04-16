import Link from 'next/link';
import { User } from 'lucide-react';
import type { MatchView } from '@/lib/matches';

function truncate(text: string, max = 140) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export default function MatchCard({ match }: { match: MatchView }) {
  const reasons = match.compatibilityReasons.slice(0, 3);
  const summary = truncate(match.explanation || 'Strong intent and value alignment with clear relationship potential.', 108);
  const potentialFit =
    typeof match.compatibilityScore === 'number' && match.compatibilityScore >= 50 && match.compatibilityScore < 65;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/75 shadow-[0_24px_80px_rgba(2,6,23,0.55)]">
      <div className="relative h-52">
        {match.matchedProfile.photoUrl ? (
          <img
            src={match.matchedProfile.photoUrl}
            alt={match.matchedProfile.firstName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
            <User size={42} className="text-slate-500" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="inline-flex items-center rounded-full border border-violet-400/30 bg-violet-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-violet-200">
            {match.matchedProfile.photos.length > 0
              ? `${match.matchedProfile.photos.length} photo${match.matchedProfile.photos.length > 1 ? 's' : ''}`
              : 'Profile pending photos'}
          </div>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-100">
            {match.matchedProfile.firstName}
            {typeof match.matchedProfile.age === 'number' ? `, ${match.matchedProfile.age}` : ''}
          </h3>
          <p className="text-sm text-slate-300/90">{match.matchedProfile.location || 'Location not shared yet'}</p>
        </div>
      </div>

      <div className="p-4">
        <p className="text-sm leading-6 text-slate-300">{truncate(match.matchedProfile.bio || 'No bio shared yet.', 120)}</p>

        <div className="mt-4 rounded-xl border border-violet-500/25 bg-violet-500/10 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-200/90">Why this match fits</p>
          <p className="mt-1.5 text-sm text-violet-100/90">{summary}</p>
        </div>

        {reasons.length > 0 && (
          <ul className="mt-4 grid gap-2 sm:grid-cols-1">
            {reasons.map(reason => (
              <li
                key={reason}
                className="rounded-lg border border-slate-700/70 bg-slate-800/60 px-3 py-2 text-sm text-slate-200"
              >
                {reason}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4">
          {potentialFit ? (
            <p className="mb-2 rounded-lg border border-amber-400/35 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-200">
              Potential Fit (exploratory compatibility range)
            </p>
          ) : null}
          <Link
            href={`/matches/${match.id}`}
            className="inline-flex w-full items-center justify-center rounded-xl border border-violet-400/35 bg-gradient-to-r from-violet-500/30 to-fuchsia-500/25 px-4 py-2.5 text-sm font-semibold text-violet-100 hover:from-violet-500/45 hover:to-fuchsia-500/40"
          >
            View match
          </Link>
        </div>
      </div>
    </article>
  );
}
