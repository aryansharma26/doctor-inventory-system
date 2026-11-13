import compression from "compression";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { createRateLimitStore } from "./config/rate-limit.js";
import { authenticate } from "./middlewares/auth.middleware.js";
import { errorHandler, notFound } from "./middlewares/error.middleware.js";
import { requestContext } from "./middlewares/request-context.js";
import { apiRouter } from "./routes/index.js";

export const createApp = () => {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", env.TRUST_PROXY);
  app.use(requestContext);
  app.use(pinoHttp({ logger }));
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "same-site" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"]
      }
    }
  }));
  app.use(cors({ origin: env.FRONTEND_URL, credentials: true, methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] }));
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  const rateLimitStore = createRateLimitStore();
  app.use(rateLimit({
    windowMs: 60_000,
    limit: 240,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    ...(rateLimitStore ? { store: rateLimitStore } : {})
  }));
  app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));
  app.use("/api/v1", authenticate, apiRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
};
