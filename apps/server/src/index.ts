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

const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket>();

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

app.get("/", (c) => {
  return c.text("OK");
});

// --- WebSocket route ---
const wsApp = app.get(
  '/ws',
  upgradeWebSocket((c) => {
    return {
      onMessage(event, ws) {
        console.log(`Message from client: ${event.data}`);
        ws.send('Hello from server!');
      },
      onClose() {
        console.log('Connection closed');
      },
      onOpen(_event, ws) {
        console.log('Connection opened on ',c);
        ws.send('Welcome to the WebSocket server!');
      },
    };
  })
);

export type WebSocketApp = typeof wsApp;

export default {
  fetch: app.fetch,
  websocket,
};
