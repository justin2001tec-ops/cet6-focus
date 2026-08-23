import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_PUBLIC_BASE ?? (process.env.GITHUB_ACTIONS ? '/cet6-focus/' : '/'),
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  server: {
    port: 4173,
  },
})
