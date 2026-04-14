import { computeCandidateScore, MATCHMAKING_ENGINE_VERSION } from './engine';
import { getMatchmakingStore } from './store';
import type {
  MatchmakingResponse,
  MatchmakingRun,
  MatchmakingSignal,
} from './types';

const DEFAULT_LIMIT = 10;
const DEFAULT_LOOKBACK_DAYS = 45;

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function ingestMatchmakingSignal(input: Omit<MatchmakingSignal, 'id' | 'createdAt'>) {
  const store = getMatchmakingStore();
  const existing = await store.getSignalsByIdempotencyKey(input.idempotencyKey);
  if (existing) {
    return { accepted: true, duplicate: true, signal: existing };
  }

  const signal: MatchmakingSignal = {
    id: createId('sig'),
    createdAt: new Date().toISOString(),
    ...input,
  };

  await store.insertSignal(signal);
  return { accepted: true, duplicate: false, signal };
}

export async function runMatchmaking(userId: string, limit = DEFAULT_LIMIT): Promise<MatchmakingResponse> {
  const start = Date.now();
  const store = getMatchmakingStore();
  const user = await store.getUserProfile(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const candidates = await store.listCandidateProfiles(userId);
  const scored = [];
  for (const candidate of candidates) {
    const pairSignals = await store.listPairSignals(userId, candidate.id, DEFAULT_LOOKBACK_DAYS);
    scored.push(computeCandidateScore(user, candidate, pairSignals));
  }

  const recommendations = scored
    .filter(item => item.compatibilityScore >= 40)
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, limit);

  await store.saveRecommendations(userId, recommendations);

  const run: MatchmakingRun = {
    id: createId('run'),
    userId,
    candidateCount: candidates.length,
    createdAt: new Date().toISOString(),
    durationMs: Date.now() - start,
    version: MATCHMAKING_ENGINE_VERSION,
  };
  await store.saveRun(run);

  return {
    userId,
    generatedAt: run.createdAt,
    version: MATCHMAKING_ENGINE_VERSION,
    recommendations,
  };
}

export async function getMatchmakingRecommendations(userId: string, limit = DEFAULT_LIMIT): Promise<MatchmakingResponse> {
  const store = getMatchmakingStore();
  const recommendations = await store.getRecommendations(userId, limit);
  return {
    userId,
    generatedAt: new Date().toISOString(),
    version: MATCHMAKING_ENGINE_VERSION,
    recommendations,
  };
}

