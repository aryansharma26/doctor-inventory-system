import type { RequestHandler } from "express";
import { DocumentService } from "./document.service.js";

const service = new DocumentService();

export const createUpload: RequestHandler = async (req, res) =>
  res.status(201).json({ success: true, data: await service.createUpload(req.auth!.clinicId!, req.auth!.userId, req.body) });

export const finalizeUpload: RequestHandler = async (req, res) =>
  res.json({ success: true, data: await service.finalize(req.auth!.clinicId!, String(req.params.id), req.body, req.auth!.userId, req.requestId) });

export const listDocuments: RequestHandler = async (req, res) =>
  res.json({ success: true, data: await service.list(req.auth!.clinicId!) });

export const downloadDocument: RequestHandler = async (req, res) =>
  res.json({ success: true, data: await service.download(req.auth!.clinicId!, String(req.params.id)) });

