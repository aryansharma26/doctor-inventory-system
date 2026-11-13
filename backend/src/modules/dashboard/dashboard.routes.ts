import { Router } from "express";
import { requirePlatformAdmin } from "../../middlewares/rbac.middleware.js";
import { requireTenant } from "../../middlewares/tenant.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { clinicDashboard, platformDashboard } from "./dashboard.controller.js";

export const dashboardRouter = Router();
dashboardRouter.get("/clinic", requireTenant, asyncHandler(clinicDashboard));
dashboardRouter.get("/platform", requirePlatformAdmin, asyncHandler(platformDashboard));

