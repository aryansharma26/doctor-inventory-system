import { randomUUID } from "node:crypto";
import { type AppointmentStatus, type PrescriptionStatus, Prisma } from "@prisma/client";
import { type TransactionClient, withTenant } from "../../config/database-context.js";
import { ApiError } from "../../utils/api-error.js";
import type {
  AppointmentFilters,
  CreateAllergyDto,
  CreateAppointmentDto,
  CreateAppointmentInvoiceDto,
  CreateDiagnosisDto,
  CreateDoctorTimeOffDto,
  CreateFollowUpDto,
  CreateInsuranceDto,
  CreateLabReportDto,
  CreateMedicalHistoryDto,
  CreatePatientNoteDto,
  CreatePaymentDto,
  CreatePrescriptionDto,
  CreateVaccinationDto,
  CreateVitalDto,
  PrescriptionFilters,
  UpdateAppointmentClinicalDto,
  UpdateDoctorAvailabilityDto,
  UpdateFollowUpStatusDto,
  UpdatePatientProfileDto
} from "./practice.dto.js";

const appointmentInclude = {
  patient: true,
  doctor: { include: { user: { select: { id: true, fullName: true, email: true } } } }
} satisfies Prisma.AppointmentInclude;

const recordedBySelect = { id: true, fullName: true } as const;

async function assertPatientContext(
  tx: TransactionClient,
  clinicId: string,
  patientId: string,
  appointmentId?: string
) {
  const [patient, appointment] = await Promise.all([
    tx.patient.findFirst({ where: { id: patientId, clinicId, isActive: true }, select: { id: true } }),
    appointmentId
      ? tx.appointment.findFirst({ where: { id: appointmentId, clinicId, patientId }, select: { id: true } })
      : Promise.resolve(null)
  ]);
  if (!patient) throw new ApiError(404, "PATIENT_NOT_FOUND", "Patient was not found");
  if (appointmentId && !appointment) {
    throw new ApiError(422, "INVALID_APPOINTMENT", "Appointment does not belong to this patient and clinic");
  }
}

const referenceNumber = (prefix: string) =>
  `${prefix}-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 6).toUpperCase()}`;

function localDayAndMinutes(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(value("weekday"));
  return { day, minutes: Number(value("hour")) * 60 + Number(value("minute")) };
}

export class PracticeRepository {
  listDoctors(clinicId: string) {
    return withTenant(clinicId, (tx) => tx.userClinic.findMany({
      where: { clinicId, isActive: true, role: { in: ["DOCTOR", "CLINIC_OWNER"] }, user: { isActive: true } },
      select: { id: true, role: true, user: { select: { id: true, fullName: true, email: true, phone: true } } },
      orderBy: { user: { fullName: "asc" } }
    }));
  }

