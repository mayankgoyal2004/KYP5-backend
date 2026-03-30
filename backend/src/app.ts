import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import { errorHandler } from "./middleware/errorHandler.js";
import routes from "./routes/index.js";
import logger from "./utils/logger.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ─── Middleware ──────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // Disabling CSP for development convenience, or configure correctly
  }),
);
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// Use morgan with winston stream for logging
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Static file serving for uploads ─────────────────────
app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "public", "uploads")),
);

// ─── Health Check ────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  logger.debug("Health check requested");
  res.json({
    status: "ok",
    message: "Online Exam Portal API is running",
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ──────────────────────────────────────────
app.use("/api", routes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Error Handler ───────────────────────────────────────
app.use(errorHandler);

export default app;
