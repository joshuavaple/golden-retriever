import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: {
      '@spec': new URL('../spec', import.meta.url).pathname,
    },
  },
  server: { fs: { allow: ['..'] } },
  test: { include: ['tests/**/*.test.ts'] },
});
