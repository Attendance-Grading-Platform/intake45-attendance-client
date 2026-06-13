import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    vue(),
    // DEPLOYMENT NOTE: vueDevTools is automatically disabled in production builds. 
    // You do not need to manually remove this line before deploying.
    vueDevTools(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },

  // 🚨 DEPLOYMENT NOTE: THE ENTIRE SERVER BLOCK IS IGNORED IN PRODUCTION 🚨
  // When you run `npm run build`, Vite only creates static HTML/CSS/JS files. 
  // It does NOT spin up a Node.js server. Therefore, this proxy will NOT exist 
  // on your live server. It is strictly for bypassing CORS while running `npm run dev`.
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000', // Changed to IPv4 to fix Docker routing
        changeOrigin: true,
        secure: false,
      },
      '/sanctum': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/storage': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})