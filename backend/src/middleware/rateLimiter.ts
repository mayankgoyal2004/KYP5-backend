// src/middleware/rateLimiter.ts

import rateLimit from "express-rate-limit";

export const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX || "100"),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

export const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || "900000"),
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || "10"),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});
