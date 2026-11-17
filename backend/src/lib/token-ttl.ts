const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export const TOKEN_TTL_MS = {
  INVITATION: 7 * DAY_MS,
  EMAIL_CHANGE: 7 * DAY_MS,
  PASSWORD_RESET: 60 * MINUTE_MS,
} as const;

/** Label masa berlaku untuk teks email, mis. "7 hari" atau "60 menit". */
export function ttlLabel(ms: number): string {
  if (ms % DAY_MS === 0) {
    return `${ms / DAY_MS} hari`;
  }

  return `${Math.round(ms / MINUTE_MS)} menit`;
}
