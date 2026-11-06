import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: {
      '@spec': new URL('../spec', import.meta.url).pathname,
    },
  },
  server: {
    fs: { allow: ['..'] },
    // The backend is a separate process (see backend/README.md); the frontend works without it.
    proxy: { '/api': 'http://127.0.0.1:8000' },
  },
  test: { include: ['tests/**/*.test.ts'] },
});
