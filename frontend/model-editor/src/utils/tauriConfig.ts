/**
 * Tauri Configuration Utility
 * 
 * Detects when running inside Tauri and configures endpoints
 * to use the embedded server port dynamically.
 */

import React from 'react';

// Check if we're running inside Tauri
export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
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

  const tauri = getTauriAPI();
  if (!tauri) {
    throw new Error('Tauri API not available');
  }

  serverPortPromise = (async () => {
    try {
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
  if (isTauri()) {
    return await getTauriConfig();
  }
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