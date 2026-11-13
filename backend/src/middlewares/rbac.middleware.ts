import type { Role } from "@prisma/client";
import type { RequestHandler } from "express";
import { ApiError } from "../utils/api-error.js";

export const requireRoles = (...roles: Role[]): RequestHandler => (req, _res, next) => {
  if (req.auth?.isPlatformAdmin || (req.auth?.role && roles.includes(req.auth.role))) return next();
  throw new ApiError(403, "INSUFFICIENT_PERMISSION", "You do not have permission to perform this action");
};

export const requirePlatformAdmin: RequestHandler = (req, _res, next) => {
  if (!req.auth?.isPlatformAdmin) throw new ApiError(403, "PLATFORM_ADMIN_REQUIRED", "Platform administrator access is required");
  next();
};

export const requirePermission = (permission: string): RequestHandler => (req, _res, next) => {
  if (req.auth?.isPlatformAdmin || req.auth?.permissions.includes(permission)) return next();
  throw new ApiError(403, "INSUFFICIENT_PERMISSION", `Permission '${permission}' is required`);
};

export const requireNoImpersonation: RequestHandler = (req, _res, next) => {
  if (req.auth?.impersonationId) {
    throw new ApiError(403, "IMPERSONATION_READ_ONLY", "Support impersonation sessions are read-only");
  }
  next();
};
