import logger from "../utils/logger.js";
import { autoSubmitAllExpiredAttempts } from "./examAttemptTimeouts.js";

const DEFAULT_SWEEP_INTERVAL_MS = 30_000;

let timeoutSweepTimer: NodeJS.Timeout | null = null;
let isSweepRunning = false;

async function runExpiredAttemptSweep() {
  if (isSweepRunning) {
    return;
  }

  isSweepRunning = true;

  try {
    const processedCount = await autoSubmitAllExpiredAttempts();
    if (processedCount > 0) {
      logger.info(
        `Expired attempt sweep completed. Auto-submitted ${processedCount} attempt(s).`,
      );
    }
  } catch (error) {
    logger.error("Expired attempt sweep failed", error);
  } finally {
    isSweepRunning = false;
  }
}

export function startExamAttemptTimeoutScheduler() {
  if (timeoutSweepTimer) {
    return timeoutSweepTimer;
  }

  void runExpiredAttemptSweep();

  timeoutSweepTimer = setInterval(
    () => void runExpiredAttemptSweep(),
    DEFAULT_SWEEP_INTERVAL_MS,
  );
  timeoutSweepTimer.unref();

  logger.info(
    `Started exam timeout scheduler with ${DEFAULT_SWEEP_INTERVAL_MS / 1000}s sweep interval.`,
  );

  return timeoutSweepTimer;
}

export function stopExamAttemptTimeoutScheduler() {
  if (!timeoutSweepTimer) {
    return;
  }

  clearInterval(timeoutSweepTimer);
  timeoutSweepTimer = null;
  logger.info("Stopped exam timeout scheduler.");
}

