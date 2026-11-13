import type { Request, RequestHandler } from "express";
import { paginationSchema } from "../../utils/pagination.js";
import { OperationsService } from "./operations.service.js";

const service = new OperationsService();
const actor = (req: Request) => ({ clinicId: req.auth!.clinicId!, userId: req.auth!.userId, requestId: req.requestId });
const listOptions = (req: Request) => paginationSchema.parse(req.query);
const listResponse = <T extends { rows: unknown[]; total: number }>(result: T, page: number, pageSize: number) => ({
  success: true, data: result.rows, meta: { page, pageSize, total: result.total, totalPages: Math.ceil(result.total / pageSize) },
  ...("totalAmount" in result ? { summary: { totalAmount: result.totalAmount } } : {})
});

export const listSuppliers: RequestHandler = async (req, res) => { const options = listOptions(req); res.json(listResponse(await service.listSuppliers(req.auth!.clinicId!, options), options.page, options.pageSize)); };
export const createSupplier: RequestHandler = async (req, res) => { res.status(201).json({ success: true, data: await service.createSupplier(actor(req), req.body) }); };
export const updateSupplier: RequestHandler = async (req, res) => { res.json({ success: true, data: await service.updateSupplier(actor(req), String(req.params.id), req.body) }); };
export const archiveSupplier: RequestHandler = async (req, res) => { res.json({ success: true, data: await service.archiveSupplier(actor(req), String(req.params.id)) }); };

export const listPatients: RequestHandler = async (req, res) => { const options = listOptions(req); res.json(listResponse(await service.listPatients(req.auth!.clinicId!, options), options.page, options.pageSize)); };
export const createPatient: RequestHandler = async (req, res) => { res.status(201).json({ success: true, data: await service.createPatient(actor(req), req.body) }); };
export const updatePatient: RequestHandler = async (req, res) => { res.json({ success: true, data: await service.updatePatient(actor(req), String(req.params.id), req.body) }); };
export const archivePatient: RequestHandler = async (req, res) => { res.json({ success: true, data: await service.archivePatient(actor(req), String(req.params.id)) }); };

export const listExpenses: RequestHandler = async (req, res) => { const options = listOptions(req); res.json(listResponse(await service.listExpenses(req.auth!.clinicId!, options), options.page, options.pageSize)); };
export const createExpense: RequestHandler = async (req, res) => { res.status(201).json({ success: true, data: await service.createExpense(actor(req), req.body) }); };
export const updateExpense: RequestHandler = async (req, res) => { res.json({ success: true, data: await service.updateExpense(actor(req), String(req.params.id), req.body) }); };
export const deleteExpense: RequestHandler = async (req, res) => { await service.deleteExpense(actor(req), String(req.params.id)); res.status(204).end(); };

export const listPurchases: RequestHandler = async (req, res) => { const options = listOptions(req); res.json(listResponse(await service.listPurchases(req.auth!.clinicId!, options), options.page, options.pageSize)); };
export const createPurchase: RequestHandler = async (req, res) => { res.status(201).json({ success: true, data: await service.createPurchase(actor(req), req.body) }); };
export const receivePurchase: RequestHandler = async (req, res) => { res.json({ success: true, data: await service.receivePurchase(actor(req), String(req.params.id), req.body.locationId, req.body.items) }); };

export const listInvoices: RequestHandler = async (req, res) => { const options = listOptions(req); res.json(listResponse(await service.listInvoices(req.auth!.clinicId!, options), options.page, options.pageSize)); };
export const createInvoice: RequestHandler = async (req, res) => { res.status(201).json({ success: true, data: await service.createInvoice(actor(req), req.body) }); };
export const reportSummary: RequestHandler = async (req, res) => { res.json({ success: true, data: await service.reportSummary(req.auth!.clinicId!) }); };
