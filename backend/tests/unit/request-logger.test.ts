import { describe, expect, it } from 'vitest';

import { sanitizeRequestUrl } from '../../src/middlewares/request-logger';

describe('sanitizeRequestUrl', () => {
  it('membuang query string', () => {
    expect(sanitizeRequestUrl('/api/work-logs?q=rahasia&page=2')).toBe('/api/work-logs');
  });

  it('menyembunyikan token bukti publik', () => {
    expect(
      sanitizeRequestUrl('/api/public/work-logs/token-rahasia/files/123/content?inline=true'),
    ).toBe('/api/public/work-logs/[token]/files/123/content');
  });

  it('menyembunyikan token aktivasi', () => {
    expect(sanitizeRequestUrl('/api/auth/activation/token-rahasia')).toBe(
      '/api/auth/activation/[token]',
    );
  });

  it('membiarkan path lain', () => {
    expect(sanitizeRequestUrl('/api/health')).toBe('/api/health');
  });
});
