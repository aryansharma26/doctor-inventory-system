import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger.js";
import { ApiError } from "../utils/api-error.js";

export const notFound: RequestHandler = (req, _res, next) =>
  next(new ApiError(404, "NOT_FOUND", `Route ${req.method} ${req.path} was not found`));

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const known = error instanceof ApiError;
  const validation = error instanceof ZodError;
  const status = known ? error.status : validation ? 422 : 500;
  if (status >= 500) logger.error({ err: error, requestId: req.requestId }, "request failed");
  res.status(status).json({
    success: false,
    error: {
      code: known ? error.code : validation ? "VALIDATION_ERROR" : "INTERNAL_ERROR",
      message: known || validation ? error.message : "An unexpected error occurred",
      ...(known && error.details ? { details: error.details } : {}),
      requestId: req.requestId
    }
  });
};

