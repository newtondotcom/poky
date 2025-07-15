import { useEffect, useState, useCallback } from 'react';
import { wsClient, type WebSocketMessage } from '@/lib/websocket-client';
import { authClient } from '@/lib/auth-client';
import { toast } from '@pheralb/toast';
import { usePokeStore } from '@/stores/poke-store';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const { data: session } = authClient.useSession();

  const connect = useCallback(async () => {
    if (session?.user) {
      try {
        await wsClient.connect();
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    }
  }, [session]);

  const disconnect = useCallback(() => {
    wsClient.disconnect();
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    wsClient.send(message);
  }, []);

  const sendPoke = useCallback((toUserId: string, data?: any) => {
    wsClient.sendPoke(toUserId, data);
  }, []);

  const sendPing = useCallback(() => {
    wsClient.sendPing();
  }, []);

  useEffect(() => {
    // Set up event listeners
    wsClient.onConnect(() => {
      setIsConnected(true);
      setSessionId(wsClient.getSessionId());
      setUserId(wsClient.getUserId());
    });

    wsClient.onDisconnect(() => {
      setIsConnected(false);
      setSessionId(null);
      setUserId(null);
    });

    const { setPokesData } = usePokeStore.getState();
    wsClient.onMessage((message) => {
      if (message.type === 'poke_update') {
        setPokesData({
          pokeRelations: message.pokeRelations,
          count: message.count,
          totalPokes: message.totalPokes,
        });
        toast.success({ text: 'Your pokes have been updated!' });
      }
      setLastMessage(message);
    });

    wsClient.onError((error) => {
      console.error('WebSocket error:', error);
    });

    // Connect if user is authenticated
    if (session?.user) {
      connect();
    }

    // Disconnect websocket on page unload/close
    const handleUnload = () => {
      disconnect();
    };
    window.addEventListener('beforeunload', handleUnload);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      disconnect();
    };
  }, [session, connect, disconnect]);

  // Auto-reconnect when session changes
  useEffect(() => {
    if (session?.user && !isConnected) {
      connect();
    } else if (!session?.user && isConnected) {
      disconnect();
    }
  }, [session, isConnected, connect, disconnect]);

  return {
    isConnected,
    sessionId,
    userId,
    lastMessage,
    connect,
    disconnect,
    sendMessage,
    sendPoke,
    sendPing,
    wsClient,
  };
} 