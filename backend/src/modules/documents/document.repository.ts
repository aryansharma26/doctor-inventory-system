import type { Prisma } from "@prisma/client";
import { withTenant } from "../../config/database-context.js";
import { ApiError } from "../../utils/api-error.js";

export class DocumentRepository {
  create(clinicId: string, data: Omit<Prisma.DocumentUncheckedCreateInput, "clinicId">) {
    return withTenant(clinicId, async (tx) => {
      if (data.patientId) {
        const patient = await tx.patient.findFirst({
          where: { id: data.patientId, clinicId, isActive: true },
          select: { id: true }
        });
        if (!patient) throw new ApiError(422, "INVALID_PATIENT", "Select an active patient from this clinic");
      }
      if (data.appointmentId) {
        const appointment = await tx.appointment.findFirst({
          where: {
            id: data.appointmentId,
            clinicId,
            ...(data.patientId ? { patientId: data.patientId } : {})
          },
          select: { id: true }
        });
        if (!appointment) {
          throw new ApiError(422, "INVALID_APPOINTMENT", "Appointment does not belong to the selected patient and clinic");
        }
      }
      return tx.document.create({ data: { ...data, clinicId } });
    });
  }

  findById(clinicId: string, id: string) {
    return withTenant(clinicId, (tx) => tx.document.findFirst({ where: { id, clinicId, deletedAt: null } }));
  }

  list(clinicId: string) {
    return withTenant(clinicId, (tx) => tx.document.findMany({
      where: { clinicId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100
    }));
  }

  update(clinicId: string, id: string, data: Prisma.DocumentUpdateInput) {
    return withTenant(clinicId, (tx) => tx.document.update({ where: { id }, data }));
  }
}
