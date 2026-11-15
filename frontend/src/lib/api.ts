import axios, { type AxiosRequestConfig } from 'axios';

import { env } from '@/config/env';
import { toApiError } from '@/lib/api-error';

export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

const NO_REFRESH_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'];

type RetriableConfig = AxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<void> | null = null;

function refreshSession(): Promise<void> {
  refreshPromise ??= api
    .post('/auth/refresh')
    .then(() => undefined)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      throw toApiError(error);
    }

    const config = error.config as RetriableConfig | undefined;
    const skipRefresh =
      !config ||
      config._retry === true ||
      NO_REFRESH_PATHS.some((path) => config.url?.startsWith(path));

    if (!config || skipRefresh) {
      throw toApiError(error);
    }

    config._retry = true;

    try {
      await refreshSession();
    } catch {
      throw toApiError(error);
    }

    return api.request(config);
  },
);
