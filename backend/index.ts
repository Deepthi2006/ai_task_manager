import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
const envPath = path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath });

import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import authRoutes from "./routes/auth";
import tasksRoutes from "./routes/tasks";
import aiRoutes from "./routes/ai";
import teamsRoutes from "./routes/teams";
import projectsRoutes from "./routes/projects";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Auth routes
  app.use("/api/auth", authRoutes);

  // Tasks routes
  app.use("/api/tasks", tasksRoutes);

  // Teams routes
  app.use("/api/teams", teamsRoutes);

  // Projects routes
  app.use("/api/projects", projectsRoutes);

  // AI routes
  app.use("/api/agent", aiRoutes);

  return app;
}
