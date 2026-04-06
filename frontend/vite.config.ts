import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — cached aggressively by browsers
          vendor: ['react', 'react-dom'],
          // Router — changes infrequently, split to improve cache hit rate
          router: ['react-router-dom'],
          // TanStack Query — data-fetching library, rarely changes
          query: ['@tanstack/react-query'],
          // Radix UI primitives bundled together to avoid many tiny chunks
          radix: [
            '@radix-ui/react-accordion',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-select',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
          ],
        },
      },
    },
  },
})
