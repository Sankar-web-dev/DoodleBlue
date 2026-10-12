import express, { ErrorRequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import { createSessionMiddleware } from "./config/session";
import authRoutes from "./modules/auth/auth.routes";

export function createApp() {
  const app = express();

  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  const clientOrigin =
    process.env.CLIENT_URL ||
    process.env.CLIENT_ORIGIN ||
    "http://localhost:3000";

  app.use(helmet());

  app.use(
    cors({
      origin: clientOrigin,
      credentials: true,
    })
  );

  app.use(express.json({ limit: "1mb" }));

  // Sessions must be registered before authentication routes.
  app.use(createSessionMiddleware());

  app.get("/api/v1/health", (_req, res) => {
    res.status(200).json({
      success: true,
      data: { status: "ok" },
    });
  });

  app.use("/api/v1/auth", authRoutes);

  const errorHandler: ErrorRequestHandler = (
    error,
    _req,
    res,
    _next
  ) => {
    console.error("API error:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
    });
  };

  app.use(errorHandler);

  return app;
}