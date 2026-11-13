import type { RequestHandler } from "express";
import { ClinicAdminService } from "./clinic-admin.service.js";

const service = new ClinicAdminService();
export const getSettings: RequestHandler = async (req, res) => { res.json({ success: true, data: await service.getSettings(req.auth!.clinicId!) }); };
export const updateSettings: RequestHandler = async (req, res) => { res.json({ success: true, data: await service.updateSettings(req.auth!.clinicId!, req.auth!.userId, req.requestId, req.body) }); };
export const listUsers: RequestHandler = async (req, res) => { res.json({ success: true, data: await service.listUsers(req.auth!.clinicId!) }); };
export const inviteUser: RequestHandler = async (req, res) => { res.status(201).json({ success: true, data: await service.invite(req.auth!.clinicId!, req.auth!.userId, req.requestId, req.body) }); };
export const updateMembership: RequestHandler = async (req, res) => { res.json({ success: true, data: await service.updateMembership(req.auth!.clinicId!, req.auth!.userId, req.requestId, String(req.params.id), req.body.isActive) }); };
