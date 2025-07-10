import React, { createContext, useContext, useCallback } from 'react';
import { useWebSocket, ModelChangeEvent } from '../hooks/useWebSocket';
import { useApolloClient } from '@apollo/client';
import { GET_MODELS } from '../graphql/queries';

interface WebSocketContextType {
  isConnected: boolean;
  lastEvent: ModelChangeEvent | null;
  connect: () => void;
  disconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: React.ReactNode;
  url?: string;
  clientId?: string;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  url = 'ws://localhost:3000/ws',
  clientId,
}) => {
  const apolloClient = useApolloClient();

  const handleEvent = useCallback((event: ModelChangeEvent) => {
    console.log('Handling WebSocket event:', event);

    // Refetch models list when models are created, updated, or deleted
    if (['ModelCreated', 'ModelUpdated', 'ModelDeleted'].includes(event.type)) {
      apolloClient.refetchQueries({
        include: [GET_MODELS],
      });
    }

    // TODO: Add more specific cache updates for individual model changes
    // For now, we'll do a simple refetch to ensure data consistency
  }, [apolloClient]);

  const webSocket = useWebSocket({
    url,
    clientId: clientId || `frontend_${Math.random().toString(36).substr(2, 8)}`,
    onEvent: handleEvent,
    autoReconnect: true,
    reconnectInterval: 5000,
  });

  return (
    <WebSocketContext.Provider value={webSocket}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};