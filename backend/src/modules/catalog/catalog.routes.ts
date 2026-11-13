import { Router } from "express";
import { requireNoImpersonation, requirePermission } from "../../middlewares/rbac.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { createCategory, createManufacturer, createMedicine, listMedicines, lookups } from "./catalog.controller.js";
import { createLookupSchema, createMedicineSchema } from "./catalog.validator.js";

export const catalogRouter = Router();
catalogRouter.get("/", asyncHandler(listMedicines));
catalogRouter.get("/lookups", asyncHandler(lookups));
catalogRouter.post("/", requireNoImpersonation, requirePermission("inventory.manage"), validate(createMedicineSchema), asyncHandler(createMedicine));
catalogRouter.post("/categories", requireNoImpersonation, requirePermission("inventory.manage"), validate(createLookupSchema), asyncHandler(createCategory));
catalogRouter.post("/manufacturers", requireNoImpersonation, requirePermission("inventory.manage"), validate(createLookupSchema), asyncHandler(createManufacturer));
