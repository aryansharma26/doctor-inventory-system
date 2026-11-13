import type { RequestHandler } from "express";
import { paginationSchema } from "../../utils/pagination.js";
import { ClinicService } from "./clinic.service.js";

const service = new ClinicService();

export const listClinics: RequestHandler = async (req, res) => {
  const { page, pageSize, search } = paginationSchema.parse(req.query);
  res.json({ success: true, ...(await service.list(page, pageSize, search)) });
};

export const getClinic: RequestHandler = async (req, res) => {
  res.json({ success: true, data: await service.get(String(req.params.id)) });
};

export const createClinic: RequestHandler = async (req, res) => {
  const data = await service.create(req.body, req.auth!.userId, req.requestId);
  res.status(201).json({ success: true, data });
};

export const updateClinic: RequestHandler = async (req, res) => {
  res.json({ success: true, data: await service.update(String(req.params.id), req.body, req.auth!.userId, req.requestId) });
};

export const setClinicStatus: RequestHandler = async (req, res) => {
  res.json({ success: true, data: await service.setStatus(String(req.params.id), req.body.status, req.auth!.userId, req.requestId) });
};

export const deleteClinic: RequestHandler = async (req, res) => {
  await service.remove(String(req.params.id), req.auth!.userId, req.requestId);
  res.status(204).send();
};
