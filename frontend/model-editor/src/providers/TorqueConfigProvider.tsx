import React, { createContext, useContext, useEffect, useState } from 'react';
import { ApolloProvider } from '@apollo/client';
import { LoadingOverlay, Text, Stack } from '@mantine/core';
import { getTorqueConfig, isTauri, testServerHealth, clearPortCache } from '../utils/tauriConfig';
import { getDynamicApolloClient } from '../graphql/dynamicClient';
import type { ApolloClient } from '@apollo/client';

interface TorqueConfig {
  graphqlUrl: string;
  jsonRpcUrl: string;
  websocketUrl: string;
  baseUrl: string;
}

interface TorqueConfigContextType {
  config: TorqueConfig;
  apolloClient: ApolloClient<any>;
  isTauriEnvironment: boolean;
  refreshConfig: () => Promise<void>;
}

const TorqueConfigContext = createContext<TorqueConfigContextType | null>(null);

interface TorqueConfigProviderProps {
  children: React.ReactNode;
}

export const TorqueConfigProvider: React.FC<TorqueConfigProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<TorqueConfig | null>(null);
  const [apolloClient, setApolloClient] = useState<ApolloClient<any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Initializing...');

  const isTauriEnvironment = isTauri();

  useEffect(() => {
    let isMounted = true;
    
    const initializeConfig = async () => {
      try {
        console.log('[TorqueConfigProvider] Initializing config, isTauriEnvironment:', isTauriEnvironment);
        setStatus(isTauriEnvironment ? 'Connecting to embedded server...' : 'Configuring web endpoints...');
        
        // Get configuration
        console.log('[TorqueConfigProvider] Getting Torque config...');
        const torqueConfig = await getTorqueConfig();
        console.log('[TorqueConfigProvider] Received config:', torqueConfig);
        
        if (!isMounted) return;
        
        if (isTauriEnvironment) {
          setStatus('Testing server connection...');
          
          // Test server health with retries - longer timeout for initialization
          let healthCheckPassed = false;
          const maxRetries = 20; // Increased retries
          
          for (let i = 0; i < maxRetries && isMounted; i++) {
            const isHealthy = await testServerHealth(torqueConfig);
            if (isHealthy) {
              healthCheckPassed = true;
              break;
            }
            
            if (i < maxRetries - 1) {
              setStatus(`Server not ready, retrying... (${i + 1}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, 2000)); // Longer delay between retries
            }
          }
          
          if (!isMounted) return;
          
          if (!healthCheckPassed) {
            throw new Error('Failed to connect to embedded server after multiple retries');
          }
          
          setStatus('Server connection established, initializing GraphQL client...');
        } else {
          setStatus('Initializing GraphQL client...');
        }
        
        // Initialize Apollo Client
        const client = await getDynamicApolloClient();
        
        if (!isMounted) return;
        
        setConfig(torqueConfig);
        setApolloClient(client);
        setStatus('Ready');
        
      } catch (err) {
        if (isMounted) {
          console.error('Configuration initialization failed:', err);
          setError(err instanceof Error ? err.message : 'Unknown error occurred');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeConfig();
    
    return () => {
      isMounted = false;
    };
  }, [isTauriEnvironment]);

  const refreshConfig = async () => {
    console.log('[TorqueConfigProvider] Refreshing configuration...');
    setLoading(true);
    setError(null);
    
    try {
      // Clear any cached port information
      if (isTauriEnvironment) {
        clearPortCache();
        if (typeof window !== 'undefined') {
          localStorage.removeItem('tauri_server_port');
        }
      }
      
      // Get fresh configuration
      const torqueConfig = await getTorqueConfig();
      console.log('[TorqueConfigProvider] Refreshed config:', torqueConfig);
      
      // Test server health (skip health check during refresh to be more permissive)
      if (isTauriEnvironment) {
        console.log('[TorqueConfigProvider] Skipping health check during refresh - using config as-is');
        // Skip health check during refresh to allow recovery even if health endpoint is temporarily unavailable
        // The WebSocket and GraphQL clients will handle their own connection validation
      }
      
      // Create new Apollo client
      const newApolloClient = await getDynamicApolloClient(torqueConfig);
      
      setConfig(torqueConfig);
      setApolloClient(newApolloClient);
    } catch (error) {
      console.error('[TorqueConfigProvider] Failed to refresh config:', error);
      setError(`Failed to refresh configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ position: 'relative', height: '100vh', width: '100vw' }}>
        <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />
        <Stack align="center" justify="center" style={{ height: '100vh' }}>
          <Text size="lg" fw={500}>
            {isTauriEnvironment ? 'Starting Torque Desktop' : 'Loading Torque'}
          </Text>
          <Text size="sm" c="dimmed">
            {status}
          </Text>
        </Stack>
      </div>
    );
  }

  if (error || !config || !apolloClient) {
    return (
      <div style={{ position: 'relative', height: '100vh', width: '100vw' }}>
        <Stack align="center" justify="center" style={{ height: '100vh' }} gap="lg">
          <Text size="lg" fw={500} c="red">
            Failed to Initialize Torque
          </Text>
          <Text size="sm" c="dimmed" ta="center" style={{ maxWidth: 400 }}>
            {error || 'Configuration or Apollo Client failed to initialize'}
          </Text>
          <Text size="xs" c="dimmed">
            Environment: {isTauriEnvironment ? 'Tauri Desktop' : 'Web Browser'}
          </Text>
          {isTauriEnvironment && (
            <Text size="xs" c="dimmed" ta="center" style={{ maxWidth: 400 }}>
              Please ensure the Torque server is running and accessible.
            </Text>
          )}
        </Stack>
      </div>
    );
  }

  const contextValue: TorqueConfigContextType = {
    config,
    apolloClient,
    isTauriEnvironment,
    refreshConfig,
  };

  return (
    <TorqueConfigContext.Provider value={contextValue}>
      <ApolloProvider client={apolloClient}>
        {children}
      </ApolloProvider>
    </TorqueConfigContext.Provider>
  );
};

export const useTorqueConfig = (): TorqueConfigContextType => {
  const context = useContext(TorqueConfigContext);
  if (!context) {
    throw new Error('useTorqueConfig must be used within a TorqueConfigProvider');
  }
  return context;
};