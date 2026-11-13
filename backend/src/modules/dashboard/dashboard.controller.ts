import type { RequestHandler } from "express";
import { DashboardRepository } from "./dashboard.repository.js";

const repository = new DashboardRepository();
export const clinicDashboard: RequestHandler = async (req, res) =>
  res.json({
    success: true,
    data: await repository.clinic(req.auth!.clinicId!, {
      ...(req.auth!.role ? { role: req.auth!.role } : {}),
      ...(req.auth!.membershipId ? { membershipId: req.auth!.membershipId } : {})
    })
  });
export const platformDashboard: RequestHandler = async (_req, res) =>
  res.json({ success: true, data: await repository.platform() });
