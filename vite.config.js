import { defineConfig } from 'vite'

// Static wedding invitation — no React needed
export default defineConfig({
  base: '/wedding/',
  server: {
    open: true,
  },
})
