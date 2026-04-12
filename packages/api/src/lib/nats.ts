import { connect } from "@nats-io/transport-node";
import logger from "@/lib/logger";
import { env } from "@poky/env/server";

class NatsService {
  private connection;
  private connecting;

  async getConnection() {
    if (this.connection) return this.connection;

    if (!this.connecting) {
      const servers = env.NATS_URL ?? "nats://localhost:4222";
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

  async publish<T>(subject: string, payload: T) {
    const conn = await this.getConnection();
    conn.publish(subject, JSON.stringify(payload));
  }

  async subscribe<T>(subject: string) {
    const conn = await this.getConnection();
    const sub = conn.subscribe(subject);

    const iterator = (async function* () {
      for await (const msg of sub) {
        yield JSON.parse(msg.data);
      }
    })();

    return { sub, iterator };
  }

  async cleanup() {
    if (this.connection) {
      await this.connection.drain();
      this.connection = undefined;
    }
  }
}

export const natsService = new NatsService();
