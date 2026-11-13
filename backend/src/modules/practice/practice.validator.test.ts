import { describe, expect, it } from "vitest";
import {
  createAppointmentInvoiceSchema,
  createAppointmentSchema,
  createInsuranceSchema,
  createPrescriptionSchema,
  createVitalSchema,
  updateDoctorAvailabilitySchema
} from "./practice.validator.js";

const patientId = "a8b62f24-5ad0-4be8-bafd-93057632d240";
const doctorMembershipId = "9890c6b9-a7ac-4604-85cf-0ee0ca305c16";

describe("practice request validation", () => {
  it("rejects appointments whose end time is not after the start time", () => {
    const time = new Date("2026-07-26T09:00:00.000Z");
    const result = createAppointmentSchema.safeParse({
      body: { patientId, doctorMembershipId, startsAt: time, endsAt: time },
      query: {},
      params: {}
    });
    expect(result.success).toBe(false);
  });

  it("accepts a structured non-dental prescription", () => {
    const result = createPrescriptionSchema.safeParse({
      body: {
        patientId,
        doctorMembershipId,
        diagnosis: "Upper respiratory infection",
        items: [{
          medicineName: "Paracetamol 500 mg",
          dosage: "1 tablet",
          frequency: "Twice daily after meals",
          durationDays: 3,
          quantity: 6
        }]
      },
      query: {},
      params: {}
    });
    expect(result.success).toBe(true);
  });

  it("requires at least one real vital measurement", () => {
    const result = createVitalSchema.safeParse({
      body: { notes: "Patient appeared well" },
      query: {},
      params: { patientId }
    });
    expect(result.success).toBe(false);
  });

  it("rejects an insurance policy whose end precedes its start", () => {
    const result = createInsuranceSchema.safeParse({
      body: {
        providerName: "Care Health",
        policyNumber: "POL-101",
        policyHolder: "Patient",
        validFrom: "2026-08-01",
        validUntil: "2026-07-01"
      },
      query: {},
      params: { patientId }
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid doctor availability windows", () => {
    const result = updateDoctorAvailabilitySchema.safeParse({
      body: {
        slots: [{ dayOfWeek: 1, startMinutes: 1020, endMinutes: 540, slotDurationMinutes: 30 }]
      },
      query: {},
      params: { doctorMembershipId }
    });
    expect(result.success).toBe(false);
  });

  it("accepts an appointment-linked consultation invoice", () => {
    const result = createAppointmentInvoiceSchema.safeParse({
      body: {
        consultationFee: 800,
        discount: 50,
        taxRate: 0,
        additionalItems: [],
        payment: { amount: 750, method: "UPI" }
      },
      query: {},
      params: { id: patientId }
    });
    expect(result.success).toBe(true);
  });
});
