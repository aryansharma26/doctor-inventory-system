import { Router } from "express";
import { requireNoImpersonation, requirePermission } from "../../middlewares/rbac.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { addMedicine, adjustStock, listInventory } from "./inventory.controller.js";
import { adjustStockSchema, createMedicineSchema } from "./inventory.validator.js";

export const inventoryRouter = Router();
inventoryRouter.get("/", asyncHandler(listInventory));
inventoryRouter.post("/", requireNoImpersonation, requirePermission("inventory.manage"), validate(createMedicineSchema), asyncHandler(addMedicine));
inventoryRouter.post("/adjustments", requireNoImpersonation, requirePermission("inventory.adjust"), validate(adjustStockSchema), asyncHandler(adjustStock));
