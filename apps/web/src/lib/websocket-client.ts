export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface WebSocketClient {
  connect(): Promise<void>;
  disconnect(): void;
  send(message: WebSocketMessage): void;
  isConnected(): boolean;
  onMessage(callback: (message: WebSocketMessage) => void): void;
  onConnect(callback: () => void): void;
  onDisconnect(callback: () => void): void;
  onError(callback: (error: Event) => void): void;
}

class WebSocketClientImpl implements WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageCallbacks: ((message: WebSocketMessage) => void)[] = [];
  private connectCallbacks: (() => void)[] = [];
  private disconnectCallbacks: (() => void)[] = [];
  private errorCallbacks: ((error: Event) => void)[] = [];
  private sessionId: string | null = null;
  private userId: string | null = null;

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // Get the server URL from environment or default
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
      const wsUrl = serverUrl.replace('http', 'ws') + '/ws';
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('🔌 WebSocket connected');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.connectCallbacks.forEach(callback => callback());
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', message);
          
          // Handle connection message
          if (message.type === 'connected') {
            this.sessionId = message.sessionId;
            this.userId = message.userId;
            console.log('✅ WebSocket session established:', { sessionId: this.sessionId, userId: this.userId });
          }
          
          // Call all message callbacks
          this.messageCallbacks.forEach(callback => callback(message));
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        this.sessionId = null;
        this.userId = null;
        this.disconnectCallbacks.forEach(callback => callback());
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.errorCallbacks.forEach(callback => callback(error));
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      throw error;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Max 30 seconds

    console.log(`🔄 Scheduling WebSocket reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        console.error('Failed to reconnect:', error);
      });
    }, this.reconnectDelay);
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected, cannot send message:', message);
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  onMessage(callback: (message: WebSocketMessage) => void): void {
    this.messageCallbacks.push(callback);
  }

  onConnect(callback: () => void): void {
    this.connectCallbacks.push(callback);
  }

  onDisconnect(callback: () => void): void {
    this.disconnectCallbacks.push(callback);
  }

  onError(callback: (error: Event) => void): void {
    this.errorCallbacks.push(callback);
  }

  // Utility methods
  sendPing(): void {
    this.send({ type: 'ping' });
  }

  sendPoke(toUserId: string, data?: any): void {
    this.send({
      type: 'poke',
      toUserId,
      data
    });
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  getUserId(): string | null {
    return this.userId;
  }
}

// Export singleton instance
export const wsClient = new WebSocketClientImpl(); 