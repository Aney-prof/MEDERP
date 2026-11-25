import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { erpApiPlugin } from './server/vitePlugin.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    erpApiPlugin(),
    react(),
    tailwindcss(),
  ],
})
