import { z } from "zod";

const empty = z.object({});
const uuidParams = z.object({ id: z.string().uuid() });
const patientParams = z.object({ patientId: z.string().uuid() });
const patientEntryParams = z.object({ patientId: z.string().uuid(), id: z.string().uuid() });
const doctorParams = z.object({ doctorMembershipId: z.string().uuid() });
const optionalText = (max: number) => z.string().trim().max(max).optional();
const money = z.coerce.number().min(0).max(99_999_999_999.99);
const appointmentStatuses = [
  "BOOKED", "CONFIRMED", "CHECKED_IN", "IN_CONSULTATION",
  "COMPLETED", "CANCELLED", "NO_SHOW"
] as const;

export const appointmentListSchema = z.object({
  body: empty,
  params: empty,
  query: z.object({
    from: z.coerce.date(),
    to: z.coerce.date(),
    status: z.enum(appointmentStatuses).optional(),
    doctorMembershipId: z.string().uuid().optional(),
    patientId: z.string().uuid().optional(),
    search: z.string().trim().max(120).optional()
  }).refine(({ from, to }) => to > from, { message: "to must be after from", path: ["to"] })
});

export const queueListSchema = z.object({
  body: empty,
  params: empty,
  query: z.object({ date: z.coerce.date().optional() })
});

export const createAppointmentSchema = z.object({
  body: z.object({
    patientId: z.string().uuid(),
    doctorMembershipId: z.string().uuid(),
    type: z.enum(["CONSULTATION", "FOLLOW_UP", "PROCEDURE", "VACCINATION", "OTHER"]).default("CONSULTATION"),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    reason: z.string().trim().max(300).optional(),
    symptoms: z.string().trim().max(5000).optional(),
    notes: z.string().trim().max(2000).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#2563eb"),
    reminderAt: z.coerce.date().optional()
  }).refine(({ startsAt, endsAt }) => endsAt > startsAt, {
    message: "Appointment end time must be after its start time",
    path: ["endsAt"]
  }),
  query: empty,
  params: empty
});

export const updateAppointmentStatusSchema = z.object({
  body: z.object({
    status: z.enum(appointmentStatuses),
    notes: z.string().trim().max(2000).optional()
  }),
  query: empty,
  params: uuidParams
});

export const patientRecordSchema = z.object({
  body: empty,
  query: empty,
  params: patientParams
});

export const createPatientNoteSchema = z.object({
  body: z.object({
    noteType: z.enum(["CONSULTATION", "PROGRESS", "VITALS", "LAB_RESULT", "MEDICAL_HISTORY", "OTHER"]),
    title: z.string().trim().min(2).max(160),
    summary: z.string().trim().min(2).max(5000),
    details: z.record(z.unknown()).default({}),
    recordedAt: z.coerce.date().optional()
  }),
  query: empty,
  params: patientParams
});

export const updatePatientProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(160).optional(),
    phone: optionalText(30),
    email: z.string().email().max(254).optional().or(z.literal("")),
    dateOfBirth: z.coerce.date().max(new Date()).nullable().optional(),
    gender: optionalText(30),
    bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).nullable().optional(),
    maritalStatus: optionalText(30),
    occupation: optionalText(120),
    preferredLanguage: optionalText(60),
    address: z.record(z.unknown()).nullable().optional(),
    emergencyContact: z.object({
      name: z.string().trim().min(2).max(160),
      relationship: z.string().trim().max(60).optional(),
      phone: z.string().trim().min(5).max(30)
    }).nullable().optional(),
    communicationPreferences: z.object({
      sms: z.boolean().default(true),
      email: z.boolean().default(false),
      whatsapp: z.boolean().default(false)
    }).optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
    consentAt: z.coerce.date().nullable().optional(),
    notes: optionalText(2000)
  }).refine((body) => Object.keys(body).length > 0, "At least one profile field is required"),
  query: empty,
  params: patientParams
});

