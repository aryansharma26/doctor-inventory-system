import { createHash, randomUUID } from "node:crypto";
import type { RequestHandler } from "express";
import { ApiError } from "../../utils/api-error.js";
import { paginationSchema } from "../../utils/pagination.js";
import { InventoryService } from "./inventory.service.js";

const service = new InventoryService();

export const listInventory: RequestHandler = async (req, res) => {
  const { page, pageSize, search } = paginationSchema.parse(req.query);
  res.json({ success: true, ...(await service.list(req.auth!.clinicId!, page, pageSize, search)) });
};

export const addMedicine: RequestHandler = async (req, res) => {
  const data = await service.addMedicine(req.auth!.clinicId!, req.body);
  res.status(201).json({ success: true, data });
};

export const adjustStock: RequestHandler = async (req, res) => {
  const idempotencyKey = req.header("idempotency-key")?.trim() || randomUUID();
  if (idempotencyKey.length > 120) throw new ApiError(422, "INVALID_IDEMPOTENCY_KEY", "Idempotency key is too long");
  const requestHash = createHash("sha256").update(JSON.stringify(req.body)).digest("hex");
  const data = await service.adjustStock({
    clinicId: req.auth!.clinicId!, userId: req.auth!.userId, idempotencyKey, requestHash, ...req.body
  }, req.requestId);
  res.json({ success: true, data });
};
