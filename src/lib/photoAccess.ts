export type PhotoAccessContext = {
  isMutualMatch: boolean;
  isSelf?: boolean;
  isAdminOrModeratorView?: boolean;
};

const DISABLED_VALUES = new Set(['0', 'false', 'off', 'no']);

export function isNoPhotosFirstEnabled(): boolean {
  const raw = process.env.NO_PHOTOS_FIRST_ENABLED;
  if (!raw) return true;
  return !DISABLED_VALUES.has(raw.trim().toLowerCase());
}

export function canViewPhotos({
  isMutualMatch,
  isSelf = false,
  isAdminOrModeratorView = false,
}: PhotoAccessContext): boolean {
  if (!isNoPhotosFirstEnabled()) return true;
  if (isSelf) return true;
  if (isAdminOrModeratorView) return true;
  return isMutualMatch;
}

export const PHOTOS_UNLOCK_COPY = 'Photos unlock after mutual match';
