import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mantine/core',
      '@mantine/hooks',
      '@mantine/notifications',
      '@mantine/dates',
      '@tabler/icons-react',
      'dayjs'
    ],
  },
  
  // Build optimizations
  build: {
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    
    // Manual chunking strategy
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mantine-vendor': [
            '@mantine/core',
            '@mantine/hooks',
            '@mantine/notifications',
            '@mantine/dates'
          ],
          'icons': ['@tabler/icons-react'],
        },
      },
    },
  },
  
  // Server configuration for development
  server: {
    port: 3002,
    // Enable pre-bundling of dependencies
    warmup: {
      clientFiles: [
        './src/main.tsx',
        './src/App.tsx',
        './src/pages/TorqueApp.tsx',
        './src/components/layout/PageRenderer.tsx',
      ],
    },
  },
})
