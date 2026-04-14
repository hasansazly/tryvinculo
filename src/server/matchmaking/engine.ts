import type { UserProfile } from '@/lib/types';
import type {
  MatchmakingBreakdown,
  MatchmakingCandidateScore,
  MatchmakingSignal,
} from './types';

const ENGINE_VERSION = 'v1.0.0';

function overlapScore(a: string[], b: string[], idealOverlap = 3): number {
  const setA = new Set(a.map(v => v.toLowerCase()));
  const matches = b.filter(v => setA.has(v.toLowerCase())).length;
  const ratio = Math.min(1, matches / idealOverlap);
  return Math.round(ratio * 100);
}

function attachmentCompatibility(a: UserProfile['attachmentStyle'], b: UserProfile['attachmentStyle']): number {
  const matrix: Record<string, Record<string, number>> = {
    secure: { secure: 96, anxious: 84, avoidant: 76, disorganized: 70 },
    anxious: { secure: 86, anxious: 72, avoidant: 54, disorganized: 50 },
    avoidant: { secure: 80, anxious: 56, avoidant: 62, disorganized: 52 },
    disorganized: { secure: 74, anxious: 58, avoidant: 54, disorganized: 48 },
  };
  return matrix[a]?.[b] ?? 65;
}

function loveLanguageCompatibility(a: UserProfile['loveLanguage'], b: UserProfile['loveLanguage']): number {
  if (a === b) return 94;
  const compatiblePairs = new Set(['acts-time', 'time-acts', 'words-touch', 'touch-words', 'gifts-acts', 'acts-gifts']);
  return compatiblePairs.has(`${a}-${b}`) ? 82 : 70;
}

function locationScore(distanceKm: number | undefined): number {
  if (distanceKm === undefined) return 72;
  if (distanceKm <= 3) return 95;
  if (distanceKm <= 10) return 86;
  if (distanceKm <= 25) return 74;
  if (distanceKm <= 50) return 62;
  return 48;
}

function goalScore(a: UserProfile, b: UserProfile): number {
  if (a.relationshipGoal === b.relationshipGoal) return 95;
  if (a.relationshipGoal === 'relationship' && b.relationshipGoal === 'unsure') return 64;
  if (a.relationshipGoal === 'unsure' && b.relationshipGoal === 'relationship') return 64;
  if (a.relationshipGoal === 'casual' && b.relationshipGoal === 'friendship') return 52;
  return 58;
}

function communicationScore(a: UserProfile, b: UserProfile): number {
  const attachment = attachmentCompatibility(a.attachmentStyle, b.attachmentStyle);
  const loveLanguage = loveLanguageCompatibility(a.loveLanguage, b.loveLanguage);
  const personality = overlapScore(a.personalityTraits, b.personalityTraits, 2);
  return Math.round(attachment * 0.5 + loveLanguage * 0.25 + personality * 0.25);
}

function emotionalScore(a: UserProfile, b: UserProfile): number {
  const auraDiff = Math.abs(a.auraScore - b.auraScore);
  const auraScore = Math.max(45, 100 - auraDiff * 2);
  const attachment = attachmentCompatibility(a.attachmentStyle, b.attachmentStyle);
  return Math.round(auraScore * 0.55 + attachment * 0.45);
}

function lifestyleScore(a: UserProfile, b: UserProfile): number {
  let score = locationScore(b.distance);
  if (a.drinking && b.drinking && a.drinking === b.drinking) score += 6;
  if (a.smoking && b.smoking && a.smoking === b.smoking) score += 8;
  if (a.kids && b.kids && a.kids === b.kids) score += 10;
  return Math.min(100, Math.max(0, score));
}

