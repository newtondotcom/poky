import { fastify } from "fastify";
import { fastifyConnectPlugin } from "@connectrpc/connect-fastify";
import routes from "@/connect";
import fastifyCors from "@fastify/cors";
import { cors as connectCors } from "@connectrpc/connect";
import { authInterceptor } from "./rpc/interceptor";

const server = fastify();
// Options for configuring CORS. The @connectrpc/connect package exports
// convenience variables for configuring a CORS setup.
await server.register(fastifyCors, {
  // Reflects the request origin. This should only be used for development.
  // Production should explicitly specify an origin
  origin: true,
  methods: [...connectCors.allowedMethods],
  allowedHeaders: [...connectCors.allowedHeaders],
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
console.log("server is listening at", server.addresses());
