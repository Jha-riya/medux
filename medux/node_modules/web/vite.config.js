import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'media-core': path.resolve(__dirname, '../../packages/media-core/src/index.ts'),
      'media-react': path.resolve(__dirname, '../../packages/media-react/src/index.ts'),
      'media-ui-react': path.resolve(__dirname, '../../packages/media-ui-react/src/index.ts'),
    },
  },
})
