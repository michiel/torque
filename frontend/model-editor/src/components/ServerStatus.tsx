import React, { useEffect } from 'react';
import { Alert, Text } from '@mantine/core';
import { useTorqueConfig } from '../providers/TorqueConfigProvider';
import { useWebSocketContext } from '../providers/WebSocketProvider';

export const ServerStatus: React.FC = () => {
  const { isTauriEnvironment, refreshConfig } = useTorqueConfig();
  const { isConnected } = useWebSocketContext();

  // Auto-refresh when connection is lost for too long (Tauri only)
  useEffect(() => {
    if (!isTauriEnvironment || isConnected) return;

    const timeout = setTimeout(() => {
      console.log('[ServerStatus] Auto-refreshing due to prolonged disconnection');
      refreshConfig();
    }, 15000); // Auto-refresh after 15 seconds of disconnection

    return () => clearTimeout(timeout);
  }, [isConnected, isTauriEnvironment, refreshConfig]);

  // Don't show status for web environment
  if (!isTauriEnvironment) {
    return null;
  }

  // Only show alert when disconnected
  return (
    <>
      {!isConnected && (
        <div style={{ position: 'fixed', top: 10, right: 10, zIndex: 1000 }}>
          <Alert color="orange">
            <Text size="xs">
              Server connection lost. Auto-refresh in progress...
            </Text>
          </Alert>
        </div>
      )}
    </>
  );
};