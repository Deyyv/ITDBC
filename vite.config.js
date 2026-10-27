import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { localApiPlugin } from './server/localApi.js'

export default defineConfig({
  plugins: [react(), localApiPlugin()],
  build: {
    // The lazy TwinCanvas chunk (three.js + fiber + drei, ~940 kB) is expected; only it exceeds 500 kB.
    chunkSizeWarningLimit: 1000,
  },
})