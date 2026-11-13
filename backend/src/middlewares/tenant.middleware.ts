import type { RequestHandler } from "express";
import { ApiError } from "../utils/api-error.js";

export const requireTenant: RequestHandler = (req, _res, next) => {
  if (!req.auth?.clinicId) throw new ApiError(400, "CLINIC_CONTEXT_REQUIRED", "Select a clinic to continue");
  next();
};