export const createMedicalHistorySchema = z.object({
  body: z.object({
    appointmentId: z.string().uuid().optional(),
    condition: z.string().trim().min(2).max(200),
    category: optionalText(80),
    status: z.enum(["ACTIVE", "RESOLVED", "INACTIVE"]).default("ACTIVE"),
    diagnosedOn: z.coerce.date().optional(),
    resolvedOn: z.coerce.date().optional(),
    isChronic: z.boolean().default(false),
    treatment: optionalText(2000),
    notes: optionalText(2000)
  }).refine(({ diagnosedOn, resolvedOn }) => !diagnosedOn || !resolvedOn || resolvedOn >= diagnosedOn, {
    message: "Resolved date cannot be before diagnosed date",
    path: ["resolvedOn"]
  }),
  query: empty,
  params: patientParams
});

export const createAllergySchema = z.object({
  body: z.object({
    appointmentId: z.string().uuid().optional(),
    allergen: z.string().trim().min(2).max(160),
    allergyType: z.enum(["DRUG", "FOOD", "ENVIRONMENTAL", "LATEX", "INSECT", "OTHER"]),
    severity: z.enum(["MILD", "MODERATE", "SEVERE", "CRITICAL"]).default("MODERATE"),
    status: z.enum(["ACTIVE", "RESOLVED", "INACTIVE"]).default("ACTIVE"),
    reaction: optionalText(500),
    onsetDate: z.coerce.date().optional(),
    notes: optionalText(2000)
  }),
  query: empty,
  params: patientParams
});

export const createVitalSchema = z.object({
  body: z.object({
    appointmentId: z.string().uuid().optional(),
    recordedAt: z.coerce.date().optional(),
    systolicBp: z.coerce.number().int().min(40).max(300).optional(),
    diastolicBp: z.coerce.number().int().min(20).max(200).optional(),
    heartRate: z.coerce.number().int().min(20).max(300).optional(),
    respiratoryRate: z.coerce.number().int().min(4).max(100).optional(),
    temperatureCelsius: z.coerce.number().min(25).max(50).optional(),
    oxygenSaturation: z.coerce.number().min(0).max(100).optional(),
    heightCm: z.coerce.number().positive().max(300).optional(),
    weightKg: z.coerce.number().positive().max(700).optional(),
    bloodGlucoseMgDl: z.coerce.number().min(0).max(2000).optional(),
    painScore: z.coerce.number().int().min(0).max(10).optional(),
    notes: optionalText(1000)
  }).refine((body) => [
    body.systolicBp,
    body.diastolicBp,
    body.heartRate,
    body.respiratoryRate,
    body.temperatureCelsius,
    body.oxygenSaturation,
    body.heightCm,
    body.weightKg,
    body.bloodGlucoseMgDl,
    body.painScore
  ].some((value) => value !== undefined), {
    message: "Record at least one vital measurement"
  }),
  query: empty,
  params: patientParams
});

export const createDiagnosisSchema = z.object({
  body: z.object({
    appointmentId: z.string().uuid().optional(),
    code: optionalText(40),
    name: z.string().trim().min(2).max(240),
    diagnosisType: z.enum(["PRIMARY", "SECONDARY", "DIFFERENTIAL"]).default("PRIMARY"),
    status: z.enum(["PROVISIONAL", "CONFIRMED", "RESOLVED", "RULED_OUT"]).default("CONFIRMED"),
    diagnosedAt: z.coerce.date().optional(),
    resolvedAt: z.coerce.date().optional(),
    notes: optionalText(2000)
  }).refine(({ diagnosedAt, resolvedAt }) => !diagnosedAt || !resolvedAt || resolvedAt >= diagnosedAt, {
    message: "Resolved date cannot be before diagnosis date",
    path: ["resolvedAt"]
  }),
  query: empty,
  params: patientParams
});

