import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: 'index.html',
        content: 'src/content/content.ts',
        background: 'src/background/background.ts',
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'content') {
            return 'src/content/[name].js'
          }
          if (chunkInfo.name === 'background') {
            return 'src/background/[name].js'
          }
          return 'assets/[name]-[hash].js'
        },
      },
    },
  },
})
