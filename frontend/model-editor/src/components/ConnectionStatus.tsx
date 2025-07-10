import React from 'react';
import { Badge, Tooltip } from '@mantine/core';
import { IconWifi, IconWifiOff } from '@tabler/icons-react';
import { useWebSocketContext } from '../providers/WebSocketProvider';

export const ConnectionStatus: React.FC = () => {
  const { isConnected } = useWebSocketContext();

  return (
    <Tooltip
      label={isConnected ? 'Connected to real-time updates' : 'Disconnected from real-time updates'}
      position="bottom"
    >
      <Badge
        variant="light"
        color={isConnected ? 'green' : 'red'}
        size="sm"
        leftSection={
          isConnected ? (
            <IconWifi size={12} />
          ) : (
            <IconWifiOff size={12} />
          )
        }
      >
        {isConnected ? 'Live' : 'Offline'}
      </Badge>
    </Tooltip>
  );
};