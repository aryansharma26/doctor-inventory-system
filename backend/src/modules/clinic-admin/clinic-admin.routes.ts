import { Router } from "express";
import { requireNoImpersonation, requirePermission } from "../../middlewares/rbac.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { getSettings, inviteUser, listUsers, updateMembership, updateSettings } from "./clinic-admin.controller.js";
import { inviteUserSchema, membershipSchema, updateSettingsSchema } from "./clinic-admin.validator.js";

export const clinicAdminRouter = Router();
clinicAdminRouter.get("/settings", requirePermission("user.manage"), asyncHandler(getSettings));
clinicAdminRouter.put("/settings", requireNoImpersonation, requirePermission("user.manage"), validate(updateSettingsSchema), asyncHandler(updateSettings));
clinicAdminRouter.get("/users", requirePermission("user.manage"), asyncHandler(listUsers));
clinicAdminRouter.post("/users/invitations", requireNoImpersonation, requirePermission("user.manage"), validate(inviteUserSchema), asyncHandler(inviteUser));
clinicAdminRouter.patch("/users/:id", requireNoImpersonation, requirePermission("user.manage"), validate(membershipSchema), asyncHandler(updateMembership));
