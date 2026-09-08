import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['worker/**/*.test.ts', 'scripts/**/*.test.mjs', 'app/lib/**/*.test.ts'],
    environment: 'node',
  },
});
