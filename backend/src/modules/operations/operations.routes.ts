import { Router } from "express";
import { requireNoImpersonation, requirePermission } from "../../middlewares/rbac.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import * as controller from "./operations.controller.js";
import * as schema from "./operations.validator.js";

export const operationsRouter = Router();

operationsRouter.get("/suppliers", requirePermission("purchase_order.read"), asyncHandler(controller.listSuppliers));
operationsRouter.post("/suppliers", requireNoImpersonation, requirePermission("supplier.manage"), validate(schema.createSupplierSchema), asyncHandler(controller.createSupplier));
operationsRouter.put("/suppliers/:id", requireNoImpersonation, requirePermission("supplier.manage"), validate(schema.updateSupplierSchema), asyncHandler(controller.updateSupplier));
operationsRouter.delete("/suppliers/:id", requireNoImpersonation, requirePermission("supplier.manage"), validate(schema.idSchema), asyncHandler(controller.archiveSupplier));

operationsRouter.get("/patients", requirePermission("patient_record.read"), asyncHandler(controller.listPatients));
operationsRouter.post("/patients", requireNoImpersonation, requirePermission("patient_record.write"), validate(schema.createPatientSchema), asyncHandler(controller.createPatient));
operationsRouter.put("/patients/:id", requireNoImpersonation, requirePermission("patient_record.write"), validate(schema.updatePatientSchema), asyncHandler(controller.updatePatient));
operationsRouter.delete("/patients/:id", requireNoImpersonation, requirePermission("patient_record.write"), validate(schema.idSchema), asyncHandler(controller.archivePatient));

operationsRouter.get("/expenses", requirePermission("invoice.read"), asyncHandler(controller.listExpenses));
operationsRouter.post("/expenses", requireNoImpersonation, requirePermission("invoice.issue"), validate(schema.createExpenseSchema), asyncHandler(controller.createExpense));
operationsRouter.put("/expenses/:id", requireNoImpersonation, requirePermission("invoice.issue"), validate(schema.updateExpenseSchema), asyncHandler(controller.updateExpense));
operationsRouter.delete("/expenses/:id", requireNoImpersonation, requirePermission("invoice.issue"), validate(schema.idSchema), asyncHandler(controller.deleteExpense));

operationsRouter.get("/purchase-orders", requirePermission("purchase_order.read"), asyncHandler(controller.listPurchases));
operationsRouter.post("/purchase-orders", requireNoImpersonation, requirePermission("purchase_order.create"), validate(schema.createPurchaseSchema), asyncHandler(controller.createPurchase));
operationsRouter.post("/purchase-orders/:id/receive", requireNoImpersonation, requirePermission("inventory.manage"), validate(schema.receivePurchaseSchema), asyncHandler(controller.receivePurchase));

operationsRouter.get("/invoices", requirePermission("invoice.read"), asyncHandler(controller.listInvoices));
operationsRouter.post("/invoices", requireNoImpersonation, requirePermission("invoice.issue"), validate(schema.createInvoiceSchema), asyncHandler(controller.createInvoice));
operationsRouter.get("/reports/summary", requirePermission("invoice.read"), asyncHandler(controller.reportSummary));
