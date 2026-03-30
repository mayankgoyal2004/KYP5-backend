import { Router } from "express";

import adminRoutes from "./admin/index.js";
import publicRoutes from "./public/index.js";
import studentRoutes from "./student/index.js"; // Added student routes

const router = Router();

// Mount public routes (no auth required)
router.use("/public", publicRoutes);

// Mount all admin routes under /api/admin/*
router.use("/admin", adminRoutes);

// Mount all student routes under /api/student/*
router.use("/student", studentRoutes);

export default router;
