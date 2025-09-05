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
      console.log(`[TauriPortPlugin] Handling ${req.method} request to /api/tauri-port`);
      
      // Set CORS headers to allow access from any origin
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
      }

      // Use platform-specific data directory path
      let portFilePath: string;
      const platform = process.platform;
      
      try {
        if (platform === 'darwin') {
          // macOS: Try both ProjectDirs path and fallback path
          const projectDirsPath = join(homedir(), 'Library', 'Application Support', 'com.torque.torque-desktop', 'server_port.txt');
          const fallbackPath = join(homedir(), 'Library', 'Application Support', 'torque-desktop', 'server_port.txt');
          
          // Check which path exists
          if (existsSync(projectDirsPath)) {
            portFilePath = projectDirsPath;
            console.log(`[TauriPortPlugin] Using ProjectDirs path: ${portFilePath}`);
          } else if (existsSync(fallbackPath)) {
            portFilePath = fallbackPath;
            console.log(`[TauriPortPlugin] Using fallback path: ${portFilePath}`);
          } else {
            // Default to fallback path for creation
            portFilePath = fallbackPath;
            console.log(`[TauriPortPlugin] Neither path exists, defaulting to fallback: ${portFilePath}`);
          }
        } else if (platform === 'win32') {
          // Windows: %APPDATA%\torque\torque-desktop\data\
          const appData = process.env.APPDATA || join(homedir(), 'AppData', 'Roaming');
          portFilePath = join(appData, 'torque', 'torque-desktop', 'data', 'server_port.txt');
        } else {
          // Linux: ~/.local/share/torque-desktop/
          portFilePath = join(homedir(), '.local', 'share', 'torque-desktop', 'server_port.txt');
        }
        
        console.log(`[TauriPortPlugin] Platform: ${platform}, Port file path: ${portFilePath}`);

        if (req.method === 'GET') {
          // Try to read the port file
          try {
            const port = readFileSync(portFilePath, 'utf8').trim();
            console.log(`[TauriPortPlugin] Found port: ${port}`);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain');
            res.end(port);
          } catch (error) {
            console.log(`[TauriPortPlugin] Port file not found or unreadable:`, error);
            res.statusCode = 404;
            res.end('Port file not found');
          }
        } else if (req.method === 'DELETE') {
          // Clear the stale port file
          try {
            if (existsSync(portFilePath)) {
              unlinkSync(portFilePath);
              console.log(`[TauriPortPlugin] Cleared stale port file`);
              res.statusCode = 200;
              res.end('Port file cleared');
            } else {
              console.log(`[TauriPortPlugin] Port file not found for deletion`);
              res.statusCode = 404;
              res.end('Port file not found');
            }
          } catch (error) {
            console.error(`[TauriPortPlugin] Failed to clear port file:`, error);
            res.statusCode = 500;
            res.end('Failed to clear port file');
          }
        } else {
          res.statusCode = 405;
          res.end('Method not allowed');
        }
      } catch (error) {
        console.error(`[TauriPortPlugin] Plugin error:`, error);
        res.statusCode = 500;
        res.end('Internal server error');
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
      // Exclude /api/tauri-port from proxy (handled by tauriPortPlugin)
      '^/api/(?!tauri-port)': {
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