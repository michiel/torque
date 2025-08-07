import React, { useState, useEffect } from 'react';
import { Button, Group, Text, Alert } from '@mantine/core';
import { IconRefresh, IconWifi, IconWifiOff } from '@tabler/icons-react';
import { useTorqueConfig } from '../providers/TorqueConfigProvider';
import { useWebSocketContext } from '../providers/WebSocketProvider';

export const ServerStatus: React.FC = () => {
  const { isTauriEnvironment, refreshConfig } = useTorqueConfig();
  const { isConnected } = useWebSocketContext();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Auto-refresh when connection is lost for too long (Tauri only)
  useEffect(() => {
    if (!isTauriEnvironment || isConnected) return;

    const timeout = setTimeout(() => {
      console.log('[ServerStatus] Auto-refreshing due to prolonged disconnection');
      handleRefresh();
    }, 15000); // Auto-refresh after 15 seconds of disconnection

    return () => clearTimeout(timeout);
  }, [isConnected, isTauriEnvironment]);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await refreshConfig();
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to refresh configuration:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Don't show status for web environment
  if (!isTauriEnvironment) {
    return null;
  }

  return (
    <div style={{ position: 'fixed', top: 10, right: 10, zIndex: 1000 }}>
      <Group gap="xs">
        <Group gap={4}>
          {isConnected ? (
            <IconWifi size={16} color="green" />
          ) : (
            <IconWifiOff size={16} color="red" />
          )}
          <Text size="xs" c={isConnected ? 'green' : 'red'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </Group>
        
        <Button
          size="xs"
          variant="subtle"
          leftSection={<IconRefresh size={12} />}
          loading={isRefreshing}
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          Refresh
        </Button>
        
        {lastRefresh && (
          <Text size="xs" c="dimmed">
            {lastRefresh.toLocaleTimeString()}
          </Text>
        )}
      </Group>
      
      {!isConnected && (
        <Alert size="xs" color="orange" mt={5}>
          <Text size="xs">
            Server connection lost. Auto-refresh in progress...
          </Text>
        </Alert>
      )}
    </div>
  );
};