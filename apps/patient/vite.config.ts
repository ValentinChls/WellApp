import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// App patient « WPA » — PWA pure (web only, pas de natif).
export default defineConfig({
  // Les variables VITE_* (Supabase, VAPID) vivent dans le .env du monorepo.
  envDir: fileURLToPath(new URL('../../', import.meta.url)),
  plugins: [
    react(),
    VitePWA({
      // SW personnalisé (src/sw.ts) pour gérer aussi le Web Push.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Wellpharma',
        short_name: 'Wellpharma',
        description: 'Faire équipe pour votre santé.',
        lang: 'fr',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#009dc5',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
      },
      // SW actif en dev → permet de tester le Web Push sans build de prod.
      devOptions: { enabled: true, type: 'module', suppressWarnings: true },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173 },
})
