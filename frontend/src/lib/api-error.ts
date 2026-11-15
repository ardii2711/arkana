import axios from 'axios';

import type { ApiFailure } from '@/types/api';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number | null;
  readonly details?: unknown;

  constructor(code: string, message: string, status: number | null = null, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function isApiFailure(value: unknown): value is ApiFailure {
  if (typeof value !== 'object' || value === null) return false;

  const { success, error } = value as ApiFailure;
  return (
    success === false &&
    typeof error === 'object' &&
    error !== null &&
    typeof error.code === 'string'
  );
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? null;
    const body: unknown = error.response?.data;

    if (isApiFailure(body)) {
      return new ApiError(body.error.code, body.error.message, status, body.error.details);
    }

    if (status === null) {
      return new ApiError(
        error.code === 'ECONNABORTED' ? 'TIMEOUT' : 'NETWORK_ERROR',
        'Tidak dapat terhubung ke server.',
      );
    }

    return new ApiError('REQUEST_FAILED', `Permintaan gagal (${status}).`, status);
  }

  return new ApiError('UNKNOWN_ERROR', 'Terjadi kesalahan yang tidak dikenali.');
}

export function getErrorMessage(
  error: unknown,
  fallback = 'Terjadi kesalahan. Coba lagi.',
): string {
  return error instanceof ApiError ? error.message : fallback;
}
