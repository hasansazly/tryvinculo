import type { Match, UserProfile } from '@/lib/types';

export type MatchmakingSignalType =
  | 'profile_view'
  | 'like'
  | 'pass'
  | 'message_sent'
  | 'message_received'
  | 'spark_answered'
  | 'date_planned'
  | 'report';

export interface MatchmakingSignal {
  id: string;
  idempotencyKey: string;
  actorUserId: string;
  targetUserId: string;
  type: MatchmakingSignalType;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface MatchmakingBreakdown {
  values: number;
  communication: number;
  lifestyle: number;
  interests: number;
  goals: number;
  emotional: number;
}

export interface MatchmakingCandidateScore {
  userId: string;
  compatibilityScore: number;
  breakdown: MatchmakingBreakdown;
  reasons: string[];
  whySignals: string[];
  confidence: 'low' | 'medium' | 'high';
  generatedAt: string;
}

export interface MatchmakingRun {
  id: string;
  userId: string;
  candidateCount: number;
  createdAt: string;
  durationMs: number;
  version: string;
}

export interface MatchmakingStore {
  getUserProfile(userId: string): Promise<UserProfile | null>;
  listCandidateProfiles(userId: string): Promise<UserProfile[]>;
  listPairSignals(userId: string, candidateId: string, lookbackDays: number): Promise<MatchmakingSignal[]>;
  getSignalsByIdempotencyKey(idempotencyKey: string): Promise<MatchmakingSignal | null>;
  insertSignal(signal: MatchmakingSignal): Promise<void>;
  saveRun(run: MatchmakingRun): Promise<void>;
  saveRecommendations(userId: string, recommendations: MatchmakingCandidateScore[]): Promise<void>;
  getRecommendations(userId: string, limit: number): Promise<MatchmakingCandidateScore[]>;
}

export interface MatchmakingResponse {
  userId: string;
  generatedAt: string;
  version: string;
  recommendations: MatchmakingCandidateScore[];
}

export interface MatchWithSignals extends Match {
  whySignals?: string[];
}

