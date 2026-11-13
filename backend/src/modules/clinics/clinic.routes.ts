import { Router } from "express";
import { requireNoImpersonation } from "../../middlewares/rbac.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { createClinic, deleteClinic, getClinic, listClinics, setClinicStatus, updateClinic } from "./clinic.controller.js";
import { clinicStatusSchema, createClinicSchema, updateClinicSchema } from "./clinic.validator.js";

export const clinicRouter = Router();
clinicRouter.get("/", asyncHandler(listClinics));
clinicRouter.post("/", requireNoImpersonation, validate(createClinicSchema), asyncHandler(createClinic));
clinicRouter.get("/:id", asyncHandler(getClinic));
clinicRouter.patch("/:id", requireNoImpersonation, validate(updateClinicSchema), asyncHandler(updateClinic));
clinicRouter.patch("/:id/status", requireNoImpersonation, validate(clinicStatusSchema), asyncHandler(setClinicStatus));
clinicRouter.delete("/:id", requireNoImpersonation, asyncHandler(deleteClinic));
