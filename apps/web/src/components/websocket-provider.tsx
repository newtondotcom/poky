import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { type WebSocketMessage } from '@/lib/websocket-client';

interface WebSocketContextType {
  isConnected: boolean;
  sessionId: string | null;
  userId: string | null;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: WebSocketMessage) => void;
  sendPing: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const webSocket = useWebSocket();

  return (
    <WebSocketContext.Provider value={webSocket}>
      {children}
    </WebSocketContext.Provider>
  );
} 