import { fastify } from "fastify";
import { fastifyConnectPlugin } from "@connectrpc/connect-fastify";
import routes from "@/rpc/connect";
import fastifyCors from "@fastify/cors";
import { cors as connectCors } from "@connectrpc/connect";
import { authInterceptor } from "@/rpc/interceptor";
import logger from "./lib/logger";

async function startServer() {
  const server = fastify();
  
  await server.register(fastifyCors, {
    // Reflects the request origin. This should only be used for development.
    // Production should explicitly specify an origin
    origin: true,
    methods: [...connectCors.allowedMethods],
    allowedHeaders: [...connectCors.allowedHeaders, "Authorization"],
    exposedHeaders: [...connectCors.exposedHeaders],
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
  
  await server.listen({ host: "localhost", port: 8080 });
  logger.debug("server is listening at", server.addresses());
}

startServer().catch((error) => {
  logger.error("Failed to start server:", error);
  process.exit(1);
});
