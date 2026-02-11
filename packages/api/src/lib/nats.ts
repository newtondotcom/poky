import { connect, StringCodec, type NatsConnection } from "nats";
import logger from "@/lib/logger";
import type { ZodSchema } from "zod/v4";

const codec = StringCodec();

class NatsService {
  private connection: NatsConnection | undefined;
  private connecting: Promise<NatsConnection> | undefined;

  async getConnection(): Promise<NatsConnection> {
    if (this.connection) return this.connection;

    if (!this.connecting) {
      const servers = env?.NATS_URL ?? "nats://localhost:4222";
      this.connecting = connect({ servers })
        .then((conn: NatsConnection) => {
          this.connection = conn;
          logger.info("NATS connected", { servers });

          conn.closed().then((err) => {
            if (err) {
              logger.error("NATS connection closed with error", { error: err });
            } else {
              logger.info("NATS connection closed");
            }
            this.connection = undefined;
            this.connecting = undefined;
          });

          return conn;
        })
        .catch((error: unknown) => {
          this.connecting = undefined;
          logger.error("NATS connection error", { error });
          throw error;
        });
    }

    return this.connecting;
  }

  async publish<T>(subject: string, schema: ZodSchema<T>, payload: T): Promise<void> {
    const parsed = schema.parse(payload);
    const conn = await this.getConnection();
    const data = codec.encode(JSON.stringify(parsed));
    conn.publish(subject, data);
  }

  async subscribe<T>(subject: string, schema: ZodSchema<T>) {
    const conn = await this.getConnection();
    const sub = conn.subscribe(subject);

    const iterator = (async function* () {
      for await (const msg of sub) {
        const decoded = codec.decode(msg.data);
        const parsed = schema.parse(JSON.parse(decoded));
        yield parsed;
      }
    })();

    return { sub, iterator };
  }

  async cleanup(): Promise<void> {
    if (this.connection) {
      await this.connection.drain();
      this.connection = undefined;
    }
  }
}

export const natsService = new NatsService();
