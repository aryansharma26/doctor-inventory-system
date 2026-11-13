import type { RequestHandler } from "express";
import { prisma } from "../../config/database.js";
import { withTenant } from "../../config/database-context.js";
import { ApiError } from "../../utils/api-error.js";

export const listPermissions: RequestHandler = async (_req, res) => {
  const data = await prisma.permission.findMany({ orderBy: [{ category: "asc" }, { key: "asc" }] });
  res.json({ success: true, data });
};

export const updateMembershipOverrides: RequestHandler = async (req, res) => {
  const membershipId = String(req.params.membershipId);
  const clinicId = req.auth!.clinicId!;
  const membership = await prisma.userClinic.findFirst({
    where: { id: membershipId, clinicId }
  });
  if (!membership) throw new ApiError(404, "MEMBERSHIP_NOT_FOUND", "Clinic membership was not found");
  const permissionKeys = req.body.overrides.map((item: { permissionKey: string }) => item.permissionKey);
  const validCount = await prisma.permission.count({ where: { key: { in: permissionKeys } } });
  if (validCount !== new Set(permissionKeys).size) throw new ApiError(422, "UNKNOWN_PERMISSION", "One or more permissions are invalid");
  const data = await withTenant(clinicId, async (tx) => {
    await tx.userClinicPermission.deleteMany({ where: { membershipId } });
    if (req.body.overrides.length) await tx.userClinicPermission.createMany({
      data: req.body.overrides.map((item: { permissionKey: string; effect: "GRANT" | "DENY" }) => ({ membershipId, ...item }))
    });
    await tx.auditLog.create({
      data: {
        clinicId,
        actorId: req.auth!.userId,
        action: "membership.permissions.updated",
        entityType: "UserClinic",
        entityId: membershipId,
        after: { overrides: req.body.overrides },
        requestId: req.requestId
      }
    });
    return tx.userClinicPermission.findMany({ where: { membershipId } });
  });
  res.json({ success: true, data });
};
