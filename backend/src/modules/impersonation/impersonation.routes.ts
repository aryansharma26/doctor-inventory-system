import { Router } from "express";
import { requirePlatformAdmin } from "../../middlewares/rbac.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { startImpersonation, stopImpersonation } from "./impersonation.controller.js";
import { startImpersonationSchema, stopImpersonationSchema } from "./impersonation.validator.js";

export const impersonationRouter = Router();
impersonationRouter.use(requirePlatformAdmin);
impersonationRouter.post("/", validate(startImpersonationSchema), asyncHandler(startImpersonation));
impersonationRouter.delete("/:id", validate(stopImpersonationSchema), asyncHandler(stopImpersonation));
