import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/central/",
  server: {
    port: 5175,
    host: true,
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
})
