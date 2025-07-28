import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "@/lib/context";

export const t = initTRPC.context<Context>().create({
  sse: {
    // Maximum duration of a single SSE connection in milliseconds
    // Reasonable value: 1 hour (3600000 ms) to 24 hours depending on server and use case
    maxDurationMs: 3600_000, 

    ping: {
      // Enable periodic ping messages to keep connection alive
      enabled: true,
      // Send ping message every 15-30 seconds
      // 2 seconds may be excessive unless you require high-frequency checks
      intervalMs: 2_000, 
    },

    client: {
      // Time the client should wait before attempting to reconnect after inactivity
      // Reasonable value: 2-5 seconds for responsive reconnection
      reconnectAfterInactivityMs: 4_000,
    },
  },
});

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      cause: "No session",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});
