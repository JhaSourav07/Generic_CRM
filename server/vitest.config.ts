import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup/testEnv.ts'],
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: ['src/server.ts', 'src/**/*.types.ts'],
      thresholds: {
        lines: 100,
        statements: 100,
        functions: 100,
        branches: 100
      }
    }
  }
});
