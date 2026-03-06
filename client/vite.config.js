import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';

const isCapacitor = process.env.CAPACITOR_BUILD === 'true';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Use real RevenueCat for Capacitor/Android builds, stub for web/Vercel
      ...(!isCapacitor && {
        '@revenuecat/purchases-capacitor': fileURLToPath(
          new URL('./src/lib/purchases-stub.js', import.meta.url)
        ),
      }),
    },
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
