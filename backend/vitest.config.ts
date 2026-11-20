import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    // Database dan R2 dipakai bersama antar-file test, jadi dijalankan berurutan.
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 120_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/app.ts',
        'src/server.ts',
        'src/config/**',
        'src/generated/**',
        'src/types/**',
        'src/**/*.types.ts',
      ],
    },
  },
});
