import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Honor an assigned PORT (e.g. from tooling) instead of always claiming 5173.
  server: { port: Number(process.env.PORT) || 5173 },
})
