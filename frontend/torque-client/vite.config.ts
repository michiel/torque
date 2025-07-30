import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'

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
  
  // Build configuration for library mode
  build: {
    lib: {
      entry: resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/index.ts'),
      name: 'TorqueClient',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format}.js`
    },
    rollupOptions: {
      // Make sure to externalize deps that shouldn't be bundled
      external: [
        'react',
        'react-dom',
        'react-router-dom',
        '@mantine/core',
        '@mantine/hooks',
        '@mantine/notifications',
        '@mantine/dates',
        '@mantine/modals',
        '@tabler/icons-react',
        'dayjs',
        'react-hook-form',
        '@hookform/resolvers',
        'uuid',
        'zod'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react-router-dom': 'ReactRouterDOM'
        }
      }
    }
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
