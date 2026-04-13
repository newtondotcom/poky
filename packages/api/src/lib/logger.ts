import winston from "winston";
import { env } from "@poky/env/server";

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "poky-server" },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
      level: env.NODE_ENV === "development" ? "debug" : "error",
    }),
    ...(env.NODE_ENV !== "development"
      ? [new winston.transports.File({ filename: "logs/error.log", level: "error" })]
      : []),
  ],
});

export default logger;
