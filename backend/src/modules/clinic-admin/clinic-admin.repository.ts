import type { Prisma, Role } from "@prisma/client";
import { withTenant } from "../../config/database-context.js";
import { ApiError } from "../../utils/api-error.js";

export class ClinicAdminRepository {
  getSettings(clinicId: string) {
    return withTenant(clinicId, (tx) => tx.clinic.findUniqueOrThrow({ where: { id: clinicId }, select: { id: true, code: true, name: true, email: true, phone: true, timezone: true, currency: true, settings: true, locations: { orderBy: { name: "asc" } } } }));
  }

  updateSettings(clinicId: string, data: { name: string; email: string; phone?: string; timezone: string; currency: string; settings: Prisma.InputJsonValue }) {
    return withTenant(clinicId, (tx) => tx.clinic.update({ where: { id: clinicId }, data }));
  }

  listUsers(clinicId: string) {
    return withTenant(clinicId, (tx) => tx.userClinic.findMany({ where: { clinicId }, include: { user: { select: { id: true, fullName: true, email: true, phone: true, isActive: true, lastLoginAt: true } }, overrides: true }, orderBy: { createdAt: "desc" } }));
  }

  addMembership(clinicId: string, user: { id: string; email: string; fullName: string }, role: Role) {
    return withTenant(clinicId, async (tx) => {
      await tx.user.upsert({ where: { id: user.id }, update: { email: user.email, fullName: user.fullName, isActive: true }, create: user });
      const existing = await tx.userClinic.findUnique({ where: { userId_clinicId: { userId: user.id, clinicId } } });
      if (existing) throw new ApiError(409, "MEMBERSHIP_EXISTS", "This user already belongs to the clinic");
      return tx.userClinic.create({ data: { clinicId, userId: user.id, role }, include: { user: true } });
    });
  }

  updateMembership(clinicId: string, id: string, isActive: boolean) {
    return withTenant(clinicId, async (tx) => {
      const membership = await tx.userClinic.findFirst({ where: { id, clinicId } });
      if (!membership) throw new ApiError(404, "MEMBERSHIP_NOT_FOUND", "Clinic membership was not found");
      if (membership.role === "CLINIC_OWNER" && !isActive) throw new ApiError(409, "OWNER_REQUIRED", "The clinic owner cannot be deactivated");
      return tx.userClinic.update({ where: { id }, data: { isActive }, include: { user: true } });
    });
  }
}