function scoreFromSignals(baseScore: number, signals: MatchmakingSignal[]): {
  adjustedScore: number;
  whySignals: string[];
  confidence: 'low' | 'medium' | 'high';
} {
  let delta = 0;
  const whySignals: string[] = [];
  let positive = 0;
  let negative = 0;

  for (const signal of signals) {
    if (signal.type === 'like' || signal.type === 'message_sent' || signal.type === 'message_received') {
      delta += 3;
      positive += 1;
    }
    if (signal.type === 'spark_answered') {
      delta += 4;
      positive += 1;
    }
    if (signal.type === 'date_planned') {
      delta += 8;
      positive += 1;
      whySignals.push('Recent date planning indicates strong reciprocal intent');
    }
    if (signal.type === 'pass') {
      delta -= 10;
      negative += 1;
      whySignals.push('Prior pass activity lowers short-term recommendation confidence');
    }
    if (signal.type === 'report') {
      delta -= 18;
      negative += 1;
      whySignals.push('Safety report signal applied as a hard penalty');
    }
  }

  if (positive > 0 && !whySignals.length) {
    whySignals.push('Recent mutual engagement increased ranking confidence');
  }

  const adjustedScore = Math.min(100, Math.max(0, Math.round(baseScore + delta)));
  const signalVolume = positive + negative;
  const confidence = signalVolume >= 4 ? 'high' : signalVolume >= 2 ? 'medium' : 'low';

  return { adjustedScore, whySignals, confidence };
}

function topReasons(breakdown: MatchmakingBreakdown, a: UserProfile, b: UserProfile): string[] {
  const ranked = Object.entries(breakdown).sort(([, x], [, y]) => y - x);
  const reasons: string[] = [];
  const top = ranked.slice(0, 2);

  for (const [dimension, score] of top) {
    if (dimension === 'values') {
      const overlap = a.values.filter(v => b.values.includes(v)).slice(0, 2);
      reasons.push(`Strong shared values (${overlap.join(', ') || 'alignment'}) at ${score}%.`);
    } else if (dimension === 'interests') {
      const overlap = a.interests.filter(i => b.interests.includes(i)).slice(0, 3);
      reasons.push(`Interest overlap (${overlap.join(', ') || 'multiple shared interests'}) at ${score}%.`);
    } else if (dimension === 'communication') {
      reasons.push(`Communication style compatibility scored ${score}% from attachment and love-language fit.`);
    } else if (dimension === 'goals') {
      reasons.push(`Relationship goals alignment scored ${score}% for long-term expectation fit.`);
    } else if (dimension === 'emotional') {
      reasons.push(`Emotional compatibility scored ${score}% from aura and attachment signals.`);
    } else if (dimension === 'lifestyle') {
      reasons.push(`Lifestyle alignment scored ${score}% based on distance and daily habit compatibility.`);
    }
  }

  return reasons;
}

export function computeCandidateScore(
  user: UserProfile,
  candidate: UserProfile,
  pairSignals: MatchmakingSignal[]
): MatchmakingCandidateScore {
  const breakdown: MatchmakingBreakdown = {
    values: overlapScore(user.values, candidate.values, 3),
    communication: communicationScore(user, candidate),
    lifestyle: lifestyleScore(user, candidate),
    interests: overlapScore(user.interests, candidate.interests, 4),
    goals: goalScore(user, candidate),
    emotional: emotionalScore(user, candidate),
  };

  const baseScore = Math.round(
    breakdown.values * 0.23 +
      breakdown.communication * 0.21 +
      breakdown.lifestyle * 0.14 +
      breakdown.interests * 0.17 +
      breakdown.goals * 0.15 +
      breakdown.emotional * 0.1
  );

  const signalAdjusted = scoreFromSignals(baseScore, pairSignals);
  const reasons = topReasons(breakdown, user, candidate);
  const whySignals = [
    ...signalAdjusted.whySignals,
    `Engine ${ENGINE_VERSION} combines profile, behavior, and intent signals.`,
  ];

  return {
    userId: candidate.id,
    compatibilityScore: signalAdjusted.adjustedScore,
    breakdown,
    reasons,
    whySignals,
    confidence: signalAdjusted.confidence,
    generatedAt: new Date().toISOString(),
  };
}

export const MATCHMAKING_ENGINE_VERSION = ENGINE_VERSION;

