import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // The integration tests share one test database, so run files one after another
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
