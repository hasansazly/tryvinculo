import type { SupabaseClient } from '@supabase/supabase-js';
import { canViewPhotos, PHOTOS_UNLOCK_COPY } from '@/lib/photoAccess';

export type MatchView = {
  id: string;
  userId: string;
  matchedUserId: string;
  status: string;
  explanation: string;
  compatibilityReasons: string[];
  createdAt: string;
  compatibilityScore: number | null;
  tierLabel: string | null;
  conversationDisabled: boolean;
  conversationDisabledReason: string | null;
  isMutualMatch: boolean;
  canViewPhotos: boolean;
  photosLockedReason: string | null;
  matchedProfile: {
    fullName: string;
    firstName: string;
    age: number | null;
    location: string;
    bio: string;
    photoUrl: string | null;
    photos: string[];
    interests: string[];
    profileCompleteness: number | null;
    isVerified: boolean;
    relationshipIntent: string;
  };
};

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
}

function firstNonEmptyString(values: unknown[]): string {
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return '';
}

function parseFirstName(fullName: string) {
  const trimmed = fullName.trim();
  if (!trimmed) return 'Member';
  return trimmed.split(/\s+/)[0] || 'Member';
}

type MatchRow = {
  id: string;
  user_id: string;
  matched_user_id: string;
  status: string;
  explanation: string;
  compatibility_reasons: string[] | null;
  created_at: string;
  compatibility_score?: number | null;
  tier_label?: string | null;
  conversation_disabled?: boolean | null;
  conversation_disabled_reason?: string | null;
};

type OnboardingRow = {
  user_id: string;
  category: string;
  response: unknown;
};

type ProfileRow = {
  id: string;
  [key: string]: unknown;
};

type ReciprocalMatchRow = {
  user_id: string;
  matched_user_id: string;
};

