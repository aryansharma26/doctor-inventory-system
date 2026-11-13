import type { RequestHandler } from "express";
import { prisma } from "../../config/database.js";
import { withPlatform } from "../../config/database-context.js";
import { ApiError } from "../../utils/api-error.js";

export const startImpersonation: RequestHandler = async (req, res) => {
  const clinic = await prisma.clinic.findFirst({ where: { id: req.body.clinicId, status: "ACTIVE", deletedAt: null } });
  if (!clinic) throw new ApiError(404, "CLINIC_NOT_FOUND", "An active clinic was not found");
  const session = await withPlatform(async (tx) => {
    await tx.impersonationSession.updateMany({
      where: { impersonatorId: req.auth!.userId, endedAt: null },
      data: { endedAt: new Date() }
    });
    const created = await tx.impersonationSession.create({
      data: { clinicId: clinic.id, impersonatorId: req.auth!.userId, reason: req.body.reason }
    });
    await tx.auditLog.create({
      data: {
        actorId: req.auth!.userId,
        clinicId: clinic.id,
        action: "support.impersonation.started",
        entityType: "ImpersonationSession",
        entityId: created.id,
        after: { reason: req.body.reason },
        requestId: req.requestId,
        ipAddress: req.ip ?? null,
        userAgent: req.header("user-agent") ?? null
      }
    });
    return created;
  });
  res.status(201).json({ success: true, data: { id: session.id, clinicId: session.clinicId, expiresAt: new Date(session.startedAt.getTime() + 30 * 60_000) } });
};

export const stopImpersonation: RequestHandler = async (req, res) => {
  const result = await withPlatform(async (tx) => {
    const updated = await tx.impersonationSession.updateMany({
      where: { id: String(req.params.id), impersonatorId: req.auth!.userId, endedAt: null },
      data: { endedAt: new Date() }
    });
    if (updated.count) await tx.auditLog.create({
      data: {
        actorId: req.auth!.userId,
        action: "support.impersonation.ended",
        entityType: "ImpersonationSession",
        entityId: String(req.params.id),
        requestId: req.requestId
      }
    });
    return updated;
  });
  if (!result.count) throw new ApiError(404, "IMPERSONATION_NOT_FOUND", "Active support session was not found");
  res.status(204).send();
};
