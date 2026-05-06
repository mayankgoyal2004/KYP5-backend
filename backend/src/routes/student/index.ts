import { Router } from "express";
import authRoutes from "./auth/index.js";
import dashboardRoutes from "./dashboard/index.js";
import testsRoutes from "./tests/index.js";
import attemptsRoutes from "./attempts/index.js";
import resultsRoutes from "./results/index.js";
import { authenticate, requireActiveUser, studentOnly } from "../../middleware/auth.js";

const router = Router();

// Public / Auth routes (login, register)
router.use("/auth", authRoutes);

// Protected routes — auth + active check + student role guard
router.use(authenticate, requireActiveUser, studentOnly);
router.use("/dashboard", dashboardRoutes);
router.use("/tests", testsRoutes);
router.use("/attempts", attemptsRoutes);
router.use("/results", resultsRoutes);

export default router;
