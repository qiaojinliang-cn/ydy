import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5173, proxy: { '/api': 'http://127.0.0.1:7817' } },
  preview: { host: '127.0.0.1', port: 5174 },
  test: {
    include: ['src/**/*.test.ts'],
    coverage: { provider: 'v8', include: ['src/state.ts'], thresholds: { lines: 80, functions: 80, statements: 80, branches: 80 } }
  }
});
