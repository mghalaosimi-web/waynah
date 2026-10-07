import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
  plugins: [
    tsconfigPaths({ projects: ['./tsconfig.test.json'] }),
  ],
  resolve: {
    alias: {
      '@waynah/search': path.resolve(__dirname, '../../packages/search/src/index.ts'),
      '@waynah/database': path.resolve(__dirname, '../../packages/database/src/index.ts'),
      '@waynah/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
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
