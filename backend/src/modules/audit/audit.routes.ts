import { Router } from "express";
import { requirePermission } from "../../middlewares/rbac.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { exportAuditLogs, listAuditLogs } from "./audit.controller.js";

export const auditRouter = Router();
auditRouter.get("/", requirePermission("audit.read"), asyncHandler(listAuditLogs));
auditRouter.get("/export", requirePermission("audit.export"), asyncHandler(exportAuditLogs));

