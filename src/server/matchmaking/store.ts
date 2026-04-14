import { CURRENT_USER, MATCHES, PROFILES } from '@/lib/mockData';
import type { UserProfile } from '@/lib/types';
import type {
  MatchmakingCandidateScore,
  MatchmakingRun,
  MatchmakingSignal,
  MatchmakingStore,
} from './types';

declare global {
  var __kindredMatchStore:
    | {
        signals: MatchmakingSignal[];
        recs: Map<string, MatchmakingCandidateScore[]>;
        runs: MatchmakingRun[];
      }
    | undefined;
}

function getState() {
  if (!globalThis.__kindredMatchStore) {
    globalThis.__kindredMatchStore = {
      signals: [],
      recs: new Map<string, MatchmakingCandidateScore[]>(),
      runs: [],
    };
  }
  return globalThis.__kindredMatchStore;
}

const ALL_USERS: UserProfile[] = [CURRENT_USER, ...PROFILES];

export class InMemoryMatchmakingStore implements MatchmakingStore {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return ALL_USERS.find(u => u.id === userId) ?? null;
  }

  async listCandidateProfiles(userId: string): Promise<UserProfile[]> {
    return ALL_USERS.filter(u => u.id !== userId);
  }

  async listPairSignals(userId: string, candidateId: string, lookbackDays: number): Promise<MatchmakingSignal[]> {
    const state = getState();
    const cutoff = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;
    return state.signals.filter(signal => {
      const ts = new Date(signal.createdAt).getTime();
      if (ts < cutoff) return false;
      const isForward = signal.actorUserId === userId && signal.targetUserId === candidateId;
      const isBackward = signal.actorUserId === candidateId && signal.targetUserId === userId;
      return isForward || isBackward;
    });
  }

  async getSignalsByIdempotencyKey(idempotencyKey: string): Promise<MatchmakingSignal | null> {
    const state = getState();
    return state.signals.find(signal => signal.idempotencyKey === idempotencyKey) ?? null;
  }

  async insertSignal(signal: MatchmakingSignal): Promise<void> {
    const state = getState();
    state.signals.push(signal);
  }

  async saveRun(run: MatchmakingRun): Promise<void> {
    const state = getState();
    state.runs.push(run);
  }

  async saveRecommendations(userId: string, recommendations: MatchmakingCandidateScore[]): Promise<void> {
    const state = getState();
    state.recs.set(userId, recommendations);
  }

  async getRecommendations(userId: string, limit: number): Promise<MatchmakingCandidateScore[]> {
    const state = getState();
    const existing = state.recs.get(userId);
    if (existing?.length) return existing.slice(0, limit);

    // Seed from existing mock matches so API has immediate value before first run.
    const seeded = MATCHES.map(match => ({
      userId: match.profile.id,
      compatibilityScore: match.compatibilityScore,
      breakdown: match.compatibilityBreakdown,
      reasons: [match.aiReason],
      whySignals: ['Seeded from existing compatibility dataset'],
      confidence: 'medium' as const,
      generatedAt: new Date().toISOString(),
    }));
    state.recs.set(userId, seeded);
    return seeded.slice(0, limit);
  }
}

export function getMatchmakingStore(): MatchmakingStore {
  return new InMemoryMatchmakingStore();
}
