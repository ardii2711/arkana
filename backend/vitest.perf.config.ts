import { defineConfig } from 'vitest/config';

/**
 * Config terpisah agar measurement performa tidak ikut suite biasa.
 * `mergeConfig` tidak dipakai: array `include` ikut tergabung sehingga seluruh test terpanggil.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/perf/*.perf.ts'],
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 300_000,
    hookTimeout: 300_000,
  },
});
