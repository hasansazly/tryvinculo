import type { SupabaseClient } from '@supabase/supabase-js';
import { isCoupleModeEnabled, pairIsDisabled, resolveCoupleContext } from '@/server/couples/service';

type CoupleModePreferenceRow = {
  user_id: string;
  enabled: boolean;
  updated_at: string;
};

export type CoupleModeState = {
  featureEnabled: boolean;
  migrationRequired: boolean;
  hasCouple: boolean;
  pairUnavailable: boolean;
  coupleId: string | null;
  viewerUserId: string;
  partnerUserId: string | null;
  selfEnabled: boolean;
  partnerEnabled: boolean | null;
  effectiveOn: boolean;
  updatedAt: string | null;
};

function looksLikeMissingTable(error: { code?: string; message?: string } | null | undefined, table: string) {
  if (!error) return false;
  return error.code === 'PGRST205' || Boolean(error.message?.includes(`public.${table}`));
}

export async function getCoupleModeState(
  supabase: SupabaseClient,
  viewerUserId: string
): Promise<CoupleModeState> {
  if (!isCoupleModeEnabled()) {
    return {
      featureEnabled: false,
      migrationRequired: false,
      hasCouple: false,
      pairUnavailable: false,
      coupleId: null,
      viewerUserId,
      partnerUserId: null,
      selfEnabled: false,
      partnerEnabled: null,
      effectiveOn: false,
      updatedAt: null,
    };
  }

  const context = await resolveCoupleContext(supabase, viewerUserId);
  if (!context) {
    return {
      featureEnabled: true,
      migrationRequired: false,
      hasCouple: false,
      pairUnavailable: false,
      coupleId: null,
      viewerUserId,
      partnerUserId: null,
      selfEnabled: false,
      partnerEnabled: null,
      effectiveOn: false,
      updatedAt: null,
    };
  }

  const pairUnavailable = await pairIsDisabled(supabase, viewerUserId, context.partnerUserId);
  if (pairUnavailable) {
    return {
      featureEnabled: true,
      migrationRequired: false,
      hasCouple: true,
      pairUnavailable: true,
      coupleId: context.couple.id,
      viewerUserId,
      partnerUserId: context.partnerUserId,
      selfEnabled: false,
      partnerEnabled: false,
      effectiveOn: false,
      updatedAt: null,
    };
  }

  const { data: rows, error } = await supabase
    .from('couple_mode_preferences')
    .select('user_id,enabled,updated_at')
    .in('user_id', [viewerUserId, context.partnerUserId])
    .returns<CoupleModePreferenceRow[]>();

  if (error) {
    if (looksLikeMissingTable(error, 'couple_mode_preferences')) {
      return {
        featureEnabled: true,
        migrationRequired: true,
        hasCouple: true,
        pairUnavailable: false,
        coupleId: context.couple.id,
        viewerUserId,
        partnerUserId: context.partnerUserId,
        selfEnabled: false,
        partnerEnabled: false,
        effectiveOn: false,
        updatedAt: null,
      };
    }
    throw error;
  }

  const byUser = new Map((rows ?? []).map(row => [row.user_id, row]));
  const self = byUser.get(viewerUserId) ?? null;
  const partner = byUser.get(context.partnerUserId) ?? null;
  const selfEnabled = Boolean(self?.enabled);
  const partnerEnabled = partner ? Boolean(partner.enabled) : false;
  const effectiveOn = selfEnabled && partnerEnabled;

  return {
    featureEnabled: true,
    migrationRequired: false,
    hasCouple: true,
    pairUnavailable: false,
    coupleId: context.couple.id,
    viewerUserId,
    partnerUserId: context.partnerUserId,
    selfEnabled,
    partnerEnabled,
    effectiveOn,
    updatedAt: self?.updated_at ?? null,
  };
}

export async function isDatingLockedForUser(supabase: SupabaseClient, viewerUserId: string) {
  const state = await getCoupleModeState(supabase, viewerUserId);
  return state.featureEnabled && state.hasCouple && state.selfEnabled;
}
