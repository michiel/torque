import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { notifications } from '@mantine/notifications';

export interface ModelChangeEvent {
  type: 'ModelCreated' | 'ModelUpdated' | 'ModelDeleted' | 'EntityAdded' | 'EntityUpdated' | 'EntityRemoved' | 'RelationshipAdded' | 'RelationshipUpdated' | 'RelationshipRemoved' | 'FlowAdded' | 'FlowUpdated' | 'FlowRemoved' | 'LayoutAdded' | 'LayoutUpdated' | 'LayoutRemoved' | 'ValidationAdded' | 'ValidationUpdated' | 'ValidationRemoved';
  data: {
    model_id: string;
    model?: any;
    timestamp: string;
    entity_id?: string;
    relationship_id?: string;
    flow_id?: string;
    layout_id?: string;
    validation_id?: string;
  };
}

export interface ModelEventMessage {
  event: ModelChangeEvent;
  exclude_client?: string;
}

interface UseWebSocketOptions {
  url: string;
  clientId?: string;
  modelFilter?: string;
  onEvent?: (event: ModelChangeEvent) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  lastEvent: ModelChangeEvent | null;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: string) => void;
}

export const useWebSocket = (options: UseWebSocketOptions): UseWebSocketReturn => {
  const {
    url,
    clientId,
    modelFilter,
    onEvent,
    autoReconnect = true,
    reconnectInterval = 5000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<ModelChangeEvent | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const wsUrl = useMemo(() => {
    const socketUrl = new URL(url);
    const params = new URLSearchParams();
    
    if (clientId) {
      params.append('client_id', clientId);
    }
    if (modelFilter) {
      params.append('model_filter', modelFilter);
    }
    
    socketUrl.search = params.toString();
    return socketUrl.toString();
  }, [url, clientId, modelFilter]);

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      console.log('Connecting to WebSocket:', wsUrl);
      
      socketRef.current = new WebSocket(wsUrl);

      socketRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        // Clear any reconnection timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      socketRef.current.onmessage = (event) => {
        try {
          const message: ModelEventMessage = JSON.parse(event.data);
          console.log('Received WebSocket event:', message);
          
          setLastEvent(message.event);
          
          if (onEvent) {
            onEvent(message.event);
          }

          // Show notification for model changes (except ping events)
          if (message.event.type !== 'ModelCreated' || !message.event.data.model?.name?.includes('Ping Test')) {
            notifications.show({
              title: 'Model Updated',
              message: getEventDescription(message.event),
              color: 'blue',
              autoClose: 3000,
            });
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      socketRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);

        // Auto-reconnect if enabled and not manually closed
        if (autoReconnect && event.code !== 1000) {
          console.log(`Reconnecting in ${reconnectInterval}ms...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        notifications.show({
          title: 'Connection Error',
          message: 'Failed to connect to real-time updates',
          color: 'red',
          autoClose: 5000,
        });
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [wsUrl, onEvent, autoReconnect, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.close(1000, 'Manual disconnect');
      socketRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(message);
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  useEffect(() => {
    // Only connect if we don't already have a connection
    if (socketRef.current?.readyState !== WebSocket.OPEN && 
        socketRef.current?.readyState !== WebSocket.CONNECTING) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [url, clientId, modelFilter]); // Use primitive values instead of functions

  return {
    isConnected,
    lastEvent,
    connect,
    disconnect,
    sendMessage,
  };
};

const getEventDescription = (event: ModelChangeEvent): string => {
  const { type, data } = event;
  
  switch (type) {
    case 'ModelCreated':
      return `Model "${data.model?.name || data.model_id}" was created`;
    case 'ModelUpdated':
      return `Model "${data.model?.name || data.model_id}" was updated`;
    case 'ModelDeleted':
      return `Model was deleted`;
    case 'EntityAdded':
      return `Entity was added to model`;
    case 'EntityUpdated':
      return `Entity was updated in model`;
    case 'EntityRemoved':
      return `Entity was removed from model`;
    case 'RelationshipAdded':
      return `Relationship was added to model`;
    case 'RelationshipUpdated':
      return `Relationship was updated in model`;
    case 'RelationshipRemoved':
      return `Relationship was removed from model`;
    case 'FlowAdded':
      return `Flow was added to model`;
    case 'FlowUpdated':
      return `Flow was updated in model`;
    case 'FlowRemoved':
      return `Flow was removed from model`;
    case 'LayoutAdded':
      return `Layout was added to model`;
    case 'LayoutUpdated':
      return `Layout was updated in model`;
    case 'LayoutRemoved':
      return `Layout was removed from model`;
    case 'ValidationAdded':
      return `Validation was added to model`;
    case 'ValidationUpdated':
      return `Validation was updated in model`;
    case 'ValidationRemoved':
      return `Validation was removed from model`;
    default:
      return `Model change: ${type}`;
  }
};