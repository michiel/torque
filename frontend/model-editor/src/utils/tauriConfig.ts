/**
 * Tauri Configuration Utility
 * 
 * Detects when running inside Tauri and configures endpoints
 * to use the embedded server port dynamically.
 */

import React from 'react';

// Check if we're running inside Tauri
export const isTauri = (): boolean => {
  // Check if we have the Tauri API (production build)
  const hasTauriAPI = typeof window !== 'undefined' && '__TAURI__' in window;
  
  // In development mode, check environment variable that indicates Tauri dev mode
  const isTauriDev = process.env.VITE_TAURI_DEV === 'true';
  
  const result = hasTauriAPI || isTauriDev;
  console.log('[TauriConfig] isTauri check:', result, 'hasTauriAPI:', hasTauriAPI, 'isTauriDev:', isTauriDev, 'VITE_TAURI_DEV:', process.env.VITE_TAURI_DEV);
  return result;
};

// Async version that can check for port file availability as a fallback
export const isTauriAsync = async (): Promise<boolean> => {
  const syncResult = isTauri();
  if (syncResult) return true;
  
  // Fallback: try to access the port file endpoint (indicates Tauri dev mode)
  try {
    const response = await fetch('http://localhost:3000/api/tauri-port');
    const hasPortFile = response.ok;
    console.log('[TauriConfig] Port file check:', hasPortFile);
    return hasPortFile;
  } catch {
    return false;
  }
};

// Get Tauri API if available
const getTauriAPI = () => {
  if (isTauri()) {
    // @ts-ignore - Tauri API is injected at runtime
    return window.__TAURI__;
  }
  return null;
};

// Configuration for different environments
interface TorqueConfig {
  graphqlUrl: string;
  jsonRpcUrl: string;
  websocketUrl: string;
  baseUrl: string;
}

// Default web configuration
const webConfig: TorqueConfig = {
  baseUrl: '',
  graphqlUrl: '/graphql',
  jsonRpcUrl: '/rpc',  
  websocketUrl: 'ws://localhost:8080/ws'
};

// Cache for server port to avoid repeated API calls
let cachedServerPort: number | null = null;
let serverPortPromise: Promise<number> | null = null;

// Get server port from Tauri
const getServerPort = async (): Promise<number> => {
  if (cachedServerPort) {
    return cachedServerPort;
  }
  
  if (serverPortPromise) {
    return serverPortPromise;
  }

  if (!isTauri()) {
    throw new Error('Not running in Tauri environment');
  }

  serverPortPromise = (async () => {
    try {
      // In development mode, we need a different approach
      const isDev = process.env.NODE_ENV === 'development';
      
      if (isDev) {
        // In development, try to read the port from the port file
        console.log('[TauriConfig] Development mode - looking for embedded server...');
        
        // Try to read the port file that the Rust server writes
        try {
          const portFileResponse = await fetch('http://localhost:3000/api/tauri-port');
          if (portFileResponse.ok) {
            const portText = await portFileResponse.text();
            const port = parseInt(portText.trim());
            if (!isNaN(port)) {
              console.log(`[TauriConfig] Found server port from file: ${port}`);
              
              // Verify the server is actually running
              const healthResponse = await fetch(`http://127.0.0.1:${port}/health/health`);
              if (healthResponse.ok) {
                console.log(`[TauriConfig] Verified server health on port ${port}`);
                cachedServerPort = port;
                serverPortPromise = null;
                return port;
              }
            }
          }
        } catch (error) {
          console.log('[TauriConfig] Could not read port file:', error);
        }
        
        // Fallback: try localStorage cache
        const cachedPortStr = localStorage.getItem('tauri_server_port');
        if (cachedPortStr) {
          const testPort = parseInt(cachedPortStr);
          try {
            const response = await fetch(`http://127.0.0.1:${testPort}/health/health`);
            if (response.ok) {
              console.log(`[TauriConfig] Using cached server port ${testPort}`);
              cachedServerPort = testPort;
              serverPortPromise = null;
              return testPort;
            } else {
              localStorage.removeItem('tauri_server_port');
            }
          } catch {
            localStorage.removeItem('tauri_server_port');
          }
        }
        
        // Final fallback: scan for the server (limited range)
        console.log('[TauriConfig] Scanning for embedded server...');
        for (let port = 40000; port < 50000; port += 100) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 200);
            
            const response = await fetch(`http://127.0.0.1:${port}/health/health`, { 
              signal: controller.signal 
            });
            clearTimeout(timeoutId);
            
            if (response.ok) {
              console.log(`[TauriConfig] Found embedded server on port ${port}`);
              localStorage.setItem('tauri_server_port', port.toString());
              cachedServerPort = port;
              serverPortPromise = null;
              return port;
            }
          } catch {
            // Port not responding, continue scanning
          }
        }
        
        throw new Error('Could not find embedded server in development mode');
      } else {
        // Production mode - use Tauri API
        const tauri = getTauriAPI();
        if (!tauri) {
          throw new Error('Tauri API not available');
        }

        // Wait for server to be ready with retries
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds max wait
        
        while (attempts < maxAttempts) {
          try {
            const port = await tauri.core.invoke('get_server_port');
            if (port) {
              cachedServerPort = port;
              serverPortPromise = null;
              return port;
            }
          } catch (error) {
            console.log(`Attempt ${attempts + 1}: Server not ready yet...`);
          }
          
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        throw new Error('Server failed to start within 30 seconds');
      }
    } catch (error) {
      serverPortPromise = null;
      throw error;
    }
  })();

  return serverPortPromise;
};

// Get Tauri-specific configuration
const getTauriConfig = async (): Promise<TorqueConfig> => {
  const port = await getServerPort();
  const baseUrl = `http://127.0.0.1:${port}`;
  
  return {
    baseUrl,
    graphqlUrl: `${baseUrl}/graphql`,
    jsonRpcUrl: `${baseUrl}/rpc`,
    websocketUrl: `ws://127.0.0.1:${port}/ws`
  };
};

// Main configuration function
export const getTorqueConfig = async (): Promise<TorqueConfig> => {
  const isTauriEnv = await isTauriAsync();
  console.log('[TauriConfig] getTorqueConfig called, isTauriAsync():', isTauriEnv);
  if (isTauriEnv) {
    console.log('[TauriConfig] Using Tauri config');
    return await getTauriConfig();
  }
  console.log('[TauriConfig] Using web config:', webConfig);
  return webConfig;
};

// React hook for configuration
export const useTorqueConfig = () => {
  const [config, setConfig] = React.useState<TorqueConfig | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    getTorqueConfig()
      .then(setConfig)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { config, loading, error };
};

// For non-React usage
export const waitForConfig = async (): Promise<TorqueConfig> => {
  return getTorqueConfig();
};

// Test server health
export const testServerHealth = async (config: TorqueConfig): Promise<boolean> => {
  try {
    const response = await fetch(`${config.baseUrl}/health/health`);
    return response.ok;
  } catch {
    return false;
  }
};