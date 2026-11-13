import { Router } from "express";
import { requireNoImpersonation, requirePermission } from "../../middlewares/rbac.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { createUpload, downloadDocument, finalizeUpload, listDocuments } from "./document.controller.js";
import { createUploadSchema, documentIdSchema, finalizeDocumentSchema } from "./document.validator.js";

export const documentRouter = Router();
documentRouter.get("/", requirePermission("document.manage"), asyncHandler(listDocuments));
documentRouter.post("/uploads", requireNoImpersonation, requirePermission("document.manage"), validate(createUploadSchema), asyncHandler(createUpload));
documentRouter.post("/:id/finalize", requireNoImpersonation, requirePermission("document.manage"), validate(finalizeDocumentSchema), asyncHandler(finalizeUpload));
documentRouter.get("/:id/download", requirePermission("document.manage"), validate(documentIdSchema), asyncHandler(downloadDocument));

