import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    // Gera .br para Brotli — ~30-40% menor que gzip, suportado por todos os browsers modernos
    viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),
    // Gera .gz como fallback para servidores/proxies que não servem Brotli
    viteCompression({ algorithm: 'gzip', ext: '.gz' }),
  ],
  server: { port: 5173 },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          axios:  ['axios'],
        }
      }
    }
  }
})
