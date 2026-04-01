#!/usr/bin/env tsx
import app from "../src/app.js";
import http from "http";
import {
  startExamAttemptTimeoutScheduler,
  stopExamAttemptTimeoutScheduler,
} from "../src/lib/examAttemptTimeoutScheduler.js";

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env.PORT || "5000");
app.set("port", port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on("error", onError);
server.on("listening", onListening);
process.on("SIGINT", shutdownScheduler);
process.on("SIGTERM", shutdownScheduler);

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val: string) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error: any) {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  const addr = server.address();
  const bind =
    typeof addr === "string"
      ? "pipe " + addr
      : "port " + (addr ? addr.port : "");
  startExamAttemptTimeoutScheduler();
  console.log(`\n🚀 Server running on http://localhost:${port}`);
  console.log(`📋 Health check: http://localhost:${port}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}\n`);
}

function shutdownScheduler() {
  stopExamAttemptTimeoutScheduler();
}
