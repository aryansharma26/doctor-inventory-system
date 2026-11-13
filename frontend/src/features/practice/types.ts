export type AppointmentStatus =
  | "BOOKED"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_CONSULTATION"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type PatientOption = {
  id: string;
  patientCode: string;
  name: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  maritalStatus?: string;
  occupation?: string;
  preferredLanguage?: string;
  address?: Record<string, unknown>;
  emergencyContact?: { name: string; relationship?: string; phone: string };
  communicationPreferences?: {
    sms: boolean;
    email: boolean;
    whatsapp: boolean;
  };
  tags?: string[];
  consentAt?: string;
};

export type DoctorOption = {
  id: string;
  role: string;
  user: { id: string; fullName: string; email: string; phone?: string };
};

export type Appointment = {
  id: string;
  patientId: string;
  doctorMembershipId: string;
  type: string;
  status: AppointmentStatus;
  startsAt: string;
  endsAt: string;
  reason?: string;
  symptoms?: string;
  diagnosisSummary?: string;
  clinicalSummary?: string;
  notes?: string;
  followUpAt?: string;
  checkedInAt?: string;
  consultationStartedAt?: string;
  completedAt?: string;
  patient: PatientOption;
  doctor: DoctorOption;
};

export type PrescriptionItem = {
  id: string;
  medicineId?: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays?: number;
  quantity?: number;
  instructions?: string;
};

export type Prescription = {
  id: string;
  prescriptionNumber: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  diagnosis?: string;
  notes?: string;
  issuedAt: string;
  expiresAt?: string;
  patient: PatientOption;
  doctor: DoctorOption;
  items: PrescriptionItem[];
};

export type PatientNote = {
  id: string;
  noteType: string;
  title: string;
  summary: string;
  details: Record<string, unknown>;
  recordedAt: string;
  author: { id: string; fullName: string };
};

export type RecordAuthor = { id: string; fullName: string };

export type MedicalHistory = {
  id: string;
  appointmentId?: string;
  condition: string;
  category?: string;
  status: "ACTIVE" | "RESOLVED" | "INACTIVE";
  diagnosedOn?: string;
  resolvedOn?: string;
  isChronic: boolean;
  treatment?: string;
  notes?: string;
  createdAt: string;
  recordedBy: RecordAuthor;
};

export type Allergy = {
  id: string;
  appointmentId?: string;
  allergen: string;
  allergyType: string;
  severity: "MILD" | "MODERATE" | "SEVERE" | "CRITICAL";
  status: "ACTIVE" | "RESOLVED" | "INACTIVE";
  reaction?: string;
  onsetDate?: string;
  notes?: string;
  createdAt: string;
  recordedBy: RecordAuthor;
};

export type Vital = {
  id: string;
  appointmentId?: string;
  recordedAt: string;
  systolicBp?: number;
  diastolicBp?: number;
  heartRate?: number;
  respiratoryRate?: number;
  temperatureCelsius?: number;
  oxygenSaturation?: number;
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  bloodGlucoseMgDl?: number;
  painScore?: number;
  notes?: string;
  recordedBy: RecordAuthor;
};

export type Diagnosis = {
  id: string;
  appointmentId?: string;
  code?: string;
  name: string;
  diagnosisType: string;
  status: "PROVISIONAL" | "CONFIRMED" | "RESOLVED" | "RULED_OUT";
  diagnosedAt: string;
  resolvedAt?: string;
  notes?: string;
  recordedBy: RecordAuthor;
};

export type LabReport = {
  id: string;
  appointmentId?: string;
  reportNumber: string;
  testName: string;
  labName?: string;
  status: string;
  orderedAt: string;
  collectedAt?: string;
  reportedAt?: string;
  results: Record<string, unknown>;
  interpretation?: string;
  abnormal: boolean;
  notes?: string;
  recordedBy: RecordAuthor;
};

export type Vaccination = {
  id: string;
  appointmentId?: string;
  vaccineName: string;
  disease?: string;
  doseNumber?: string;
  lotNumber?: string;
  manufacturer?: string;
  administeredAt: string;
  route?: string;
  site?: string;
  nextDoseAt?: string;
  adverseReaction?: string;
  notes?: string;
  recordedBy: RecordAuthor;
};

