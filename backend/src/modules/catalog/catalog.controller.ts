import type { RequestHandler } from "express";
import { paginationSchema } from "../../utils/pagination.js";
import { CatalogService } from "./catalog.service.js";

const service = new CatalogService();
export const listMedicines: RequestHandler = async (req, res) => {
  const { page, pageSize, search } = paginationSchema.parse(req.query);
  const { rows, total } = await service.list(req.auth!.clinicId!, page, pageSize, search);
  res.json({ success: true, data: rows, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
};
export const lookups: RequestHandler = async (req, res) => { res.json({ success: true, data: await service.lookups(req.auth!.clinicId!) }); };
export const createMedicine: RequestHandler = async (req, res) => { res.status(201).json({ success: true, data: await service.createMedicine(req.auth!.clinicId!, req.auth!.userId, req.requestId, req.body) }); };
export const createCategory: RequestHandler = async (req, res) => { const { country: _country, ...data } = req.body; res.status(201).json({ success: true, data: await service.createCategory(req.auth!.clinicId!, data) }); };
export const createManufacturer: RequestHandler = async (req, res) => { const { description: _description, ...data } = req.body; res.status(201).json({ success: true, data: await service.createManufacturer(req.auth!.clinicId!, data) }); };