  listAppointments(clinicId: string, filters: AppointmentFilters) {
    const where: Prisma.AppointmentWhereInput = {
      clinicId,
      startsAt: { gte: filters.from, lt: filters.to },
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.doctorMembershipId ? { doctorMembershipId: filters.doctorMembershipId } : {}),
      ...(filters.patientId ? { patientId: filters.patientId } : {}),
      ...(filters.search ? {
        OR: [
          { patient: { name: { contains: filters.search, mode: "insensitive" } } },
          { patient: { patientCode: { contains: filters.search, mode: "insensitive" } } },
          { reason: { contains: filters.search, mode: "insensitive" } }
        ]
      } : {})
    };
    return withTenant(clinicId, (tx) => tx.appointment.findMany({
      where,
      include: appointmentInclude,
      orderBy: [{ startsAt: "asc" }, { createdAt: "asc" }]
    }));
  }

  createAppointment(clinicId: string, userId: string, data: CreateAppointmentDto) {
    return withTenant(clinicId, async (tx) => {
      const [patient, doctor, conflict, timeOff, clinic, availability] = await Promise.all([
        tx.patient.findFirst({ where: { id: data.patientId, clinicId, isActive: true }, select: { id: true } }),
        tx.userClinic.findFirst({
          where: {
            id: data.doctorMembershipId,
            clinicId,
            isActive: true,
            role: { in: ["DOCTOR", "CLINIC_OWNER"] },
            user: { isActive: true }
          },
          select: { id: true }
        }),
        tx.appointment.findFirst({
          where: {
            clinicId,
            doctorMembershipId: data.doctorMembershipId,
            status: { notIn: ["CANCELLED", "NO_SHOW"] },
            startsAt: { lt: data.endsAt },
            endsAt: { gt: data.startsAt }
          },
          select: { id: true }
        }),
        tx.doctorTimeOff.findFirst({
          where: {
            clinicId,
            doctorMembershipId: data.doctorMembershipId,
            startsAt: { lt: data.endsAt },
            endsAt: { gt: data.startsAt }
          },
          select: { id: true, reason: true }
        }),
        tx.clinic.findUnique({ where: { id: clinicId }, select: { timezone: true } }),
        tx.doctorAvailability.findMany({
          where: { clinicId, doctorMembershipId: data.doctorMembershipId, isActive: true },
          select: { dayOfWeek: true, startMinutes: true, endMinutes: true }
        })
      ]);
      if (!patient) throw new ApiError(422, "INVALID_PATIENT", "Select an active patient from this clinic");
      if (!doctor) throw new ApiError(422, "INVALID_DOCTOR", "Select an active doctor from this clinic");
      if (conflict) throw new ApiError(409, "APPOINTMENT_CONFLICT", "The selected doctor already has an appointment during this time");
      if (timeOff) throw new ApiError(409, "DOCTOR_UNAVAILABLE", timeOff.reason || "The selected doctor is unavailable during this time");
      if (availability.length && clinic) {
        const localStart = localDayAndMinutes(data.startsAt, clinic.timezone);
        const localEnd = localDayAndMinutes(data.endsAt, clinic.timezone);
        const insideWorkingHours = localStart.day === localEnd.day && availability.some((slot) =>
          slot.dayOfWeek === localStart.day &&
          localStart.minutes >= slot.startMinutes &&
          localEnd.minutes <= slot.endMinutes
        );
        if (!insideWorkingHours) {
          throw new ApiError(409, "OUTSIDE_DOCTOR_AVAILABILITY", "Appointment is outside the doctor's configured working hours");
        }
      }
      if (data.reminderAt && data.reminderAt >= data.startsAt) {
        throw new ApiError(422, "INVALID_REMINDER_TIME", "Reminder time must be before the appointment");
      }
      return tx.appointment.create({
        data: {
          clinicId,
          createdById: userId,
          patientId: data.patientId,
          doctorMembershipId: data.doctorMembershipId,
          type: data.type,
          startsAt: data.startsAt,
          endsAt: data.endsAt,
          color: data.color,
          ...(data.reason ? { reason: data.reason } : {}),
          ...(data.symptoms ? { symptoms: data.symptoms } : {}),
          ...(data.notes ? { notes: data.notes } : {}),
          ...(data.reminderAt ? { reminderAt: data.reminderAt } : {})
        },
        include: appointmentInclude
      });
    }, { isolationLevel: "Serializable" });
  }

  updateAppointmentStatus(
    clinicId: string,
    id: string,
    status: AppointmentStatus,
    notes?: string
  ) {
    return withTenant(clinicId, async (tx) => {
      const existing = await tx.appointment.findFirst({ where: { id, clinicId } });
      if (!existing) throw new ApiError(404, "APPOINTMENT_NOT_FOUND", "Appointment was not found");
      const transitions: Record<AppointmentStatus, AppointmentStatus[]> = {
        BOOKED: ["CONFIRMED", "CHECKED_IN", "CANCELLED", "NO_SHOW"],
        CONFIRMED: ["CHECKED_IN", "CANCELLED", "NO_SHOW"],
        CHECKED_IN: ["IN_CONSULTATION", "CANCELLED"],
        IN_CONSULTATION: ["COMPLETED"],
        COMPLETED: [],
        CANCELLED: [],
        NO_SHOW: []
      };
      if (status !== existing.status && !transitions[existing.status].includes(status)) {
        throw new ApiError(409, "INVALID_APPOINTMENT_TRANSITION", `Appointment cannot move from ${existing.status} to ${status}`);
      }
      const timestampData = {
        ...(status === "CHECKED_IN" && !existing.checkedInAt ? { checkedInAt: new Date() } : {}),
        ...(status === "IN_CONSULTATION" && !existing.consultationStartedAt ? { consultationStartedAt: new Date() } : {}),
        ...(status === "COMPLETED" && !existing.completedAt ? { completedAt: new Date() } : {})
      };
      return tx.appointment.update({
        where: { id },
        data: { status, ...(notes !== undefined ? { notes } : {}), ...timestampData },
        include: appointmentInclude
      });
    });
  }

  getPatientRecord(clinicId: string, patientId: string) {
    return withTenant(clinicId, async (tx) => {
      const patient = await tx.patient.findFirst({
        where: { id: patientId, clinicId },
        include: {
          clinicalNotes: {
            include: { author: { select: { id: true, fullName: true } } },
            orderBy: { recordedAt: "desc" },
            take: 100
          },
          appointments: {
            include: appointmentInclude,
            orderBy: { startsAt: "desc" },
            take: 100
          },
          prescriptions: {
            include: {
              items: true,
              doctor: { include: { user: { select: { id: true, fullName: true } } } }
            },
            orderBy: { issuedAt: "desc" },
            take: 100
          },
          invoices: {
            select: {
              id: true,
              appointmentId: true,
              invoiceNumber: true,
              status: true,
              subtotal: true,
              discount: true,
              tax: true,
              total: true,
              paid: true,
              paymentMethod: true,
              issuedAt: true,
              dueAt: true,
              createdAt: true
            },
            orderBy: { createdAt: "desc" },
            take: 100
          },
          medicalHistories: {
            include: { recordedBy: { select: recordedBySelect } },
            orderBy: { createdAt: "desc" },
            take: 100
          },
          allergies: {
            include: { recordedBy: { select: recordedBySelect } },
            orderBy: { createdAt: "desc" },
            take: 100
          },
          vitals: {
            include: { recordedBy: { select: recordedBySelect } },
            orderBy: { recordedAt: "desc" },
            take: 100
          },
          diagnoses: {
            include: { recordedBy: { select: recordedBySelect } },
            orderBy: { diagnosedAt: "desc" },
            take: 100
          },
          labReports: {
            include: { recordedBy: { select: recordedBySelect } },
            orderBy: { orderedAt: "desc" },
            take: 100
          },
          vaccinations: {
            include: { recordedBy: { select: recordedBySelect } },
            orderBy: { administeredAt: "desc" },
            take: 100
          },
          insurancePolicies: {
            orderBy: [{ status: "asc" }, { validUntil: "desc" }],
            take: 50
          },
          followUps: {
            include: { recordedBy: { select: recordedBySelect } },
            orderBy: { dueAt: "desc" },
            take: 100
          },
          payments: {
            include: {
              recordedBy: { select: recordedBySelect },
              invoice: { select: { id: true, invoiceNumber: true } }
            },
            orderBy: { paidAt: "desc" },
            take: 100
          },
          documents: {
            where: { deletedAt: null },
            select: {
              id: true,
              appointmentId: true,
              originalName: true,
              contentType: true,
              category: true,
              status: true,
              metadata: true,
              createdAt: true,
              uploadedBy: { select: recordedBySelect }
            },
            orderBy: { createdAt: "desc" },
            take: 100
          }
        }
      });
      if (!patient) throw new ApiError(404, "PATIENT_NOT_FOUND", "Patient was not found");
      const balance = patient.invoices.reduce((sum, invoice) => sum.add(invoice.total.sub(invoice.paid)), new Prisma.Decimal(0));
      return { ...patient, accountBalance: balance };
    });
  }

  createPatientNote(clinicId: string, userId: string, patientId: string, data: CreatePatientNoteDto) {
    return withTenant(clinicId, async (tx) => {
      const patient = await tx.patient.findFirst({ where: { id: patientId, clinicId, isActive: true }, select: { id: true } });
      if (!patient) throw new ApiError(404, "PATIENT_NOT_FOUND", "Patient was not found");
      return tx.patientNote.create({
        data: {
          clinicId,
          patientId,
          authorId: userId,
          noteType: data.noteType,
          title: data.title,
          summary: data.summary,
          details: data.details as Prisma.InputJsonValue,
          ...(data.recordedAt ? { recordedAt: data.recordedAt } : {})
        },
        include: { author: { select: { id: true, fullName: true } } }
      });
    });
  }

  updatePatientProfile(clinicId: string, patientId: string, data: UpdatePatientProfileDto) {
    return withTenant(clinicId, async (tx) => {
      const existing = await tx.patient.findFirst({ where: { id: patientId, clinicId } });
      if (!existing) throw new ApiError(404, "PATIENT_NOT_FOUND", "Patient was not found");
      return tx.patient.update({
        where: { id: patientId },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
          ...(data.email !== undefined ? { email: data.email || null } : {}),
          ...(data.dateOfBirth !== undefined ? { dateOfBirth: data.dateOfBirth } : {}),
          ...(data.gender !== undefined ? { gender: data.gender || null } : {}),
          ...(data.bloodGroup !== undefined ? { bloodGroup: data.bloodGroup } : {}),
          ...(data.maritalStatus !== undefined ? { maritalStatus: data.maritalStatus || null } : {}),
          ...(data.occupation !== undefined ? { occupation: data.occupation || null } : {}),
          ...(data.preferredLanguage !== undefined ? { preferredLanguage: data.preferredLanguage || null } : {}),
          ...(data.address !== undefined
            ? { address: data.address === null ? Prisma.DbNull : data.address as Prisma.InputJsonValue }
            : {}),
          ...(data.emergencyContact !== undefined
            ? { emergencyContact: data.emergencyContact === null ? Prisma.DbNull : data.emergencyContact as Prisma.InputJsonValue }
            : {}),
          ...(data.communicationPreferences !== undefined
            ? { communicationPreferences: data.communicationPreferences as Prisma.InputJsonValue }
            : {}),
          ...(data.tags !== undefined ? { tags: [...new Set(data.tags.map((tag) => tag.toLowerCase()))] } : {}),
          ...(data.consentAt !== undefined ? { consentAt: data.consentAt } : {}),
          ...(data.notes !== undefined ? { notes: data.notes || null } : {})
        }
      });
    });
  }

  createMedicalHistory(
    clinicId: string,
    userId: string,
    patientId: string,
    data: CreateMedicalHistoryDto
  ) {
    return withTenant(clinicId, async (tx) => {
      await assertPatientContext(tx, clinicId, patientId, data.appointmentId);
      return tx.medicalHistory.create({
        data: {
          clinicId,
          patientId,
          recordedById: userId,
          condition: data.condition,
          status: data.status,
          isChronic: data.isChronic,
          ...(data.appointmentId ? { appointmentId: data.appointmentId } : {}),
          ...(data.category ? { category: data.category } : {}),
          ...(data.diagnosedOn ? { diagnosedOn: data.diagnosedOn } : {}),
          ...(data.resolvedOn ? { resolvedOn: data.resolvedOn } : {}),
          ...(data.treatment ? { treatment: data.treatment } : {}),
          ...(data.notes ? { notes: data.notes } : {})
        },
        include: { recordedBy: { select: recordedBySelect } }
      });
    });
  }

  createAllergy(clinicId: string, userId: string, patientId: string, data: CreateAllergyDto) {
    return withTenant(clinicId, async (tx) => {
      await assertPatientContext(tx, clinicId, patientId, data.appointmentId);
      return tx.allergy.create({
        data: {
          clinicId,
          patientId,
          recordedById: userId,
          allergen: data.allergen,
          allergyType: data.allergyType,
          severity: data.severity,
          status: data.status,
          ...(data.appointmentId ? { appointmentId: data.appointmentId } : {}),
          ...(data.reaction ? { reaction: data.reaction } : {}),
          ...(data.onsetDate ? { onsetDate: data.onsetDate } : {}),
          ...(data.notes ? { notes: data.notes } : {})
        },
        include: { recordedBy: { select: recordedBySelect } }
      });
    });
  }

  createVital(clinicId: string, userId: string, patientId: string, data: CreateVitalDto) {
    return withTenant(clinicId, async (tx) => {
      await assertPatientContext(tx, clinicId, patientId, data.appointmentId);
      const bmi = data.heightCm && data.weightKg
        ? Math.round((data.weightKg / ((data.heightCm / 100) ** 2)) * 100) / 100
        : undefined;
      return tx.vital.create({
        data: {
          clinicId,
          patientId,
          recordedById: userId,
          ...(data.appointmentId ? { appointmentId: data.appointmentId } : {}),
          ...(data.recordedAt ? { recordedAt: data.recordedAt } : {}),
          ...(data.systolicBp !== undefined ? { systolicBp: data.systolicBp } : {}),
          ...(data.diastolicBp !== undefined ? { diastolicBp: data.diastolicBp } : {}),
          ...(data.heartRate !== undefined ? { heartRate: data.heartRate } : {}),
          ...(data.respiratoryRate !== undefined ? { respiratoryRate: data.respiratoryRate } : {}),
          ...(data.temperatureCelsius !== undefined ? { temperatureCelsius: data.temperatureCelsius } : {}),
          ...(data.oxygenSaturation !== undefined ? { oxygenSaturation: data.oxygenSaturation } : {}),
          ...(data.heightCm !== undefined ? { heightCm: data.heightCm } : {}),
          ...(data.weightKg !== undefined ? { weightKg: data.weightKg } : {}),
          ...(bmi !== undefined ? { bmi } : {}),
          ...(data.bloodGlucoseMgDl !== undefined ? { bloodGlucoseMgDl: data.bloodGlucoseMgDl } : {}),
          ...(data.painScore !== undefined ? { painScore: data.painScore } : {}),
          ...(data.notes ? { notes: data.notes } : {})
        },
        include: { recordedBy: { select: recordedBySelect } }
      });
    });
  }

  createDiagnosis(clinicId: string, userId: string, patientId: string, data: CreateDiagnosisDto) {
    return withTenant(clinicId, async (tx) => {
      await assertPatientContext(tx, clinicId, patientId, data.appointmentId);
      return tx.diagnosis.create({
        data: {
          clinicId,
          patientId,
          recordedById: userId,
          name: data.name,
          diagnosisType: data.diagnosisType,
          status: data.status,
          ...(data.appointmentId ? { appointmentId: data.appointmentId } : {}),
          ...(data.code ? { code: data.code.toUpperCase() } : {}),
          ...(data.diagnosedAt ? { diagnosedAt: data.diagnosedAt } : {}),
          ...(data.resolvedAt ? { resolvedAt: data.resolvedAt } : {}),
          ...(data.notes ? { notes: data.notes } : {})
        },
        include: { recordedBy: { select: recordedBySelect } }
      });
    });
  }

  createLabReport(clinicId: string, userId: string, patientId: string, data: CreateLabReportDto) {
    return withTenant(clinicId, async (tx) => {
      await assertPatientContext(tx, clinicId, patientId, data.appointmentId);
      return tx.labReport.create({
        data: {
          clinicId,
          patientId,
          recordedById: userId,
          reportNumber: data.reportNumber || referenceNumber("LAB"),
          testName: data.testName,
          status: data.status,
          results: data.results as Prisma.InputJsonValue,
          abnormal: data.abnormal,
          ...(data.appointmentId ? { appointmentId: data.appointmentId } : {}),
          ...(data.labName ? { labName: data.labName } : {}),
          ...(data.orderedAt ? { orderedAt: data.orderedAt } : {}),
          ...(data.collectedAt ? { collectedAt: data.collectedAt } : {}),
          ...(data.reportedAt ? { reportedAt: data.reportedAt } : {}),
          ...(data.interpretation ? { interpretation: data.interpretation } : {}),
          ...(data.notes ? { notes: data.notes } : {})
        },
        include: { recordedBy: { select: recordedBySelect } }
      });
    });
  }

  createVaccination(clinicId: string, userId: string, patientId: string, data: CreateVaccinationDto) {
    return withTenant(clinicId, async (tx) => {
      await assertPatientContext(tx, clinicId, patientId, data.appointmentId);
      return tx.vaccination.create({
        data: {
          clinicId,
          patientId,
          recordedById: userId,
          vaccineName: data.vaccineName,
          administeredAt: data.administeredAt,
          ...(data.appointmentId ? { appointmentId: data.appointmentId } : {}),
          ...(data.disease ? { disease: data.disease } : {}),
          ...(data.doseNumber ? { doseNumber: data.doseNumber } : {}),
          ...(data.lotNumber ? { lotNumber: data.lotNumber } : {}),
          ...(data.manufacturer ? { manufacturer: data.manufacturer } : {}),
          ...(data.route ? { route: data.route } : {}),
          ...(data.site ? { site: data.site } : {}),
          ...(data.nextDoseAt ? { nextDoseAt: data.nextDoseAt } : {}),
          ...(data.adverseReaction ? { adverseReaction: data.adverseReaction } : {}),
          ...(data.notes ? { notes: data.notes } : {})
        },
        include: { recordedBy: { select: recordedBySelect } }
      });
    });
  }

  createInsurance(clinicId: string, patientId: string, data: CreateInsuranceDto) {
    return withTenant(clinicId, async (tx) => {
      await assertPatientContext(tx, clinicId, patientId);
      return tx.insurancePolicy.create({
        data: {
          clinicId,
          patientId,
          providerName: data.providerName,
          policyNumber: data.policyNumber,
          policyHolder: data.policyHolder,
          status: data.status,
          metadata: data.metadata as Prisma.InputJsonValue,
          ...(data.planName ? { planName: data.planName } : {}),
          ...(data.memberId ? { memberId: data.memberId } : {}),
          ...(data.groupNumber ? { groupNumber: data.groupNumber } : {}),
          ...(data.relationship ? { relationship: data.relationship } : {}),
          ...(data.validFrom ? { validFrom: data.validFrom } : {}),
          ...(data.validUntil ? { validUntil: data.validUntil } : {}),
          ...(data.coverageAmount !== undefined ? { coverageAmount: data.coverageAmount } : {}),
          ...(data.copayAmount !== undefined ? { copayAmount: data.copayAmount } : {}),
          ...(data.notes ? { notes: data.notes } : {})
        }
      });
    });
  }

  createFollowUp(clinicId: string, userId: string, patientId: string, data: CreateFollowUpDto) {
    return withTenant(clinicId, async (tx) => {
      await assertPatientContext(tx, clinicId, patientId, data.appointmentId);
      if (data.assignedToId) {
        const assignee = await tx.userClinic.findFirst({
          where: { id: data.assignedToId, clinicId, isActive: true },
          select: { id: true }
        });
        if (!assignee) throw new ApiError(422, "INVALID_ASSIGNEE", "Follow-up assignee is not an active clinic user");
      }
      return tx.followUp.create({
        data: {
          clinicId,
          patientId,
          recordedById: userId,
          dueAt: data.dueAt,
          reason: data.reason,
          priority: data.priority,
          ...(data.appointmentId ? { appointmentId: data.appointmentId } : {}),
          ...(data.channel ? { channel: data.channel } : {}),
          ...(data.assignedToId ? { assignedToId: data.assignedToId } : {}),
          ...(data.notes ? { notes: data.notes } : {})
        },
        include: { recordedBy: { select: recordedBySelect } }
      });
    });
  }

  updateFollowUpStatus(
    clinicId: string,
    patientId: string,
    id: string,
    data: UpdateFollowUpStatusDto
  ) {
    return withTenant(clinicId, async (tx) => {
      const existing = await tx.followUp.findFirst({ where: { id, clinicId, patientId } });
      if (!existing) throw new ApiError(404, "FOLLOW_UP_NOT_FOUND", "Follow-up was not found");
      return tx.followUp.update({
        where: { id },
        data: {
          status: data.status,
          ...(data.outcome !== undefined ? { outcome: data.outcome || null } : {}),
          ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
          ...(data.status === "COMPLETED" && !existing.completedAt ? { completedAt: new Date() } : {}),
          ...(data.status !== "COMPLETED" && existing.completedAt ? { completedAt: null } : {})
        },
        include: { recordedBy: { select: recordedBySelect } }
      });
    });
  }

  createPayment(clinicId: string, userId: string, patientId: string, data: CreatePaymentDto) {
    return withTenant(clinicId, async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: data.invoiceId, clinicId, patientId },
        select: {
          id: true,
          patientId: true,
          appointmentId: true,
          total: true,
          paid: true,
          status: true
        }
      });
      if (!invoice) throw new ApiError(404, "INVOICE_NOT_FOUND", "Invoice was not found for this patient");
      if (["DRAFT", "VOID"].includes(invoice.status)) {
        throw new ApiError(409, "INVOICE_NOT_PAYABLE", "Draft or void invoices cannot accept payments");
      }
      const amount = new Prisma.Decimal(data.amount);
      const outstanding = invoice.total.sub(invoice.paid);
      if (amount.greaterThan(outstanding)) {
        throw new ApiError(422, "OVERPAYMENT", "Payment amount cannot exceed the invoice balance");
      }
      const nextPaid = invoice.paid.add(amount);
      const payment = await tx.payment.create({
        data: {
          clinicId,
          patientId,
          invoiceId: invoice.id,
          recordedById: userId,
          receiptNumber: referenceNumber("RCT"),
          amount,
          method: data.method,
          ...(invoice.appointmentId ? { appointmentId: invoice.appointmentId } : {}),
          ...(data.transactionReference ? { transactionReference: data.transactionReference } : {}),
          ...(data.notes ? { notes: data.notes } : {}),
          ...(data.paidAt ? { paidAt: data.paidAt } : {})
        },
        include: {
          recordedBy: { select: recordedBySelect },
          invoice: { select: { id: true, invoiceNumber: true } }
        }
      });
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paid: nextPaid,
          status: nextPaid.greaterThanOrEqualTo(invoice.total) ? "PAID" : "PARTIALLY_PAID",
          paymentMethod: data.method
        }
      });
      return payment;
    }, { isolationLevel: "Serializable" });
  }

  listPrescriptions(clinicId: string, filters: PrescriptionFilters) {
    const where: Prisma.PrescriptionWhereInput = {
      clinicId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.patientId ? { patientId: filters.patientId } : {}),
      ...(filters.search ? {
        OR: [
          { prescriptionNumber: { contains: filters.search, mode: "insensitive" } },
          { patient: { name: { contains: filters.search, mode: "insensitive" } } },
          { diagnosis: { contains: filters.search, mode: "insensitive" } }
        ]
      } : {})
    };
    return withTenant(clinicId, async (tx) => {
      const [rows, total] = await Promise.all([
        tx.prescription.findMany({
          where,
          include: {
            patient: true,
            doctor: { include: { user: { select: { id: true, fullName: true } } } },
            items: true
          },
          skip: (filters.page - 1) * filters.pageSize,
          take: filters.pageSize,
          orderBy: { issuedAt: "desc" }
        }),
        tx.prescription.count({ where })
      ]);
      return { rows, total };
    });
  }

  createPrescription(clinicId: string, data: CreatePrescriptionDto) {
    return withTenant(clinicId, async (tx) => {
      const [patient, doctor, appointment] = await Promise.all([
        tx.patient.findFirst({ where: { id: data.patientId, clinicId, isActive: true }, select: { id: true } }),
        tx.userClinic.findFirst({
          where: {
            id: data.doctorMembershipId,
            clinicId,
            isActive: true,
            role: { in: ["DOCTOR", "CLINIC_OWNER"] },
            user: { isActive: true }
          },
          select: { id: true }
        }),
        data.appointmentId
          ? tx.appointment.findFirst({ where: { id: data.appointmentId, clinicId, patientId: data.patientId }, select: { id: true } })
          : Promise.resolve(null)
      ]);
      if (!patient) throw new ApiError(422, "INVALID_PATIENT", "Select an active patient from this clinic");
      if (!doctor) throw new ApiError(422, "INVALID_DOCTOR", "Select an active doctor from this clinic");
      if (data.appointmentId && !appointment) throw new ApiError(422, "INVALID_APPOINTMENT", "Appointment does not belong to this patient and clinic");
      if (data.expiresAt && data.expiresAt <= new Date()) throw new ApiError(422, "INVALID_EXPIRY", "Prescription expiry must be in the future");
      const medicineIds = data.items.flatMap((item) => item.medicineId ? [item.medicineId] : []);
      if (medicineIds.length) {
        const clinicMedicines = await tx.clinicMedicine.count({
          where: { clinicId, medicineId: { in: medicineIds }, isActive: true }
        });
        if (clinicMedicines !== new Set(medicineIds).size) {
          throw new ApiError(422, "INVALID_MEDICINE", "One or more selected medicines are not active in this clinic");
        }
      }
      return tx.prescription.create({
        data: {
          clinicId,
          patientId: data.patientId,
          doctorMembershipId: data.doctorMembershipId,
          ...(data.appointmentId ? { appointmentId: data.appointmentId } : {}),
          ...(data.diagnosis ? { diagnosis: data.diagnosis } : {}),
          ...(data.notes ? { notes: data.notes } : {}),
          ...(data.expiresAt ? { expiresAt: data.expiresAt } : {}),
          prescriptionNumber: `RX-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 6).toUpperCase()}`,
          items: {
            create: data.items.map((item) => ({
              medicineName: item.medicineName,
              dosage: item.dosage,
              frequency: item.frequency,
              ...(item.medicineId ? { medicineId: item.medicineId } : {}),
              ...(item.durationDays ? { durationDays: item.durationDays } : {}),
              ...(item.quantity ? { quantity: item.quantity } : {}),
              ...(item.instructions ? { instructions: item.instructions } : {})
            }))
          }
        },
        include: {
          patient: true,
          doctor: { include: { user: { select: { id: true, fullName: true } } } },
          items: true
        }
      });
    });
  }

  updatePrescriptionStatus(clinicId: string, id: string, status: PrescriptionStatus) {
    return withTenant(clinicId, async (tx) => {
      const existing = await tx.prescription.findFirst({ where: { id, clinicId } });
      if (!existing) throw new ApiError(404, "PRESCRIPTION_NOT_FOUND", "Prescription was not found");
      if (existing.status === "CANCELLED" && status !== "CANCELLED") {
        throw new ApiError(409, "INVALID_PRESCRIPTION_TRANSITION", "A cancelled prescription cannot be reopened");
      }
      return tx.prescription.update({
        where: { id },
        data: { status },
        include: {
          patient: true,
          doctor: { include: { user: { select: { id: true, fullName: true } } } },
          items: true
        }
      });
    });
  }

  getAppointmentEncounter(clinicId: string, id: string) {
    return withTenant(clinicId, async (tx) => {
      const appointment = await tx.appointment.findFirst({
        where: { id, clinicId },
        include: {
          patient: true,
          doctor: { include: { user: { select: { id: true, fullName: true, email: true, phone: true } } } },
          prescriptions: {
            include: { items: true },
            orderBy: { issuedAt: "desc" }
          },
          diagnoses: {
            include: { recordedBy: { select: recordedBySelect } },
            orderBy: { diagnosedAt: "desc" }
          },
          vitals: {
            include: { recordedBy: { select: recordedBySelect } },
            orderBy: { recordedAt: "desc" }
          },
          labReports: {
            include: { recordedBy: { select: recordedBySelect } },
            orderBy: { orderedAt: "desc" }
          },
          followUps: {
            include: { recordedBy: { select: recordedBySelect } },
            orderBy: { dueAt: "desc" }
          },
          invoices: {
            include: {
              items: true,
              payments: { include: { recordedBy: { select: recordedBySelect } }, orderBy: { paidAt: "desc" } }
            },
            orderBy: { createdAt: "desc" }
          },
          documents: {
            where: { deletedAt: null },
            select: {
              id: true,
              originalName: true,
              contentType: true,
              category: true,
              status: true,
              createdAt: true,
              uploadedBy: { select: recordedBySelect }
            },
            orderBy: { createdAt: "desc" }
          }
        }
      });
      if (!appointment) throw new ApiError(404, "APPOINTMENT_NOT_FOUND", "Appointment was not found");
      return appointment;
    });
  }

  updateAppointmentClinical(
    clinicId: string,
    userId: string,
    id: string,
    data: UpdateAppointmentClinicalDto
  ) {
    return withTenant(clinicId, async (tx) => {
      const appointment = await tx.appointment.findFirst({
        where: { id, clinicId },
        select: { id: true, patientId: true }
      });
      if (!appointment) throw new ApiError(404, "APPOINTMENT_NOT_FOUND", "Appointment was not found");
      const updated = await tx.appointment.update({
        where: { id },
        data: {
          ...(data.symptoms !== undefined ? { symptoms: data.symptoms || null } : {}),
          ...(data.diagnosisSummary !== undefined ? { diagnosisSummary: data.diagnosisSummary || null } : {}),
          ...(data.clinicalSummary !== undefined ? { clinicalSummary: data.clinicalSummary || null } : {}),
          ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
          ...(data.followUpAt !== undefined ? { followUpAt: data.followUpAt } : {})
        },
        include: appointmentInclude
      });
      if (data.diagnosisSummary?.trim()) {
        const existingDiagnosis = await tx.diagnosis.findFirst({
          where: { clinicId, appointmentId: id, diagnosisType: "PRIMARY" },
          select: { id: true }
        });
        if (existingDiagnosis) {
          await tx.diagnosis.update({
            where: { id: existingDiagnosis.id },
            data: { name: data.diagnosisSummary.trim(), status: "CONFIRMED" }
          });
        } else {
          await tx.diagnosis.create({
            data: {
              clinicId,
              patientId: appointment.patientId,
              appointmentId: id,
              recordedById: userId,
              name: data.diagnosisSummary.trim(),
              diagnosisType: "PRIMARY",
              status: "CONFIRMED"
            }
          });
        }
      }
      if (data.followUpAt !== undefined) {
        const existingFollowUp = await tx.followUp.findFirst({
          where: { clinicId, appointmentId: id, status: { in: ["PENDING", "SCHEDULED"] } },
          select: { id: true }
        });
        if (data.followUpAt) {
          if (existingFollowUp) {
            await tx.followUp.update({ where: { id: existingFollowUp.id }, data: { dueAt: data.followUpAt } });
          } else {
            await tx.followUp.create({
              data: {
                clinicId,
                patientId: appointment.patientId,
                appointmentId: id,
                recordedById: userId,
                dueAt: data.followUpAt,
                reason: "Post-consultation follow-up",
                priority: "NORMAL"
              }
            });
          }
        } else if (existingFollowUp) {
          await tx.followUp.update({ where: { id: existingFollowUp.id }, data: { status: "CANCELLED" } });
        }
      }
      return updated;
    });
  }

  createAppointmentInvoice(
    clinicId: string,
    userId: string,
    appointmentId: string,
    data: CreateAppointmentInvoiceDto
  ) {
    return withTenant(clinicId, async (tx) => {
      const appointment = await tx.appointment.findFirst({
        where: { id: appointmentId, clinicId },
        include: {
          patient: { select: { id: true, name: true, patientCode: true } },
          doctor: { include: { user: { select: { fullName: true } } } }
        }
      });
      if (!appointment) throw new ApiError(404, "APPOINTMENT_NOT_FOUND", "Appointment was not found");
      const existing = await tx.invoice.findFirst({
        where: { clinicId, appointmentId, status: { not: "VOID" } },
        select: { id: true, invoiceNumber: true }
      });
      if (existing) {
        throw new ApiError(409, "APPOINTMENT_ALREADY_INVOICED", `Invoice ${existing.invoiceNumber} already exists for this appointment`);
      }
      const items = [
        ...(data.consultationFee > 0 ? [{
          description: `Consultation - Dr. ${appointment.doctor.user.fullName}`,
          code: "CONSULTATION",
          quantity: 1,
          unitPrice: data.consultationFee,
          taxRate: data.taxRate
        }] : []),
        ...data.additionalItems
      ];
      const subtotal = items.reduce(
        (sum, item) => sum.add(new Prisma.Decimal(item.quantity).mul(item.unitPrice)),
        new Prisma.Decimal(0)
      );
      const tax = items.reduce(
        (sum, item) => sum.add(new Prisma.Decimal(item.quantity).mul(item.unitPrice).mul(item.taxRate).div(100)),
        new Prisma.Decimal(0)
      );
      const totalBeforeDiscount = subtotal.add(tax);
      const discount = new Prisma.Decimal(data.discount);
      if (discount.greaterThan(totalBeforeDiscount)) {
        throw new ApiError(422, "INVALID_DISCOUNT", "Discount cannot exceed the invoice subtotal and tax");
      }
      const total = totalBeforeDiscount.sub(discount);
      const paid = new Prisma.Decimal(data.payment?.amount ?? 0);
      if (paid.greaterThan(total)) throw new ApiError(422, "OVERPAYMENT", "Payment cannot exceed the invoice total");
      const status = paid.greaterThanOrEqualTo(total) ? "PAID" : paid.greaterThan(0) ? "PARTIALLY_PAID" : "ISSUED";
      const invoice = await tx.invoice.create({
        data: {
          clinicId,
          patientId: appointment.patientId,
          appointmentId,
          doctorMembershipId: appointment.doctorMembershipId,
          patientName: appointment.patient.name,
          patientRef: appointment.patient.patientCode,
          invoiceNumber: referenceNumber("INV"),
          subtotal,
          tax,
          discount,
          total,
          paid,
          status,
          paymentMethod: data.payment?.method ?? "CREDIT",
          issuedAt: new Date(),
          ...(data.dueAt ? { dueAt: data.dueAt } : {}),
          ...(data.notes ? { notes: data.notes } : {}),
          items: {
            create: items.map((item) => ({
              itemType: "SERVICE",
              description: item.description,
              ...(item.code ? { code: item.code } : {}),
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRate: item.taxRate
            }))
          }
        }
      });
      if (data.payment) {
        await tx.payment.create({
          data: {
            clinicId,
            patientId: appointment.patientId,
            appointmentId,
            invoiceId: invoice.id,
            recordedById: userId,
            receiptNumber: referenceNumber("RCT"),
            amount: data.payment.amount,
            method: data.payment.method,
            ...(data.payment.transactionReference ? { transactionReference: data.payment.transactionReference } : {})
          }
        });
      }
      return tx.invoice.findUniqueOrThrow({
        where: { id: invoice.id },
        include: {
          patient: true,
          doctor: { include: { user: { select: { id: true, fullName: true } } } },
          items: true,
          payments: { include: { recordedBy: { select: recordedBySelect } } }
        }
      });
    }, { isolationLevel: "Serializable" });
  }

  getDoctorProfile(clinicId: string, doctorMembershipId: string) {
    return withTenant(clinicId, async (tx) => {
      const doctor = await tx.userClinic.findFirst({
        where: {
          id: doctorMembershipId,
          clinicId,
          isActive: true,
          role: { in: ["DOCTOR", "CLINIC_OWNER"] },
          user: { isActive: true }
        },
        include: {
          user: { select: { id: true, fullName: true, email: true, phone: true, avatarPath: true } },
          availability: { orderBy: [{ dayOfWeek: "asc" }, { startMinutes: "asc" }] },
          timeOff: { where: { endsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" }, take: 30 }
        }
      });
      if (!doctor) throw new ApiError(404, "DOCTOR_NOT_FOUND", "Doctor was not found");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today.getTime() + 86_400_000);
      const [todayAppointments, upcomingAppointments, consultationHistory, patientVisits, revenue] = await Promise.all([
        tx.appointment.findMany({
          where: {
            clinicId,
            doctorMembershipId,
            startsAt: { gte: today, lt: tomorrow },
            status: { notIn: ["CANCELLED", "NO_SHOW"] }
          },
          include: { patient: true },
          orderBy: { startsAt: "asc" }
        }),
        tx.appointment.findMany({
          where: {
            clinicId,
            doctorMembershipId,
            startsAt: { gte: tomorrow },
            status: { notIn: ["CANCELLED", "NO_SHOW"] }
          },
          include: { patient: true },
          orderBy: { startsAt: "asc" },
          take: 30
        }),
        tx.appointment.findMany({
          where: { clinicId, doctorMembershipId, status: "COMPLETED" },
          include: { patient: true, diagnoses: true, prescriptions: { select: { id: true, prescriptionNumber: true } } },
          orderBy: { startsAt: "desc" },
          take: 50
        }),
        tx.appointment.findMany({
          where: { clinicId, doctorMembershipId, status: { notIn: ["CANCELLED", "NO_SHOW"] } },
          select: { patientId: true, startsAt: true, patient: true },
          orderBy: { startsAt: "desc" },
          distinct: ["patientId"],
          take: 200
        }),
        tx.invoice.aggregate({
          where: { clinicId, doctorMembershipId, status: { not: "VOID" } },
          _sum: { total: true, paid: true },
          _count: true
        })
      ]);
      return {
        doctor,
        metrics: {
          todayAppointments: todayAppointments.length,
          upcomingAppointments: upcomingAppointments.length,
          patients: patientVisits.length,
          completedConsultations: consultationHistory.length,
          revenueGenerated: Number(revenue._sum.total ?? 0),
          revenueCollected: Number(revenue._sum.paid ?? 0),
          invoices: revenue._count
        },
        todayAppointments,
        upcomingAppointments,
        patients: patientVisits.map(({ patient, startsAt }) => ({ ...patient, lastConsultedAt: startsAt })),
        consultationHistory
      };
    });
  }

  updateDoctorAvailability(
    clinicId: string,
    doctorMembershipId: string,
    data: UpdateDoctorAvailabilityDto
  ) {
    return withTenant(clinicId, async (tx) => {
      const doctor = await tx.userClinic.findFirst({
        where: { id: doctorMembershipId, clinicId, isActive: true, role: { in: ["DOCTOR", "CLINIC_OWNER"] } },
        select: { id: true }
      });
      if (!doctor) throw new ApiError(404, "DOCTOR_NOT_FOUND", "Doctor was not found");
      for (const day of new Set(data.slots.map((slot) => slot.dayOfWeek))) {
        const slots = data.slots
          .filter((slot) => slot.dayOfWeek === day && slot.isActive)
          .sort((left, right) => left.startMinutes - right.startMinutes);
        if (slots.some((slot, index) => index > 0 && slot.startMinutes < slots[index - 1]!.endMinutes)) {
          throw new ApiError(422, "OVERLAPPING_AVAILABILITY", "Doctor availability slots cannot overlap");
        }
      }
      await tx.doctorAvailability.deleteMany({ where: { clinicId, doctorMembershipId } });
      if (data.slots.length) {
        await tx.doctorAvailability.createMany({
          data: data.slots.map((slot) => ({ clinicId, doctorMembershipId, ...slot }))
        });
      }
      return tx.doctorAvailability.findMany({
        where: { clinicId, doctorMembershipId },
        orderBy: [{ dayOfWeek: "asc" }, { startMinutes: "asc" }]
      });
    });
  }

  createDoctorTimeOff(
    clinicId: string,
    doctorMembershipId: string,
    data: CreateDoctorTimeOffDto
  ) {
    return withTenant(clinicId, async (tx) => {
      const [doctor, conflict] = await Promise.all([
        tx.userClinic.findFirst({
          where: { id: doctorMembershipId, clinicId, isActive: true, role: { in: ["DOCTOR", "CLINIC_OWNER"] } },
          select: { id: true }
        }),
        tx.appointment.findFirst({
          where: {
            clinicId,
            doctorMembershipId,
            status: { notIn: ["CANCELLED", "NO_SHOW"] },
            startsAt: { lt: data.endsAt },
            endsAt: { gt: data.startsAt }
          },
          select: { id: true, startsAt: true }
        })
      ]);
      if (!doctor) throw new ApiError(404, "DOCTOR_NOT_FOUND", "Doctor was not found");
      if (conflict) {
        throw new ApiError(409, "TIME_OFF_CONFLICT", "Doctor has an appointment during the requested time off");
      }
      return tx.doctorTimeOff.create({
        data: {
          clinicId,
          doctorMembershipId,
          startsAt: data.startsAt,
          endsAt: data.endsAt,
          ...(data.reason ? { reason: data.reason } : {})
        }
      });
    });
  }
}
