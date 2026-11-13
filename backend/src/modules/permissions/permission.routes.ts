import { Router } from "express";
import { requireNoImpersonation, requirePermission } from "../../middlewares/rbac.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { listPermissions, updateMembershipOverrides } from "./permission.controller.js";
import { updateOverridesSchema } from "./permission.validator.js";

export const permissionRouter = Router();
permissionRouter.get("/", requirePermission("user.manage"), asyncHandler(listPermissions));
permissionRouter.put("/memberships/:membershipId", requireNoImpersonation, requirePermission("user.manage"), validate(updateOverridesSchema), asyncHandler(updateMembershipOverrides));
