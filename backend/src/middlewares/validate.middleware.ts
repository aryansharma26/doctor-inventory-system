import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { ApiError } from "../utils/api-error.js";

export const validate = (schema: ZodType): RequestHandler => (req, _res, next) => {
  const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
  if (!result.success) throw new ApiError(422, "VALIDATION_ERROR", "Request validation failed", result.error.flatten());
  Object.assign(req, result.data);
  next();
};

