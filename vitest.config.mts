import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // DB/네트워크에 접속할 수 없는 환경 — 순수 단위 테스트만 수집
    include: ['lib/**/*.test.ts', 'lib/**/*.test.tsx'],
  },
})
