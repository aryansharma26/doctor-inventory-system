import type { AppointmentStatus, PrescriptionStatus } from "@prisma/client";
import { AuditService } from "../audit/audit.service.js";
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
import { PracticeRepository } from "./practice.repository.js";

type Actor = { clinicId: string; userId: string; requestId: string };

export class PracticeService {
  constructor(
    private readonly repository = new PracticeRepository(),
    private readonly audit = new AuditService()
  ) {}

  listDoctors(clinicId: string) {
    return this.repository.listDoctors(clinicId);
  }

  listAppointments(clinicId: string, filters: AppointmentFilters) {
    return this.repository.listAppointments(clinicId, filters);
  }

  async createAppointment(actor: Actor, data: CreateAppointmentDto) {
    const result = await this.repository.createAppointment(actor.clinicId, actor.userId, data);
    await this.record(actor, "appointment.created", "Appointment", result.id);
    return result;
  }

  async updateAppointmentStatus(actor: Actor, id: string, status: AppointmentStatus, notes?: string) {
    const result = await this.repository.updateAppointmentStatus(actor.clinicId, id, status, notes);
    await this.record(actor, `appointment.${status.toLowerCase()}`, "Appointment", id);
    return result;
  }

  async getPatientRecord(clinicId: string, patientId: string) {
    const record = await this.repository.getPatientRecord(clinicId, patientId);
    const doctors = new Map<string, {
      id: string;
      role: string;
      user: { id: string; fullName: string; email: string };
      visits: number;
      lastConsultedAt: Date;
    }>();
    for (const appointment of record.appointments) {
      if (["CANCELLED", "NO_SHOW"].includes(appointment.status)) continue;
      const current = doctors.get(appointment.doctor.id);
      if (current) {
        current.visits += 1;
        if (appointment.startsAt > current.lastConsultedAt) current.lastConsultedAt = appointment.startsAt;
      } else {
        doctors.set(appointment.doctor.id, {
          id: appointment.doctor.id,
          role: appointment.doctor.role,
          user: appointment.doctor.user,
          visits: 1,
          lastConsultedAt: appointment.startsAt
        });
      }
    }
    type TimelineEvent = {
      id: string;
      type: string;
      title: string;
      description?: string;
      occurredAt: Date;
      status?: string;
      appointmentId?: string;
    };
    const timeline: TimelineEvent[] = [
      ...record.appointments.map((item) => ({
        id: item.id,
        type: "APPOINTMENT",
        title: `${item.type.replaceAll("_", " ")} with Dr. ${item.doctor.user.fullName}`,
        ...(item.reason ? { description: item.reason } : {}),
        occurredAt: item.startsAt,
        status: item.status,
        appointmentId: item.id
      })),
      ...record.clinicalNotes.map((item) => ({
        id: item.id,
        type: "NOTE",
        title: item.title,
        description: item.summary,
        occurredAt: item.recordedAt
      })),
      ...record.prescriptions.map((item) => ({
        id: item.id,
        type: "PRESCRIPTION",
        title: `Prescription ${item.prescriptionNumber}`,
        ...(item.diagnosis ? { description: item.diagnosis } : {}),
        occurredAt: item.issuedAt,
        status: item.status,
        ...(item.appointmentId ? { appointmentId: item.appointmentId } : {})
      })),
      ...record.invoices.map((item) => ({
        id: item.id,
        type: "INVOICE",
        title: `Invoice ${item.invoiceNumber}`,
        description: `Total ₹${item.total.toString()} · Paid ₹${item.paid.toString()}`,
        occurredAt: item.issuedAt ?? item.createdAt,
        status: item.status,
        ...(item.appointmentId ? { appointmentId: item.appointmentId } : {})
      })),
      ...record.payments.map((item) => ({
        id: item.id,
        type: "PAYMENT",
        title: `Payment ${item.receiptNumber}`,
        description: `₹${item.amount.toString()} via ${item.method.replaceAll("_", " ")}`,
        occurredAt: item.paidAt,
        status: item.status,
        ...(item.appointmentId ? { appointmentId: item.appointmentId } : {})
      })),
      ...record.medicalHistories.map((item) => ({
        id: item.id,
        type: "MEDICAL_HISTORY",
        title: item.condition,
        ...(item.treatment ? { description: item.treatment } : {}),
        occurredAt: item.diagnosedOn ?? item.createdAt,
        status: item.status,
        ...(item.appointmentId ? { appointmentId: item.appointmentId } : {})
      })),
      ...record.allergies.map((item) => ({
        id: item.id,
        type: "ALLERGY",
        title: `Allergy: ${item.allergen}`,
        ...(item.reaction ? { description: item.reaction } : {}),
        occurredAt: item.onsetDate ?? item.createdAt,
        status: `${item.severity} · ${item.status}`,
        ...(item.appointmentId ? { appointmentId: item.appointmentId } : {})
      })),
      ...record.vitals.map((item) => ({
        id: item.id,
        type: "VITALS",
        title: "Vitals recorded",
        description: [
          item.systolicBp && item.diastolicBp ? `BP ${item.systolicBp}/${item.diastolicBp}` : null,
          item.heartRate ? `Pulse ${item.heartRate}` : null,
          item.temperatureCelsius ? `${item.temperatureCelsius.toString()}°C` : null
        ].filter(Boolean).join(" · "),
        occurredAt: item.recordedAt,
        ...(item.appointmentId ? { appointmentId: item.appointmentId } : {})
      })),
      ...record.diagnoses.map((item) => ({
        id: item.id,
        type: "DIAGNOSIS",
        title: item.name,
        ...(item.notes ? { description: item.notes } : {}),
        occurredAt: item.diagnosedAt,
        status: item.status,
        ...(item.appointmentId ? { appointmentId: item.appointmentId } : {})
      })),
      ...record.labReports.map((item) => ({
        id: item.id,
        type: "LAB_REPORT",
        title: item.testName,
        ...(item.interpretation ? { description: item.interpretation } : {}),
        occurredAt: item.reportedAt ?? item.orderedAt,
        status: item.abnormal ? `${item.status} · ABNORMAL` : item.status,
        ...(item.appointmentId ? { appointmentId: item.appointmentId } : {})
      })),
      ...record.vaccinations.map((item) => ({
        id: item.id,
        type: "VACCINATION",
        title: item.vaccineName,
        ...(item.doseNumber ? { description: `Dose ${item.doseNumber}` } : {}),
        occurredAt: item.administeredAt,
        ...(item.appointmentId ? { appointmentId: item.appointmentId } : {})
      })),
      ...record.insurancePolicies.map((item) => ({
        id: item.id,
        type: "INSURANCE",
        title: `${item.providerName} · ${item.policyNumber}`,
        ...(item.planName ? { description: item.planName } : {}),
        occurredAt: item.createdAt,
        status: item.status
      })),
      ...record.followUps.map((item) => ({
        id: item.id,
        type: "FOLLOW_UP",
        title: item.reason,
        ...(item.outcome ? { description: item.outcome } : {}),
        occurredAt: item.dueAt,
        status: item.status,
        ...(item.appointmentId ? { appointmentId: item.appointmentId } : {})
      })),
      ...record.documents.map((item) => ({
        id: item.id,
        type: "DOCUMENT",
        title: item.originalName,
        description: item.category.replaceAll("_", " "),
        occurredAt: item.createdAt,
        status: item.status,
        ...(item.appointmentId ? { appointmentId: item.appointmentId } : {})
      }))
    ].sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime()).slice(0, 300);
    return { ...record, doctorsConsulted: [...doctors.values()], timeline };
  }

  async createPatientNote(actor: Actor, patientId: string, data: CreatePatientNoteDto) {
    const result = await this.repository.createPatientNote(actor.clinicId, actor.userId, patientId, data);
    await this.record(actor, "patient_note.created", "PatientNote", result.id);
    return result;
  }

  async updatePatientProfile(actor: Actor, patientId: string, data: UpdatePatientProfileDto) {
    const result = await this.repository.updatePatientProfile(actor.clinicId, patientId, data);
    await this.record(actor, "patient.profile_updated", "Patient", patientId);
    return result;
  }

  async createMedicalHistory(actor: Actor, patientId: string, data: CreateMedicalHistoryDto) {
    const result = await this.repository.createMedicalHistory(actor.clinicId, actor.userId, patientId, data);
    await this.record(actor, "patient.medical_history_created", "MedicalHistory", result.id);
    return result;
  }

  async createAllergy(actor: Actor, patientId: string, data: CreateAllergyDto) {
    const result = await this.repository.createAllergy(actor.clinicId, actor.userId, patientId, data);
    await this.record(actor, "patient.allergy_created", "Allergy", result.id);
    return result;
  }

  async createVital(actor: Actor, patientId: string, data: CreateVitalDto) {
    const result = await this.repository.createVital(actor.clinicId, actor.userId, patientId, data);
    await this.record(actor, "patient.vital_created", "Vital", result.id);
    return result;
  }

  async createDiagnosis(actor: Actor, patientId: string, data: CreateDiagnosisDto) {
    const result = await this.repository.createDiagnosis(actor.clinicId, actor.userId, patientId, data);
    await this.record(actor, "patient.diagnosis_created", "Diagnosis", result.id);
    return result;
  }

  async createLabReport(actor: Actor, patientId: string, data: CreateLabReportDto) {
    const result = await this.repository.createLabReport(actor.clinicId, actor.userId, patientId, data);
    await this.record(actor, "patient.lab_report_created", "LabReport", result.id);
    return result;
  }

  async createVaccination(actor: Actor, patientId: string, data: CreateVaccinationDto) {
    const result = await this.repository.createVaccination(actor.clinicId, actor.userId, patientId, data);
    await this.record(actor, "patient.vaccination_created", "Vaccination", result.id);
    return result;
  }

  async createInsurance(actor: Actor, patientId: string, data: CreateInsuranceDto) {
    const result = await this.repository.createInsurance(actor.clinicId, patientId, data);
    await this.record(actor, "patient.insurance_created", "InsurancePolicy", result.id);
    return result;
  }

  async createFollowUp(actor: Actor, patientId: string, data: CreateFollowUpDto) {
    const result = await this.repository.createFollowUp(actor.clinicId, actor.userId, patientId, data);
    await this.record(actor, "patient.follow_up_created", "FollowUp", result.id);
    return result;
  }

  async updateFollowUpStatus(
    actor: Actor,
    patientId: string,
    id: string,
    data: UpdateFollowUpStatusDto
  ) {
    const result = await this.repository.updateFollowUpStatus(actor.clinicId, patientId, id, data);
    await this.record(actor, `patient.follow_up_${data.status.toLowerCase()}`, "FollowUp", id);
    return result;
  }

  async createPayment(actor: Actor, patientId: string, data: CreatePaymentDto) {
    const result = await this.repository.createPayment(actor.clinicId, actor.userId, patientId, data);
    await this.record(actor, "payment.received", "Payment", result.id);
    return result;
  }

  listPrescriptions(clinicId: string, filters: PrescriptionFilters) {
    return this.repository.listPrescriptions(clinicId, filters);
  }

  async createPrescription(actor: Actor, data: CreatePrescriptionDto) {
    const result = await this.repository.createPrescription(actor.clinicId, data);
    await this.record(actor, "prescription.issued", "Prescription", result.id);
    return result;
  }

  async updatePrescriptionStatus(actor: Actor, id: string, status: PrescriptionStatus) {
    const result = await this.repository.updatePrescriptionStatus(actor.clinicId, id, status);
    await this.record(actor, `prescription.${status.toLowerCase()}`, "Prescription", id);
    return result;
  }

  getAppointmentEncounter(clinicId: string, id: string) {
    return this.repository.getAppointmentEncounter(clinicId, id);
  }

  async updateAppointmentClinical(actor: Actor, id: string, data: UpdateAppointmentClinicalDto) {
    const result = await this.repository.updateAppointmentClinical(actor.clinicId, actor.userId, id, data);
    await this.record(actor, "appointment.clinical_updated", "Appointment", id);
    return result;
  }

  async createAppointmentInvoice(actor: Actor, appointmentId: string, data: CreateAppointmentInvoiceDto) {
    const result = await this.repository.createAppointmentInvoice(
      actor.clinicId,
      actor.userId,
      appointmentId,
      data
    );
    await this.record(actor, "appointment.invoice_created", "Invoice", result.id);
    return result;
  }

  getDoctorProfile(clinicId: string, doctorMembershipId: string) {
    return this.repository.getDoctorProfile(clinicId, doctorMembershipId);
  }

  async updateDoctorAvailability(
    actor: Actor,
    doctorMembershipId: string,
    data: UpdateDoctorAvailabilityDto
  ) {
    const result = await this.repository.updateDoctorAvailability(actor.clinicId, doctorMembershipId, data);
    await this.record(actor, "doctor.availability_updated", "UserClinic", doctorMembershipId);
    return result;
  }

  async createDoctorTimeOff(
    actor: Actor,
    doctorMembershipId: string,
    data: CreateDoctorTimeOffDto
  ) {
    const result = await this.repository.createDoctorTimeOff(actor.clinicId, doctorMembershipId, data);
    await this.record(actor, "doctor.time_off_created", "DoctorTimeOff", result.id);
    return result;
  }

  private record(actor: Actor, action: string, entityType: string, entityId: string) {
    return this.audit.record({
      clinicId: actor.clinicId,
      actorId: actor.userId,
      action,
      entityType,
      entityId,
      requestId: actor.requestId
    });
  }
}
