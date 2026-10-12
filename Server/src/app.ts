import express, { ErrorRequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import { createSessionMiddleware } from "./config/session";
import authRoutes from "./modules/auth/auth.routes";
import studentRoutes from "./modules/student/student.routes";
import departmentRoutes from "./modules/department/department.routes";
import courseRoutes from "./modules/course/course.routes";
import enrollmentRoutes from "./modules/enrollment/enrollment.routes";
import attendanceRoutes from "./modules/attendance/attendance.routes";
import meRoutes from "./modules/me/me.routes";
import adminRoutes from "./modules/admin/admin.routes";
import { ApiError } from "./lib/ApiError";

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
  app.use("/api/v1/students", studentRoutes);
  app.use("/api/v1/departments", departmentRoutes);
  app.use("/api/v1/courses", courseRoutes);
  app.use("/api/v1/enrollments", enrollmentRoutes);
  app.use("/api/v1/attendance", attendanceRoutes);
  app.use("/api/v1/me", meRoutes);
  app.use("/api/v1/admins", adminRoutes);

  const errorHandler: ErrorRequestHandler = (
    error,
    _req,
    res,
    _next
  ) => {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      });
      return;
    }

    // MongoDB duplicate-key (unique index violation) → 409
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { code?: number }).code === 11000
    ) {
      res.status(409).json({
        success: false,
        error: {
          code: "CONFLICT",
          message: "A record with this value already exists",
        },
      });
      return;
    }

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