export const createLabReportSchema = z.object({
  body: z.object({
    appointmentId: z.string().uuid().optional(),
    reportNumber: optionalText(80),
    testName: z.string().trim().min(2).max(200),
    labName: optionalText(160),
    status: z.enum(["ORDERED", "SAMPLE_COLLECTED", "PROCESSING", "FINAL", "AMENDED", "CANCELLED"]).default("ORDERED"),
    orderedAt: z.coerce.date().optional(),
    collectedAt: z.coerce.date().optional(),
    reportedAt: z.coerce.date().optional(),
    results: z.record(z.unknown()).default({}),
    interpretation: optionalText(5000),
    abnormal: z.boolean().default(false),
    notes: optionalText(2000)
  }),
  query: empty,
  params: patientParams
});

export const createVaccinationSchema = z.object({
  body: z.object({
    appointmentId: z.string().uuid().optional(),
    vaccineName: z.string().trim().min(2).max(200),
    disease: optionalText(160),
    doseNumber: optionalText(40),
    lotNumber: optionalText(80),
    manufacturer: optionalText(160),
    administeredAt: z.coerce.date(),
    route: optionalText(60),
    site: optionalText(80),
    nextDoseAt: z.coerce.date().optional(),
    adverseReaction: optionalText(1000),
    notes: optionalText(2000)
  }).refine(({ administeredAt, nextDoseAt }) => !nextDoseAt || nextDoseAt > administeredAt, {
    message: "Next dose must be after the administered date",
    path: ["nextDoseAt"]
  }),
  query: empty,
  params: patientParams
});

export const createInsuranceSchema = z.object({
  body: z.object({
    providerName: z.string().trim().min(2).max(160),
    planName: optionalText(160),
    policyNumber: z.string().trim().min(2).max(100),
    memberId: optionalText(100),
    groupNumber: optionalText(100),
    policyHolder: z.string().trim().min(2).max(160),
    relationship: optionalText(60),
    status: z.enum(["ACTIVE", "EXPIRED", "SUSPENDED", "CANCELLED"]).default("ACTIVE"),
    validFrom: z.coerce.date().optional(),
    validUntil: z.coerce.date().optional(),
    coverageAmount: money.optional(),
    copayAmount: money.optional(),
    metadata: z.record(z.unknown()).default({}),
    notes: optionalText(2000)
  }).refine(({ validFrom, validUntil }) => !validFrom || !validUntil || validUntil >= validFrom, {
    message: "Policy end date cannot be before its start date",
    path: ["validUntil"]
  }),
  query: empty,
  params: patientParams
});

export const createFollowUpSchema = z.object({
  body: z.object({
    appointmentId: z.string().uuid().optional(),
    dueAt: z.coerce.date(),
    reason: z.string().trim().min(2).max(500),
    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
    channel: z.enum(["PHONE", "SMS", "WHATSAPP", "EMAIL", "IN_PERSON"]).optional(),
    assignedToId: z.string().uuid().optional(),
    notes: optionalText(2000)
  }),
  query: empty,
  params: patientParams
});

export const updateFollowUpStatusSchema = z.object({
  body: z.object({
    status: z.enum(["PENDING", "SCHEDULED", "COMPLETED", "MISSED", "CANCELLED"]),
    outcome: optionalText(2000),
    notes: optionalText(2000)
  }),
  query: empty,
  params: patientEntryParams
});

export const createPaymentSchema = z.object({
  body: z.object({
    invoiceId: z.string().uuid(),
    amount: money.refine((value) => value > 0, "Payment amount must be greater than zero"),
    method: z.enum(["CASH", "CARD", "UPI", "BANK_TRANSFER", "CREDIT", "SPLIT"]),
    transactionReference: optionalText(160),
    notes: optionalText(1000),
    paidAt: z.coerce.date().optional()
  }),
  query: empty,
  params: patientParams
});

