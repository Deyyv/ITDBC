import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { localApiPlugin } from './server/localApi.js'

export default defineConfig({
  plugins: [react(), localApiPlugin()],
})