export type InsurancePolicy = {
  id: string;
  providerName: string;
  planName?: string;
  policyNumber: string;
  memberId?: string;
  groupNumber?: string;
  policyHolder: string;
  relationship?: string;
  status: "ACTIVE" | "EXPIRED" | "SUSPENDED" | "CANCELLED";
  validFrom?: string;
  validUntil?: string;
  coverageAmount?: number;
  copayAmount?: number;
  notes?: string;
};

export type FollowUp = {
  id: string;
  appointmentId?: string;
  dueAt: string;
  status: "PENDING" | "SCHEDULED" | "COMPLETED" | "MISSED" | "CANCELLED";
  reason: string;
  priority: string;
  channel?: string;
  assignedToId?: string;
  outcome?: string;
  completedAt?: string;
  notes?: string;
  recordedBy: RecordAuthor;
};

export type PatientInvoice = {
  id: string;
  appointmentId?: string;
  invoiceNumber: string;
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  paymentMethod: string;
  issuedAt?: string;
  dueAt?: string;
  createdAt: string;
};

export type Payment = {
  id: string;
  appointmentId?: string;
  invoiceId: string;
  receiptNumber: string;
  amount: number;
  refundedAmount: number;
  method: string;
  status: string;
  transactionReference?: string;
  notes?: string;
  paidAt: string;
  recordedBy: RecordAuthor;
  invoice?: { id: string; invoiceNumber: string };
};

export type PatientDocument = {
  id: string;
  appointmentId?: string;
  originalName: string;
  contentType: string;
  category: string;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  uploadedBy: RecordAuthor;
};

export type TimelineEvent = {
  id: string;
  type: string;
  title: string;
  description?: string;
  occurredAt: string;
  status?: string;
  appointmentId?: string;
};

export type PatientRecord = PatientOption & {
  notes?: string;
  accountBalance: number;
  clinicalNotes: PatientNote[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  invoices: PatientInvoice[];
  payments: Payment[];
  medicalHistories: MedicalHistory[];
  allergies: Allergy[];
  vitals: Vital[];
  diagnoses: Diagnosis[];
  labReports: LabReport[];
  vaccinations: Vaccination[];
  insurancePolicies: InsurancePolicy[];
  followUps: FollowUp[];
  documents: PatientDocument[];
  doctorsConsulted: Array<
    DoctorOption & { visits: number; lastConsultedAt: string }
  >;
  timeline: TimelineEvent[];
};

export type MedicineOption = {
  id: string;
  medicine: {
    id: string;
    brandName: string;
    genericName: string;
    strength: string;
    sku: string;
  };
};

export type DoctorAvailability = {
  id: string;
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
  slotDurationMinutes: number;
  isActive: boolean;
};

export type DoctorProfile = {
  doctor: DoctorOption & {
    user: DoctorOption["user"] & { avatarPath?: string };
    availability: DoctorAvailability[];
    timeOff: Array<{
      id: string;
      startsAt: string;
      endsAt: string;
      reason?: string;
    }>;
  };
  metrics: {
    todayAppointments: number;
    upcomingAppointments: number;
    patients: number;
    completedConsultations: number;
    revenueGenerated: number;
    revenueCollected: number;
    invoices: number;
  };
  todayAppointments: Appointment[];
  upcomingAppointments: Appointment[];
  patients: Array<PatientOption & { lastConsultedAt: string }>;
  consultationHistory: Array<
    Appointment & {
      diagnoses: Diagnosis[];
      prescriptions: Array<{ id: string; prescriptionNumber: string }>;
    }
  >;
};

export type AppointmentEncounter = Appointment & {
  prescriptions: Prescription[];
  diagnoses: Diagnosis[];
  vitals: Vital[];
  labReports: LabReport[];
  followUps: FollowUp[];
  invoices: Array<
    PatientInvoice & {
      items: Array<{
        id: string;
        itemType: string;
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
      }>;
      payments: Payment[];
    }
  >;
  documents: PatientDocument[];
};
