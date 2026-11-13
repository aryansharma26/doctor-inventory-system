import type { RequestHandler } from "express";
import { prisma } from "../../config/database.js";

export const me: RequestHandler = async (req, res) => {
  const auth = req.auth!;
  res.json({
    success: true,
    data: {
      user: {
        id: auth.userId,
        email: auth.email,
        fullName: auth.fullName,
        isPlatformAdmin: auth.isPlatformAdmin
      },
      assuranceLevel: auth.assuranceLevel,
      selectedClinicId: auth.clinicId ?? null,
      selectedRole: auth.role ?? null,
      permissions: auth.permissions,
      clinics: auth.availableClinics,
      impersonationId: auth.impersonationId ?? null
    }
  });
};

export const recordSession: RequestHandler = async (req, res) => {
  const recent = await prisma.loginHistory.findFirst({
    where: { userId: req.auth!.userId, success: true, occurredAt: { gte: new Date(Date.now() - 5 * 60_000) } },
    orderBy: { occurredAt: "desc" }
  });
  if (!recent) {
    await prisma.$transaction([
      prisma.loginHistory.create({
        data: {
          userId: req.auth!.userId,
          success: true,
          ipAddress: req.ip ?? null,
          userAgent: req.header("user-agent")?.slice(0, 500) ?? null
        }
      }),
      prisma.user.update({ where: { id: req.auth!.userId }, data: { lastLoginAt: new Date() } })
    ]);
  }
  res.status(204).send();
};
