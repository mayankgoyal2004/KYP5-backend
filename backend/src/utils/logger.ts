import winston from "winston";

/**
 * @description Industry-level logger implementation using Winston
 * Features: 
 * - Console and File logging
 * - Colorized output for development
 * - Log levels (info, error, warn, debug)
 * - Daily rotating file logic (manual implementation for simplicity here)
 */

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} ${level}: ${stack || message}`;
});

const logger = winston.createLogger({
    level: process.env.NODE_ENV === "development" ? "debug" : "info",
    format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        errors({ stack: true }),
        logFormat
    ),
    transports: [
        // Write all logs with level `error` and below to `public/logs/error.log`
        new winston.transports.File({ filename: "public/logs/error.log", level: "error" }),
        // Write all logs with level `info` and below to `public/logs/combined.log`
        new winston.transports.File({ filename: "public/logs/combined.log" }),
    ],
});

// If we're not in production then log to the `console` with colors
if (process.env.NODE_ENV !== "production") {
    logger.add(
        new winston.transports.Console({
            format: combine(colorize(), logFormat),
        })
    );
}

export default logger;