export async function getMatchesForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<MatchView[]> {
  const { data: matchRows, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (matchError) {
    return [];
  }
  if (!matchRows || matchRows.length === 0) {
    return [];
  }

  const dedupedRows = (matchRows as MatchRow[]).filter((row, index, all) => {
    // Keep only the first row per matched user (query is already ordered by created_at desc).
    return all.findIndex(item => item.matched_user_id === row.matched_user_id) === index;
  });

  const [{ data: blockRows }, { data: unmatchRows }] = await Promise.all([
    supabase
      .from('blocks')
      .select('blocker_user_id,blocked_user_id')
      .or(`blocker_user_id.eq.${userId},blocked_user_id.eq.${userId}`)
      .returns<Array<{ blocker_user_id: string; blocked_user_id: string }>>(),
    supabase
      .from('unmatches')
      .select('initiated_by_user_id,unmatched_user_id')
      .or(`initiated_by_user_id.eq.${userId},unmatched_user_id.eq.${userId}`)
      .returns<Array<{ initiated_by_user_id: string; unmatched_user_id: string }>>(),
  ]);

  const blockedIds = new Set<string>();
  for (const row of blockRows ?? []) {
    if (row.blocker_user_id === userId) blockedIds.add(row.blocked_user_id);
    if (row.blocked_user_id === userId) blockedIds.add(row.blocker_user_id);
  }

  const unmatchedIds = new Set<string>();
  for (const row of unmatchRows ?? []) {
    if (row.initiated_by_user_id === userId) unmatchedIds.add(row.unmatched_user_id);
    if (row.unmatched_user_id === userId) unmatchedIds.add(row.initiated_by_user_id);
  }

  const rows = dedupedRows.filter(
    row => !blockedIds.has(row.matched_user_id) && !unmatchedIds.has(row.matched_user_id)
  );

  if (rows.length === 0) {
    return [];
  }
  const matchedUserIds = rows.map(row => row.matched_user_id);

  const [{ data: profileRows, error: profileError }, { data: onboardingRows, error: onboardingError }, { data: reciprocalRows }] = await Promise.all([
    supabase.from('profiles').select('*').in('id', matchedUserIds),
    supabase
      .from('onboarding_responses')
      .select('user_id,category,response')
      .in('user_id', matchedUserIds)
      .in('category', ['demographics', 'profile_meta', 'relationship_intent']),
    supabase
      .from('matches')
      .select('user_id,matched_user_id')
      .eq('status', 'active')
      .eq('matched_user_id', userId)
      .in('user_id', matchedUserIds)
      .returns<ReciprocalMatchRow[]>(),
  ]);

  const mutualMatchUserIds = new Set((reciprocalRows ?? []).map(row => row.user_id));

  const byUser = new Map<
    string,
    {
      demographics?: Record<string, unknown>;
      profileMeta?: Record<string, unknown>;
      relationshipIntent?: Record<string, unknown>;
    }
  >();
  (onboardingError ? [] : (onboardingRows as OnboardingRow[] | null))?.forEach(row => {
    if (!row || typeof row.response !== 'object' || row.response === null) return;
    const existing = byUser.get(row.user_id) ?? {};
    if (row.category === 'demographics') {
      existing.demographics = row.response as Record<string, unknown>;
    }
    if (row.category === 'profile_meta') {
      existing.profileMeta = row.response as Record<string, unknown>;
    }
    if (row.category === 'relationship_intent') {
      existing.relationshipIntent = row.response as Record<string, unknown>;
    }
    byUser.set(row.user_id, existing);
  });

  const profilesById = new Map<string, ProfileRow>();
  (profileError ? [] : (profileRows as ProfileRow[] | null))?.forEach(profile => {
    profilesById.set(profile.id, profile);
  });

  return rows.map(row => {
    const snapshot = byUser.get(row.matched_user_id);
    const profile = profilesById.get(row.matched_user_id);
    const demographics = snapshot?.demographics ?? {};
    const profileMeta = snapshot?.profileMeta ?? {};
    const relationshipIntentResponse = snapshot?.relationshipIntent ?? {};
    const profileEmail =
      typeof profile?.email === 'string'
        ? profile.email
        : typeof profile?.user_email === 'string'
          ? profile.user_email
          : '';
    const emailPrefix = profileEmail.includes('@') ? profileEmail.split('@')[0]?.trim() ?? '' : '';

    const fullName =
      firstNonEmptyString([
        (demographics as { fullName?: unknown }).fullName,
        (demographics as { full_name?: unknown }).full_name,
        (demographics as { firstName?: unknown }).firstName,
        (demographics as { first_name?: unknown }).first_name,
        (demographics as { name?: unknown }).name,
        (profileMeta as { fullName?: unknown }).fullName,
        (profileMeta as { full_name?: unknown }).full_name,
        profile?.full_name,
        profile?.first_name,
        profile?.name,
        emailPrefix,
      ]) || 'Member';
    const age =
      typeof demographics.age === 'number'
        ? demographics.age
        : typeof profile?.age === 'number'
          ? profile.age
          : null;
    const location =
      (typeof demographics.location === 'string' ? demographics.location : '') ||
      (typeof profile?.location === 'string' ? profile.location : '') ||
      '';
    const bio =
      (typeof demographics.bio === 'string' ? demographics.bio : '') ||
      (typeof profile?.bio === 'string' ? profile.bio : '') ||
      'Intentional dater on Vinculo.';
    const photos = toStringArray(profileMeta.photos);
    const isMutualMatch = mutualMatchUserIds.has(row.matched_user_id);
    const canViewMatchPhotos = canViewPhotos({
      isMutualMatch,
      isSelf: row.matched_user_id === userId,
    });
    const safePhotos = canViewMatchPhotos ? photos : [];
    const interests = toStringArray(demographics.interests).length
      ? toStringArray(demographics.interests)
      : toStringArray(profile?.interests);
    const relationshipIntent =
      firstNonEmptyString([
        relationshipIntentResponse.relationshipIntent,
        relationshipIntentResponse.relationship_intent,
        profile?.relationship_intent,
      ]) || 'Not shared yet';
    const profileCompleteness =
      typeof profile?.profile_completeness === 'number' ? profile.profile_completeness : null;
    const isVerified = Boolean(profile?.is_verified);

    return {
      id: row.id,
      userId: row.user_id,
      matchedUserId: row.matched_user_id,
      status: row.status,
      explanation: row.explanation || '',
      compatibilityReasons: toStringArray(row.compatibility_reasons),
      createdAt: row.created_at,
      compatibilityScore:
        typeof row.compatibility_score === 'number' ? row.compatibility_score : null,
      tierLabel: typeof row.tier_label === 'string' ? row.tier_label : null,
      conversationDisabled: Boolean(row.conversation_disabled),
      conversationDisabledReason:
        typeof row.conversation_disabled_reason === 'string'
          ? row.conversation_disabled_reason
          : null,
      isMutualMatch,
      canViewPhotos: canViewMatchPhotos,
      photosLockedReason: canViewMatchPhotos ? null : PHOTOS_UNLOCK_COPY,
      matchedProfile: {
        fullName,
        firstName: parseFirstName(fullName),
        age,
        location,
        bio,
        photoUrl: canViewMatchPhotos ? photos[0] ?? null : null,
        photos: safePhotos,
        interests,
        profileCompleteness,
        isVerified,
        relationshipIntent,
      },
    };
  });
}

export function findMatchById(matches: MatchView[], id: string) {
  return matches.find(match => match.id === id) ?? null;
}
