import "dotenv/config";
import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@/lib/context";
import { appRouter } from "@/routers/index";
import { auth } from "@/lib/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createBunWebSocket } from 'hono/bun'
import type { ServerWebSocket } from 'bun'
import { wsSessionManager } from "@/lib/websocket-sessions";

const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket<unknown>>();

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: process.env.CORS_ORIGIN || "",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
  }),
);

// --- WebSocket route for real-time notifications ---
const wsApp = app.get(
  '/ws',
  upgradeWebSocket(async (c) => {
    // Get user session from auth
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session?.user?.id) {
      return {
        onOpen(_event, ws) {
          ws.send(JSON.stringify({ 
            type: "error",
            error: "Unauthorized" 
          }));
          ws.close();
        },
      };
    }

    const userId = session.user.id;
    const sessionId = crypto.randomUUID();

    return {
      onOpen(_event, ws) {
        // Add session to manager
        wsSessionManager.addSession(sessionId, userId, ws);
        
        // Send welcome message
        ws.send(JSON.stringify({
          type: "connected",
          sessionId,
          userId,
          message: "Connected to real-time notifications",
          timestamp: new Date().toISOString()
        }));
      },
      
      onMessage(event, ws) {
        try {
          const data = JSON.parse(event.data as string);
          console.log(`Message from user ${userId}:`, data);
          
          // Update activity
          wsSessionManager.updateActivity(sessionId);
          
          // Handle different message types
          switch (data.type) {
            case "ping":
              ws.send(JSON.stringify({
                type: "pong",
                timestamp: new Date().toISOString()
              }));
              break;
              
            case "poke":
              // Handle poke message (you can add your poke logic here)
              console.log(`Poke from ${userId} to ${data.toUserId}`);
              break;
              
            default:
              // Echo back for testing
              ws.send(JSON.stringify({
                type: "echo",
                data,
                timestamp: new Date().toISOString()
              }));
          }
        } catch (error) {
          console.error("Failed to parse message:", error);
        }
      },
      
      onClose() {
        // Remove session from manager
        wsSessionManager.removeSession(sessionId);
      },
      
      onError(error) {
        console.error(`WebSocket error for user ${userId}:`, error);
        wsSessionManager.removeSession(sessionId);
      },
    };
  })
);

app.get("/", (c) => {
  return c.text("OK");
});

export type WebSocketApp = typeof wsApp;

export default {
  fetch: app.fetch,
  websocket,
};