export const appointmentEncounterSchema = z.object({
  body: empty,
  query: empty,
  params: uuidParams
});

export const updateAppointmentClinicalSchema = z.object({
  body: z.object({
    symptoms: optionalText(5000),
    diagnosisSummary: optionalText(5000),
    clinicalSummary: optionalText(5000),
    notes: optionalText(2000),
    followUpAt: z.coerce.date().nullable().optional()
  }).refine((body) => Object.keys(body).length > 0, "At least one clinical field is required"),
  query: empty,
  params: uuidParams
});

export const createAppointmentInvoiceSchema = z.object({
  body: z.object({
    consultationFee: money.default(0),
    discount: money.default(0),
    taxRate: z.coerce.number().min(0).max(100).default(0),
    dueAt: z.coerce.date().optional(),
    notes: optionalText(1000),
    additionalItems: z.array(z.object({
      description: z.string().trim().min(2).max(300),
      code: optionalText(40),
      quantity: z.coerce.number().positive().max(10_000),
      unitPrice: money,
      taxRate: z.coerce.number().min(0).max(100).default(0)
    })).max(30).default([]),
    payment: z.object({
      amount: money.refine((value) => value > 0),
      method: z.enum(["CASH", "CARD", "UPI", "BANK_TRANSFER", "CREDIT", "SPLIT"]),
      transactionReference: optionalText(160)
    }).optional()
  }).refine(({ consultationFee, additionalItems }) =>
    consultationFee > 0 || additionalItems.some((item) => item.quantity * item.unitPrice > 0), {
    message: "Add a consultation fee or at least one billable item"
  }),
  query: empty,
  params: uuidParams
});

export const doctorProfileSchema = z.object({
  body: empty,
  query: empty,
  params: doctorParams
});

export const updateDoctorAvailabilitySchema = z.object({
  body: z.object({
    slots: z.array(z.object({
      dayOfWeek: z.coerce.number().int().min(0).max(6),
      startMinutes: z.coerce.number().int().min(0).max(1439),
      endMinutes: z.coerce.number().int().min(1).max(1440),
      slotDurationMinutes: z.coerce.number().int().min(5).max(240).default(30),
      isActive: z.boolean().default(true)
    }).refine(({ startMinutes, endMinutes }) => endMinutes > startMinutes, {
      message: "Availability end time must be after start time",
      path: ["endMinutes"]
    })).max(50)
  }),
  query: empty,
  params: doctorParams
});

export const createDoctorTimeOffSchema = z.object({
  body: z.object({
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    reason: optionalText(300)
  }).refine(({ startsAt, endsAt }) => endsAt > startsAt, {
    message: "Time off end must be after start",
    path: ["endsAt"]
  }),
  query: empty,
  params: doctorParams
});

export const prescriptionListSchema = z.object({
  body: empty,
  params: empty,
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(120).optional(),
    status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
    patientId: z.string().uuid().optional()
  })
});

export const createPrescriptionSchema = z.object({
  body: z.object({
    patientId: z.string().uuid(),
    doctorMembershipId: z.string().uuid(),
    appointmentId: z.string().uuid().optional(),
    diagnosis: z.string().trim().max(1000).optional(),
    notes: z.string().trim().max(2000).optional(),
    expiresAt: z.coerce.date().optional(),
    items: z.array(z.object({
      medicineId: z.string().uuid().optional(),
      medicineName: z.string().trim().min(2).max(200),
      dosage: z.string().trim().min(1).max(100),
      frequency: z.string().trim().min(1).max(100),
      durationDays: z.coerce.number().int().positive().max(365).optional(),
      quantity: z.coerce.number().positive().max(999_999).optional(),
      instructions: z.string().trim().max(500).optional()
    })).min(1).max(30)
  }),
  query: empty,
  params: empty
});

export const updatePrescriptionStatusSchema = z.object({
  body: z.object({ status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]) }),
  query: empty,
  params: uuidParams
});
