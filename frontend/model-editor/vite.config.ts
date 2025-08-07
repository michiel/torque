import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

// Custom plugin to serve Tauri port file
const tauriPortPlugin = () => ({
  name: 'tauri-port',
  configureServer(server: any) {
    server.middlewares.use('/api/tauri-port', (req: any, res: any) => {
      try {
        // Set CORS headers to allow access from any origin
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        // Handle OPTIONS preflight request
        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }
        
        // Try to read the port file written by the Tauri server
        const portFilePath = join(homedir(), '.local', 'share', 'torque-desktop', 'server_port.txt');
        const port = readFileSync(portFilePath, 'utf8').trim();
        res.setHeader('Content-Type', 'text/plain');
        res.end(port);
      } catch (error) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.statusCode = 404;
        res.end('Port file not found');
      }
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tauriPortPlugin()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/graphql': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          graphql: ['@apollo/client', 'graphql'],
          ui: ['@mantine/core', '@mantine/hooks']
        }
      }
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.env.VITE_TAURI_DEV': JSON.stringify(process.env.VITE_TAURI_DEV || 'false')
  }
})