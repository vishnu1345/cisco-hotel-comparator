import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vitest 3 runs on its own Vite 7 (esbuild), where plugin-react 6 does not
  // configure JSX. Under Vitest only, compile .jsx with the automatic runtime,
  // as the Vite 8 app build already does.
  ...(process.env.VITEST && { esbuild: { jsx: 'automatic' } }),
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    globals: true,
  },
})
