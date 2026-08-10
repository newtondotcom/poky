import { Kvm, type KV } from "@nats-io/kv";
import { connect, type NatsConnection } from "@nats-io/transport-node";
import logger from "./logger";
import { env } from "@poky/env/server";

const PRESENCE_BUCKET = "presence";
const PRESENCE_TTL_MS = 300_000; // 5 minutes

class NatsService {
  private connection: NatsConnection | undefined;
  private connecting: Promise<NatsConnection> | undefined;
  private presenceKv: Promise<KV> | undefined;

  async getConnection() {
    if (this.connection) return this.connection;

    if (!this.connecting) {
      const servers = env.NATS_URL;
      this.connecting = connect({ servers })
        .then((conn) => {
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
        .catch((error) => {
          this.connecting = undefined;
          logger.error("NATS connection error", { error });
          throw error;
        });
    }

    return this.connecting;
  }

  async getPresenceKv() {
    if (!this.presenceKv) {
      this.presenceKv = this.getConnection()
        .then((conn) =>
          new Kvm(conn).create(PRESENCE_BUCKET, {
            ttl: PRESENCE_TTL_MS,
            history: 1,
          }),
        )
        .catch((error) => {
          this.presenceKv = undefined;
          logger.error("Failed to open presence KV bucket", { error });
          throw error;
        });
    }

    return this.presenceKv;
  }

  async publish<T>(subject: string, payload: T) {
    const conn = await this.getConnection();
    conn.publish(subject, JSON.stringify(payload));
  }

  async subscribe(subject: string) {
    const conn = await this.getConnection();
    const sub = conn.subscribe(subject);

    const iterator = (async function* () {
      for await (const msg of sub) {
        yield msg.data;
      }
    })();

    return { sub, iterator };
  }

  async cleanup() {
    if (this.connection) {
      await this.connection.drain();
      this.connection = undefined;
      this.presenceKv = undefined;
    }
  }
}

export const natsService = new NatsService();
