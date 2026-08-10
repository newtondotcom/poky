import { fastify } from "fastify";
import { fastifyConnectPlugin } from "@connectrpc/connect-fastify";
import fastifyCors from "@fastify/cors";
import { cors as connectCors } from "@connectrpc/connect";
import logger from "@poky/api/lib/logger";
import { auth } from "@poky/auth";
import { env } from "@poky/env/server";
import routes from "@poky/api/routers/poky";
import { authInterceptor } from "@poky/api/rpc/interceptor";

const server = fastify();

// Configuration CORS pour production
const allowedOrigins = env.CORS_ORIGIN?.split(",") || [];

await server.register(fastifyCors, {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    logger.debug(`CORS blocked origin: ${origin}`);
    return callback(new Error(`Not allowed by CORS from ${origin}`), false);
  },
  methods: [...connectCors.allowedMethods],
  allowedHeaders: [...connectCors.allowedHeaders, "Authorization"],
  exposedHeaders: [...connectCors.exposedHeaders],
  credentials: true,
});

await server.register(fastifyConnectPlugin, {
  routes,
  interceptors: [authInterceptor],
});

server.get("/", (_, reply) => {
  reply.type("text/plain");
  reply.code(200);
  reply.send("Hello World!");
});

// Health check endpoint for Traefik
server.get("/health", (_, reply) => {
  reply.type("application/json");
  reply.code(200);
  reply.send({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "1.0.0",
  });
});

server.route({
  method: ["GET", "POST"],
  url: "/api/auth/*",
  async handler(request, reply) {
    try {
      // Construct request URL
      const url = new URL(request.url, `http://${request.headers.host}`);

      // Convert Fastify headers to standard Headers object
      const headers = new Headers();
      Object.entries(request.headers).forEach(([key, value]) => {
        if (value) headers.append(key, value.toString());
      });

      // Create Fetch API-compatible request
      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        ...(request.body ? { body: JSON.stringify(request.body) } : {}),
      });

      // Process authentication request
      const response = await auth.handler(req);

      // Forward response to client
      reply.status(response.status);
      response.headers.forEach((value, key) => reply.header(key, value));
      reply.send(response.body ? await response.text() : null);
    } catch (error) {
      logger.error("Authentication Error:", error);
      reply.status(500).send({
        error: "Internal authentication error",
        code: "AUTH_FAILURE",
      });
    }
  },
});

// Configuration serveur pour production
const host = env.HOST || "0.0.0.0";
const port = parseInt(env.PORT || "3000");

await server.listen({ host, port });
logger.info(`Server is listening at http://${host}:${port}`);
