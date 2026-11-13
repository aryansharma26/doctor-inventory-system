import type { z } from "zod";
import type {
  appointmentListSchema,
  createAllergySchema,
  createAppointmentInvoiceSchema,
  createAppointmentSchema,
  createDiagnosisSchema,
  createDoctorTimeOffSchema,
  createFollowUpSchema,
  createInsuranceSchema,
  createLabReportSchema,
  createMedicalHistorySchema,
  createPatientNoteSchema,
  createPaymentSchema,
  createPrescriptionSchema,
  createVaccinationSchema,
  createVitalSchema,
  prescriptionListSchema,
  updateAppointmentClinicalSchema,
  updateAppointmentStatusSchema,
  updateDoctorAvailabilitySchema,
  updateFollowUpStatusSchema,
  updatePatientProfileSchema,
  updatePrescriptionStatusSchema
} from "./practice.validator.js";

export type AppointmentFilters = z.infer<typeof appointmentListSchema>["query"];
export type CreateAppointmentDto = z.infer<typeof createAppointmentSchema>["body"];
export type UpdateAppointmentStatusDto = z.infer<typeof updateAppointmentStatusSchema>["body"];
export type CreatePatientNoteDto = z.infer<typeof createPatientNoteSchema>["body"];
export type PrescriptionFilters = z.infer<typeof prescriptionListSchema>["query"];
export type CreatePrescriptionDto = z.infer<typeof createPrescriptionSchema>["body"];
export type UpdatePrescriptionStatusDto = z.infer<typeof updatePrescriptionStatusSchema>["body"];
export type UpdatePatientProfileDto = z.infer<typeof updatePatientProfileSchema>["body"];
export type CreateMedicalHistoryDto = z.infer<typeof createMedicalHistorySchema>["body"];
export type CreateAllergyDto = z.infer<typeof createAllergySchema>["body"];
export type CreateVitalDto = z.infer<typeof createVitalSchema>["body"];
export type CreateDiagnosisDto = z.infer<typeof createDiagnosisSchema>["body"];
export type CreateLabReportDto = z.infer<typeof createLabReportSchema>["body"];
export type CreateVaccinationDto = z.infer<typeof createVaccinationSchema>["body"];
export type CreateInsuranceDto = z.infer<typeof createInsuranceSchema>["body"];
export type CreateFollowUpDto = z.infer<typeof createFollowUpSchema>["body"];
export type UpdateFollowUpStatusDto = z.infer<typeof updateFollowUpStatusSchema>["body"];
export type CreatePaymentDto = z.infer<typeof createPaymentSchema>["body"];
export type UpdateAppointmentClinicalDto = z.infer<typeof updateAppointmentClinicalSchema>["body"];
export type CreateAppointmentInvoiceDto = z.infer<typeof createAppointmentInvoiceSchema>["body"];
export type UpdateDoctorAvailabilityDto = z.infer<typeof updateDoctorAvailabilitySchema>["body"];
export type CreateDoctorTimeOffDto = z.infer<typeof createDoctorTimeOffSchema>["body"];
