import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    tsconfigPaths({ projects: ['./tsconfig.test.json'] }),
  ],
  resolve: {
    // Resolve .js ESM imports to their .ts source counterparts.
    // Required because TypeScript ESM convention mandates .js extension in imports,
    // but Vitest runs against TypeScript sources directly.
    extensionAlias: {
      '.js': ['.ts', '.js'],
    },
  },
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
