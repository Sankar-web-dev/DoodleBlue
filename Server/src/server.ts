import express, { Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { sessionMiddleware } from "./config/session.js";



dotenv.config({ path: [".env.local", ".env"] });

const app = express();
app.use(sessionMiddleware);
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

// Health check route
app.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "StudentDb API is running!",
  });
});

// MongoDB connection and server startup
async function startServer(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error("MONGODB_URI is missing from environment variables");
    }

    await mongoose.connect(mongoUri);

    console.log("MongoDB Atlas connected successfully");

    const PORT = Number(process.env.PORT) || 5000;

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    console.error("Failed to start server:", message);
    process.exit(1);
  }
}

startServer();
