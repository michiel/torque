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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout for port file check
    
    const response = await fetch('http://localhost:3000/api/tauri-port', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    const hasPortFile = response.ok;
    console.log('[TauriConfig] Port file check:', hasPortFile);
    return hasPortFile;
  } catch (error) {
    console.log('[TauriConfig] Port file check failed:', error instanceof Error ? error.message : 'Unknown error');
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
  baseUrl: 'http://localhost:8081',
  graphqlUrl: 'http://localhost:8081/graphql',
  jsonRpcUrl: 'http://localhost:8081/rpc',
  websocketUrl: 'ws://localhost:8081/ws'
};

// Cache for server port to avoid repeated API calls
let cachedServerPort: number | null = null;
let serverPortPromise: Promise<number> | null = null;

// Function to clear cached port (useful when server restarts)
export const clearPortCache = () => {
  console.log('[TauriConfig] Clearing port cache');
  cachedServerPort = null;
  serverPortPromise = null;
};

// Get server port from Tauri
const getServerPort = async (): Promise<number> => {
  if (cachedServerPort) {
    return cachedServerPort;
  }
  
  if (serverPortPromise) {
    return serverPortPromise;
  }

  // Don't check synchronous isTauri() here since we already checked isTauriAsync()
  // The async check is more reliable for detecting Tauri dev mode

  serverPortPromise = (async () => {
    try {
      // Check if we have Tauri API available (production build) or are in actual development mode
      const hasTauriAPI = typeof window !== 'undefined' && '__TAURI__' in window;
      const isDev = process.env.NODE_ENV === 'development' && !hasTauriAPI;
      
      if (isDev) {
        // In development, try to read the port from the port file
        console.log('[TauriConfig] Development mode - looking for embedded server...');
        
        // Try to read the port file that the Rust server writes (with retries)
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            console.log(`[TauriConfig] Reading port file, attempt ${attempt + 1}/3`);
            const portFileResponse = await fetch('http://localhost:3000/api/tauri-port');
            if (portFileResponse.ok) {
              const portText = await portFileResponse.text();
              const port = parseInt(portText.trim());
              if (!isNaN(port)) {
                console.log(`[TauriConfig] Found server port from file: ${port}`);
                
                // Verify the server is actually running with a timeout
                try {
                  const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for health checks
                  
                  const healthResponse = await fetch(`http://127.0.0.1:${port}/health/health`, {
                    signal: controller.signal
                  });
                  clearTimeout(timeoutId);
                  
                  if (healthResponse.ok) {
                    console.log(`[TauriConfig] Verified server health on port ${port}`);
                    cachedServerPort = port;
                    serverPortPromise = null;
                    return port;
                  } else {
                    console.log(`[TauriConfig] Server health check failed: ${healthResponse.status} - port file may be stale`);
                  }
                } catch (healthError) {
                  console.log(`[TauriConfig] Server health check error:`, healthError, '- port file likely stale');
                  // Clear the cached port since the server is not responding
                  cachedServerPort = null;
                  // Try to clear the stale port file by making a delete request
                  try {
                    await fetch('http://localhost:3000/api/tauri-port', { method: 'DELETE' });
                    console.log(`[TauriConfig] Requested clearing of stale port file`);
                  } catch (deleteError) {
                    console.log(`[TauriConfig] Could not clear stale port file:`, deleteError);
                  }
                }
              } else {
                console.log(`[TauriConfig] Invalid port number in file: ${portText}`);
              }
            } else {
              console.log(`[TauriConfig] Port file request failed: ${portFileResponse.status}`);
            }
          } catch (error) {
            console.log(`[TauriConfig] Could not read port file (attempt ${attempt + 1}):`, error);
          }
          
          // Wait before retry (except on last attempt)
          if (attempt < 2) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Longer delay between retries
          }
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
        
        // Final fallback: scan for the server (smart scanning)
        console.log('[TauriConfig] Scanning for embedded server...');
        
        // Start from current port if available, otherwise start from common range
        const startPort = 32000;
        const endPort = 50000;
        const increment = 1; // Check every port for better coverage
        
        console.log(`[TauriConfig] Scanning ports ${startPort} to ${endPort}...`);
        
        for (let port = startPort; port <= endPort; port += increment) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 500); // More reasonable timeout for scanning
            
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
            // Log progress every 1000 ports
            if (port % 1000 === 0) {
              console.log(`[TauriConfig] Scanned up to port ${port}...`);
            }
          }
        }
        
        throw new Error('Could not find embedded server in development mode');
      } else {
        // Production mode - use Tauri API
        console.log('[TauriConfig] Production mode - using Tauri API...');
        const tauri = getTauriAPI();
        if (!tauri) {
          throw new Error('Tauri API not available');
        }

        console.log('[TauriConfig] Tauri API available, checking for server port...');
        
        // Wait for server to be ready with retries
        let attempts = 0;
        const maxAttempts = 60; // 60 seconds max wait (server needs time to start)
        
        while (attempts < maxAttempts) {
          try {
            console.log(`[TauriConfig] Attempt ${attempts + 1}: Calling get_server_port...`);
            const port = await tauri.core.invoke('get_server_port');
            console.log(`[TauriConfig] get_server_port returned:`, port);
            
            if (port && typeof port === 'number') {
              console.log(`[TauriConfig] Server ready on port ${port}`);
              
              // Verify the server is actually responding
              try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                const healthResponse = await fetch(`http://127.0.0.1:${port}/health/health`, {
                  signal: controller.signal
                });
                clearTimeout(timeoutId);
                
                if (healthResponse.ok) {
                  console.log(`[TauriConfig] Server health verified on port ${port}`);
                  cachedServerPort = port;
                  serverPortPromise = null;
                  return port;
                } else {
                  console.log(`[TauriConfig] Server health check failed: ${healthResponse.status}`);
                }
              } catch (healthError) {
                console.log(`[TauriConfig] Server health check error:`, healthError);
              }
            } else {
              console.log(`[TauriConfig] Server not ready yet, port is:`, port);
            }
          } catch (error) {
            console.log(`[TauriConfig] get_server_port error on attempt ${attempts + 1}:`, error);
          }
          
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        throw new Error('Server failed to start within 60 seconds');
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
    try {
      return await getTauriConfig();
    } catch (error) {
      console.warn('[TauriConfig] Failed to get Tauri config, falling back to web config:', error);
      return webConfig;
    }
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

// Test server health with timeout
export const testServerHealth = async (config: TorqueConfig): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for health checks
    
    const response = await fetch(`${config.baseUrl}/health/health`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log('[TauriConfig] Health check failed:', error);
    return false;
  }
};