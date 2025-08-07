import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

// Custom plugin to serve Tauri port file
const tauriPortPlugin = () => ({
  name: 'tauri-port',
  configureServer(server: any) {
    server.middlewares.use('/api/tauri-port', (req: any, res: any) => {
      // Set CORS headers to allow access from any origin
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
      }

      const portFilePath = join(homedir(), '.local', 'share', 'torque-desktop', 'server_port.txt');

      if (req.method === 'GET') {
        // Try to read the port file
        try {
          const port = readFileSync(portFilePath, 'utf8').trim();
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/plain');
          res.end(port);
        } catch (error) {
          console.log('Port file not found or unreadable:', error);
          res.statusCode = 404;
          res.end('Port file not found');
        }
      } else if (req.method === 'DELETE') {
        // Clear the stale port file
        try {
          if (existsSync(portFilePath)) {
            unlinkSync(portFilePath);
            console.log('Cleared stale port file:', portFilePath);
            res.statusCode = 200;
            res.end('Port file cleared');
          } else {
            res.statusCode = 404;
            res.end('Port file not found');
          }
        } catch (error) {
          console.error('Failed to clear port file:', error);
          res.statusCode = 500;
          res.end('Failed to clear port file');
        }
      } else {
        res.statusCode = 405;
        res.end('Method not allowed');
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