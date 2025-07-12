import { useWebSocketContext } from './websocket-provider';
import { Button } from './ui/button';

export function WebSocketStatus() {
  const { isConnected, sessionId, userId, lastMessage, sendPing, sendPoke } = useWebSocketContext();

  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-2">WebSocket Status</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>Status: {isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        
        {sessionId && (
          <div>Session ID: <code className="text-xs">{sessionId}</code></div>
        )}
        
        {userId && (
          <div>User ID: <code className="text-xs">{userId}</code></div>
        )}
        
        {lastMessage && (
          <div>
            Last Message: <code className="text-xs">{JSON.stringify(lastMessage)}</code>
          </div>
        )}
      </div>
      
      <div className="flex gap-2 mt-4">
        <Button 
          size="sm" 
          onClick={sendPing}
          disabled={!isConnected}
        >
          Send Ping
        </Button>
        
        <Button 
          size="sm" 
          onClick={() => sendPoke('test-user', { message: 'Hello!' })}
          disabled={!isConnected}
        >
          Send Test Poke
        </Button>
      </div>
    </div>
  );
} 