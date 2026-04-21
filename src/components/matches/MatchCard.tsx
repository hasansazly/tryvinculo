import Link from 'next/link';
import { Lock, User } from 'lucide-react';
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
    <article className="app-card match-card discover-match-card group overflow-hidden rounded-[30px] border border-white/10 bg-[#141120] shadow-[0_24px_64px_rgba(0,0,0,0.42)] transition duration-300 hover:-translate-y-0.5 hover:border-[#9A63F1]">
      <div className="match-photo-area discover-photo-area relative h-[520px]">
        {match.canViewPhotos && match.matchedProfile.photoUrl ? (
          <img
            src={match.matchedProfile.photoUrl}
            alt={match.matchedProfile.firstName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(150deg,#532A89_0%,#A84F7D_56%,#E48373_100%)]">
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="text-[86px] leading-none">🌸</span>
              <User size={38} className="text-white/45" />
              {!match.canViewPhotos ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-black/20 px-3 py-1 text-[11px] font-medium text-white">
                  <Lock size={12} />
                  {match.photosLockedReason || 'Photos unlock after mutual match'}
                </span>
              ) : null}
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-4 right-4 z-10 inline-flex items-center rounded-full border border-white/20 bg-black/35 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#F5EEF8]">
          {match.canViewPhotos
            ? match.matchedProfile.photos.length > 0
              ? `${match.matchedProfile.photos.length} photo${match.matchedProfile.photos.length > 1 ? 's' : ''}`
              : 'Profile pending photos'
            : 'Photos unlock after mutual match'}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 discover-hero-copy">
          <h3 className="mt-2 text-[56px] font-semibold leading-[0.92] tracking-[-0.025em] text-[#F7F8FF] discover-match-name" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
            {match.matchedProfile.firstName}
            {typeof match.matchedProfile.age === 'number' ? `, ${match.matchedProfile.age}` : ''}
          </h3>
          <p className="mt-1 text-lg text-white/80 discover-match-location">✨ {match.matchedProfile.location || 'Location not shared yet'}</p>
          <p className="mt-0.5 text-sm text-white/85 discover-match-bio">{truncate(match.matchedProfile.bio || 'Intentional dater on Vinculo.', 82)}</p>
        </div>
      </div>

      <div className="p-4 pt-3">
        {reasons.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {reasons.map(reason => (
              <li
                key={reason}
                className="inline-flex items-center rounded-full border border-white/35 bg-white/10 px-3 py-1 text-[12px] text-[#F5EEF8]"
              >
                {reason}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 rounded-2xl border border-white/10 bg-[#171327] p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#C7B0D5]">Why this match fits</p>
          <p className="mt-1.5 text-[14px] leading-6 text-[#F0E6F4]">{summary}</p>
          {potentialFit ? (
            <p className="mb-2 rounded-md border border-[#8B6A2E]/55 bg-[#2A2112] px-3 py-1.5 text-xs font-medium text-[#F4C977]">
              Potential Fit (exploratory compatibility range)
            </p>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <span className="inline-flex min-h-12 items-center justify-center rounded-[16px] border border-white/20 bg-transparent text-2xl text-white/90">✕</span>
          <span className="inline-flex min-h-12 items-center justify-center rounded-[16px] border border-white/20 bg-transparent text-2xl text-[#FFD15C]">★</span>
          <Link
            href={`/matches/${match.id}`}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-[16px] border border-[#7E62F2]/60 bg-gradient-to-r from-[#4D5FE6] via-[#7E46DB] to-[#D02E8B] px-4 py-3 text-base font-semibold text-white transition hover:brightness-110"
          >
            ❤
          </Link>
        </div>
      </div>
    </article>
  );
}
