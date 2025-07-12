import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/ws")({
  component: WebSocketTestPage,
});

function WebSocketTestPage() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Adjust the URL if your backend runs on a different port
    const ws = new WebSocket("ws://localhost:3000/ws");
    wsRef.current = ws;

    ws.onopen = () => {
      setMessages((msgs) => [...msgs, "WebSocket connection opened"]);
    };

    ws.onmessage = (event) => {
      setMessages((msgs) => [...msgs, `Server: ${event.data}`]);
    };

    ws.onclose = () => {
      setMessages((msgs) => [...msgs, "WebSocket connection closed"]);
    };

    ws.onerror = (err) => {
      setMessages((msgs) => [...msgs, "WebSocket error"]);
    };

    return () => {
      ws.close();
    };
  }, []);

  const sendMessage = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(input);
      setMessages((msgs) => [...msgs, `You: ${input}`]);
      setInput("");
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-4 border rounded">
      <h1 className="text-2xl font-bold mb-4">WebSocket Test</h1>
      <div className="mb-4 h-48 overflow-y-auto border p-2 bg-gray-50 text-black">
        {messages.map((msg, idx) => (
          <div key={idx}>{msg}</div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border p-2 rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message"
        />
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={sendMessage}
          disabled={!input}
        >
          Send
        </button>
      </div>
    </div>
  );
}