CREATE TYPE "ClinicalRecordStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'INACTIVE');
CREATE TYPE "AllergySeverity" AS ENUM ('MILD', 'MODERATE', 'SEVERE', 'CRITICAL');
CREATE TYPE "DiagnosisStatus" AS ENUM ('PROVISIONAL', 'CONFIRMED', 'RESOLVED', 'RULED_OUT');
CREATE TYPE "LabReportStatus" AS ENUM ('ORDERED', 'SAMPLE_COLLECTED', 'PROCESSING', 'FINAL', 'AMENDED', 'CANCELLED');
CREATE TYPE "FollowUpStatus" AS ENUM ('PENDING', 'SCHEDULED', 'COMPLETED', 'MISSED', 'CANCELLED');
CREATE TYPE "InsuranceStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

ALTER TABLE "Patient"
  ADD COLUMN "bloodGroup" TEXT,
  ADD COLUMN "maritalStatus" TEXT,
  ADD COLUMN "occupation" TEXT,
  ADD COLUMN "preferredLanguage" TEXT,
  ADD COLUMN "emergencyContact" JSONB,
  ADD COLUMN "communicationPreferences" JSONB,
  ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "consentAt" TIMESTAMP(3);

ALTER TABLE "Appointment"
  ADD COLUMN "symptoms" TEXT,
  ADD COLUMN "diagnosisSummary" TEXT,
  ADD COLUMN "clinicalSummary" TEXT,
  ADD COLUMN "followUpAt" TIMESTAMP(3);

ALTER TABLE "Invoice"
  ADD COLUMN "doctorMembershipId" UUID,
  ADD COLUMN "appointmentId" UUID;

ALTER TABLE "InvoiceItem"
  ALTER COLUMN "medicineId" DROP NOT NULL,
  ADD COLUMN "itemType" TEXT NOT NULL DEFAULT 'MEDICINE',
  ADD COLUMN "code" TEXT;

ALTER TABLE "Document"
  ADD COLUMN "patientId" UUID,
  ADD COLUMN "appointmentId" UUID;

CREATE UNIQUE INDEX "Patient_id_clinicId_key" ON "Patient"("id", "clinicId");
CREATE UNIQUE INDEX "Invoice_id_clinicId_key" ON "Invoice"("id", "clinicId");
CREATE INDEX "Invoice_clinicId_appointmentId_idx" ON "Invoice"("clinicId", "appointmentId");
CREATE INDEX "Invoice_clinicId_doctorMembershipId_issuedAt_idx" ON "Invoice"("clinicId", "doctorMembershipId", "issuedAt");
CREATE INDEX "Document_clinicId_patientId_createdAt_idx" ON "Document"("clinicId", "patientId", "createdAt");
CREATE INDEX "Document_clinicId_appointmentId_idx" ON "Document"("clinicId", "appointmentId");

ALTER TABLE "Invoice"
  ADD CONSTRAINT "Invoice_doctorMembershipId_clinicId_fkey"
    FOREIGN KEY ("doctorMembershipId", "clinicId") REFERENCES "UserClinic"("id", "clinicId")
    ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT "Invoice_appointmentId_clinicId_fkey"
    FOREIGN KEY ("appointmentId", "clinicId") REFERENCES "Appointment"("id", "clinicId")
    ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "InvoiceItem" DROP CONSTRAINT "InvoiceItem_medicineId_fkey";
ALTER TABLE "InvoiceItem"
  ADD CONSTRAINT "InvoiceItem_medicineId_fkey"
    FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Document"
  ADD CONSTRAINT "Document_patientId_clinicId_fkey"
    FOREIGN KEY ("patientId", "clinicId") REFERENCES "Patient"("id", "clinicId")
    ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT "Document_appointmentId_clinicId_fkey"
    FOREIGN KEY ("appointmentId", "clinicId") REFERENCES "Appointment"("id", "clinicId")
    ON DELETE NO ACTION ON UPDATE CASCADE;

CREATE TABLE "DoctorAvailability" (
  "id" UUID NOT NULL,
  "clinicId" UUID NOT NULL,
  "doctorMembershipId" UUID NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startMinutes" INTEGER NOT NULL,
  "endMinutes" INTEGER NOT NULL,
  "slotDurationMinutes" INTEGER NOT NULL DEFAULT 30,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DoctorAvailability_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DoctorAvailability_day_range" CHECK ("dayOfWeek" BETWEEN 0 AND 6),
  CONSTRAINT "DoctorAvailability_time_range" CHECK (
    "startMinutes" BETWEEN 0 AND 1439 AND
    "endMinutes" BETWEEN 1 AND 1440 AND
    "endMinutes" > "startMinutes"
  ),
  CONSTRAINT "DoctorAvailability_slot_range" CHECK ("slotDurationMinutes" BETWEEN 5 AND 240)
);

CREATE TABLE "DoctorTimeOff" (
  "id" UUID NOT NULL,
  "clinicId" UUID NOT NULL,
  "doctorMembershipId" UUID NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DoctorTimeOff_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DoctorTimeOff_valid_range" CHECK ("endsAt" > "startsAt")
);

CREATE UNIQUE INDEX "DoctorAvailability_clinicId_doctorMembershipId_dayOfWeek_startMinutes_key"
  ON "DoctorAvailability"("clinicId", "doctorMembershipId", "dayOfWeek", "startMinutes");
CREATE INDEX "DoctorAvailability_clinicId_doctorMembershipId_dayOfWeek_idx"
  ON "DoctorAvailability"("clinicId", "doctorMembershipId", "dayOfWeek");
CREATE INDEX "DoctorTimeOff_clinicId_doctorMembershipId_startsAt_idx"
  ON "DoctorTimeOff"("clinicId", "doctorMembershipId", "startsAt");

ALTER TABLE "DoctorAvailability"
  ADD CONSTRAINT "DoctorAvailability_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DoctorAvailability_doctorMembershipId_clinicId_fkey" FOREIGN KEY ("doctorMembershipId", "clinicId") REFERENCES "UserClinic"("id", "clinicId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DoctorTimeOff"
  ADD CONSTRAINT "DoctorTimeOff_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DoctorTimeOff_doctorMembershipId_clinicId_fkey" FOREIGN KEY ("doctorMembershipId", "clinicId") REFERENCES "UserClinic"("id", "clinicId") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "MedicalHistory" (
  "id" UUID NOT NULL,
  "clinicId" UUID NOT NULL,
  "patientId" UUID NOT NULL,
  "appointmentId" UUID,
  "recordedById" UUID NOT NULL,
  "condition" TEXT NOT NULL,
  "category" TEXT,
  "status" "ClinicalRecordStatus" NOT NULL DEFAULT 'ACTIVE',
  "diagnosedOn" TIMESTAMP(3),
  "resolvedOn" TIMESTAMP(3),
  "isChronic" BOOLEAN NOT NULL DEFAULT false,
  "treatment" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MedicalHistory_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MedicalHistory_resolution_dates" CHECK ("resolvedOn" IS NULL OR "diagnosedOn" IS NULL OR "resolvedOn" >= "diagnosedOn")
);

CREATE TABLE "Allergy" (
  "id" UUID NOT NULL,
  "clinicId" UUID NOT NULL,
  "patientId" UUID NOT NULL,
  "appointmentId" UUID,
  "recordedById" UUID NOT NULL,
  "allergen" TEXT NOT NULL,
  "allergyType" TEXT NOT NULL,
  "severity" "AllergySeverity" NOT NULL DEFAULT 'MODERATE',
  "status" "ClinicalRecordStatus" NOT NULL DEFAULT 'ACTIVE',
  "reaction" TEXT,
  "onsetDate" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Allergy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Vital" (
  "id" UUID NOT NULL,
  "clinicId" UUID NOT NULL,
  "patientId" UUID NOT NULL,
  "appointmentId" UUID,
  "recordedById" UUID NOT NULL,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "systolicBp" INTEGER,
  "diastolicBp" INTEGER,
  "heartRate" INTEGER,
  "respiratoryRate" INTEGER,
  "temperatureCelsius" DECIMAL(5,2),
  "oxygenSaturation" DECIMAL(5,2),
  "heightCm" DECIMAL(6,2),
  "weightKg" DECIMAL(6,2),
  "bmi" DECIMAL(5,2),
  "bloodGlucoseMgDl" DECIMAL(7,2),
  "painScore" INTEGER,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Vital_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Vital_systolic_range" CHECK ("systolicBp" IS NULL OR "systolicBp" BETWEEN 40 AND 300),
  CONSTRAINT "Vital_diastolic_range" CHECK ("diastolicBp" IS NULL OR "diastolicBp" BETWEEN 20 AND 200),
  CONSTRAINT "Vital_heart_rate_range" CHECK ("heartRate" IS NULL OR "heartRate" BETWEEN 20 AND 300),
  CONSTRAINT "Vital_respiration_range" CHECK ("respiratoryRate" IS NULL OR "respiratoryRate" BETWEEN 4 AND 100),
  CONSTRAINT "Vital_temperature_range" CHECK ("temperatureCelsius" IS NULL OR "temperatureCelsius" BETWEEN 25 AND 50),
  CONSTRAINT "Vital_oxygen_range" CHECK ("oxygenSaturation" IS NULL OR "oxygenSaturation" BETWEEN 0 AND 100),
  CONSTRAINT "Vital_pain_range" CHECK ("painScore" IS NULL OR "painScore" BETWEEN 0 AND 10),
  CONSTRAINT "Vital_dimensions_positive" CHECK (
    ("heightCm" IS NULL OR "heightCm" > 0) AND
    ("weightKg" IS NULL OR "weightKg" > 0) AND
    ("bmi" IS NULL OR "bmi" > 0) AND
    ("bloodGlucoseMgDl" IS NULL OR "bloodGlucoseMgDl" >= 0)
  )
);

CREATE TABLE "Diagnosis" (
  "id" UUID NOT NULL,
  "clinicId" UUID NOT NULL,
  "patientId" UUID NOT NULL,
  "appointmentId" UUID,
  "recordedById" UUID NOT NULL,
  "code" TEXT,
  "name" TEXT NOT NULL,
  "diagnosisType" TEXT NOT NULL DEFAULT 'PRIMARY',
  "status" "DiagnosisStatus" NOT NULL DEFAULT 'CONFIRMED',
  "diagnosedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Diagnosis_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Diagnosis_resolution_date" CHECK ("resolvedAt" IS NULL OR "resolvedAt" >= "diagnosedAt")
);

CREATE TABLE "LabReport" (
  "id" UUID NOT NULL,
  "clinicId" UUID NOT NULL,
  "patientId" UUID NOT NULL,
  "appointmentId" UUID,
  "recordedById" UUID NOT NULL,
  "reportNumber" TEXT NOT NULL,
  "testName" TEXT NOT NULL,
  "labName" TEXT,
  "status" "LabReportStatus" NOT NULL DEFAULT 'ORDERED',
  "orderedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "collectedAt" TIMESTAMP(3),
  "reportedAt" TIMESTAMP(3),
  "results" JSONB NOT NULL DEFAULT '{}',
  "interpretation" TEXT,
  "abnormal" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LabReport_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LabReport_event_dates" CHECK (
    ("collectedAt" IS NULL OR "collectedAt" >= "orderedAt") AND
    ("reportedAt" IS NULL OR "reportedAt" >= "orderedAt")
  )
);

CREATE TABLE "Vaccination" (
  "id" UUID NOT NULL,
  "clinicId" UUID NOT NULL,
  "patientId" UUID NOT NULL,
  "appointmentId" UUID,
  "recordedById" UUID NOT NULL,
  "vaccineName" TEXT NOT NULL,
  "disease" TEXT,
  "doseNumber" TEXT,
  "lotNumber" TEXT,
  "manufacturer" TEXT,
  "administeredAt" TIMESTAMP(3) NOT NULL,
  "route" TEXT,
  "site" TEXT,
  "nextDoseAt" TIMESTAMP(3),
  "adverseReaction" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Vaccination_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Vaccination_next_dose" CHECK ("nextDoseAt" IS NULL OR "nextDoseAt" > "administeredAt")
);

CREATE TABLE "InsurancePolicy" (
  "id" UUID NOT NULL,
  "clinicId" UUID NOT NULL,
  "patientId" UUID NOT NULL,
  "providerName" TEXT NOT NULL,
  "planName" TEXT,
  "policyNumber" TEXT NOT NULL,
  "memberId" TEXT,
  "groupNumber" TEXT,
  "policyHolder" TEXT NOT NULL,
  "relationship" TEXT,
  "status" "InsuranceStatus" NOT NULL DEFAULT 'ACTIVE',
  "validFrom" TIMESTAMP(3),
  "validUntil" TIMESTAMP(3),
  "coverageAmount" DECIMAL(14,2),
  "copayAmount" DECIMAL(14,2),
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InsurancePolicy_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InsurancePolicy_valid_dates" CHECK ("validUntil" IS NULL OR "validFrom" IS NULL OR "validUntil" >= "validFrom"),
  CONSTRAINT "InsurancePolicy_amounts" CHECK (
    ("coverageAmount" IS NULL OR "coverageAmount" >= 0) AND
    ("copayAmount" IS NULL OR "copayAmount" >= 0)
  )
);

CREATE TABLE "FollowUp" (
  "id" UUID NOT NULL,
  "clinicId" UUID NOT NULL,
  "patientId" UUID NOT NULL,
  "appointmentId" UUID,
  "recordedById" UUID NOT NULL,
  "dueAt" TIMESTAMP(3) NOT NULL,
  "status" "FollowUpStatus" NOT NULL DEFAULT 'PENDING',
  "reason" TEXT NOT NULL,
  "priority" TEXT NOT NULL DEFAULT 'NORMAL',
  "channel" TEXT,
  "assignedToId" UUID,
  "outcome" TEXT,
  "completedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
  "id" UUID NOT NULL,
  "clinicId" UUID NOT NULL,
  "patientId" UUID,
  "appointmentId" UUID,
  "invoiceId" UUID NOT NULL,
  "recordedById" UUID NOT NULL,
  "receiptNumber" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "refundedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "method" "PaymentMethod" NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'COMPLETED',
  "transactionReference" TEXT,
  "notes" TEXT,
  "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Payment_amount_positive" CHECK ("amount" > 0),
  CONSTRAINT "Payment_refund_valid" CHECK ("refundedAmount" >= 0 AND "refundedAmount" <= "amount")
);

CREATE INDEX "MedicalHistory_clinicId_patientId_createdAt_idx" ON "MedicalHistory"("clinicId", "patientId", "createdAt");
CREATE INDEX "MedicalHistory_clinicId_status_idx" ON "MedicalHistory"("clinicId", "status");
CREATE INDEX "Allergy_clinicId_patientId_status_idx" ON "Allergy"("clinicId", "patientId", "status");
CREATE INDEX "Allergy_clinicId_severity_idx" ON "Allergy"("clinicId", "severity");
CREATE INDEX "Vital_clinicId_patientId_recordedAt_idx" ON "Vital"("clinicId", "patientId", "recordedAt");
CREATE INDEX "Vital_clinicId_appointmentId_idx" ON "Vital"("clinicId", "appointmentId");
CREATE INDEX "Diagnosis_clinicId_patientId_diagnosedAt_idx" ON "Diagnosis"("clinicId", "patientId", "diagnosedAt");
CREATE INDEX "Diagnosis_clinicId_code_idx" ON "Diagnosis"("clinicId", "code");
CREATE INDEX "Diagnosis_clinicId_status_idx" ON "Diagnosis"("clinicId", "status");
CREATE UNIQUE INDEX "LabReport_clinicId_reportNumber_key" ON "LabReport"("clinicId", "reportNumber");
CREATE INDEX "LabReport_clinicId_patientId_orderedAt_idx" ON "LabReport"("clinicId", "patientId", "orderedAt");
CREATE INDEX "LabReport_clinicId_status_idx" ON "LabReport"("clinicId", "status");
CREATE INDEX "Vaccination_clinicId_patientId_administeredAt_idx" ON "Vaccination"("clinicId", "patientId", "administeredAt");
CREATE INDEX "Vaccination_clinicId_nextDoseAt_idx" ON "Vaccination"("clinicId", "nextDoseAt");
CREATE UNIQUE INDEX "InsurancePolicy_clinicId_policyNumber_key" ON "InsurancePolicy"("clinicId", "policyNumber");
CREATE INDEX "InsurancePolicy_clinicId_patientId_status_idx" ON "InsurancePolicy"("clinicId", "patientId", "status");
CREATE INDEX "InsurancePolicy_clinicId_validUntil_idx" ON "InsurancePolicy"("clinicId", "validUntil");
CREATE INDEX "FollowUp_clinicId_patientId_dueAt_idx" ON "FollowUp"("clinicId", "patientId", "dueAt");
CREATE INDEX "FollowUp_clinicId_status_dueAt_idx" ON "FollowUp"("clinicId", "status", "dueAt");
CREATE INDEX "FollowUp_clinicId_assignedToId_dueAt_idx" ON "FollowUp"("clinicId", "assignedToId", "dueAt");
CREATE UNIQUE INDEX "Payment_clinicId_receiptNumber_key" ON "Payment"("clinicId", "receiptNumber");
CREATE INDEX "Payment_clinicId_patientId_paidAt_idx" ON "Payment"("clinicId", "patientId", "paidAt");
CREATE INDEX "Payment_clinicId_invoiceId_idx" ON "Payment"("clinicId", "invoiceId");
CREATE INDEX "Payment_clinicId_status_paidAt_idx" ON "Payment"("clinicId", "status", "paidAt");

ALTER TABLE "MedicalHistory"
  ADD CONSTRAINT "MedicalHistory_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "MedicalHistory_patientId_clinicId_fkey" FOREIGN KEY ("patientId", "clinicId") REFERENCES "Patient"("id", "clinicId") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "MedicalHistory_appointmentId_clinicId_fkey" FOREIGN KEY ("appointmentId", "clinicId") REFERENCES "Appointment"("id", "clinicId") ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT "MedicalHistory_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Allergy"
  ADD CONSTRAINT "Allergy_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Allergy_patientId_clinicId_fkey" FOREIGN KEY ("patientId", "clinicId") REFERENCES "Patient"("id", "clinicId") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Allergy_appointmentId_clinicId_fkey" FOREIGN KEY ("appointmentId", "clinicId") REFERENCES "Appointment"("id", "clinicId") ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT "Allergy_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Vital"
  ADD CONSTRAINT "Vital_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Vital_patientId_clinicId_fkey" FOREIGN KEY ("patientId", "clinicId") REFERENCES "Patient"("id", "clinicId") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Vital_appointmentId_clinicId_fkey" FOREIGN KEY ("appointmentId", "clinicId") REFERENCES "Appointment"("id", "clinicId") ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT "Vital_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Diagnosis"
  ADD CONSTRAINT "Diagnosis_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Diagnosis_patientId_clinicId_fkey" FOREIGN KEY ("patientId", "clinicId") REFERENCES "Patient"("id", "clinicId") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Diagnosis_appointmentId_clinicId_fkey" FOREIGN KEY ("appointmentId", "clinicId") REFERENCES "Appointment"("id", "clinicId") ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT "Diagnosis_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LabReport"
  ADD CONSTRAINT "LabReport_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "LabReport_patientId_clinicId_fkey" FOREIGN KEY ("patientId", "clinicId") REFERENCES "Patient"("id", "clinicId") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "LabReport_appointmentId_clinicId_fkey" FOREIGN KEY ("appointmentId", "clinicId") REFERENCES "Appointment"("id", "clinicId") ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT "LabReport_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Vaccination"
  ADD CONSTRAINT "Vaccination_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Vaccination_patientId_clinicId_fkey" FOREIGN KEY ("patientId", "clinicId") REFERENCES "Patient"("id", "clinicId") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Vaccination_appointmentId_clinicId_fkey" FOREIGN KEY ("appointmentId", "clinicId") REFERENCES "Appointment"("id", "clinicId") ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT "Vaccination_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InsurancePolicy"
  ADD CONSTRAINT "InsurancePolicy_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "InsurancePolicy_patientId_clinicId_fkey" FOREIGN KEY ("patientId", "clinicId") REFERENCES "Patient"("id", "clinicId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FollowUp"
  ADD CONSTRAINT "FollowUp_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "FollowUp_patientId_clinicId_fkey" FOREIGN KEY ("patientId", "clinicId") REFERENCES "Patient"("id", "clinicId") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "FollowUp_appointmentId_clinicId_fkey" FOREIGN KEY ("appointmentId", "clinicId") REFERENCES "Appointment"("id", "clinicId") ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT "FollowUp_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Payment_patientId_clinicId_fkey" FOREIGN KEY ("patientId", "clinicId") REFERENCES "Patient"("id", "clinicId") ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT "Payment_appointmentId_clinicId_fkey" FOREIGN KEY ("appointmentId", "clinicId") REFERENCES "Appointment"("id", "clinicId") ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT "Payment_invoiceId_clinicId_fkey" FOREIGN KEY ("invoiceId", "clinicId") REFERENCES "Invoice"("id", "clinicId") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Payment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MedicalHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MedicalHistory" FORCE ROW LEVEL SECURITY;
CREATE POLICY "MedicalHistory_tenant_isolation" ON "MedicalHistory"
  USING ("clinicId" = app.current_clinic_id() OR app.is_platform_admin())
  WITH CHECK ("clinicId" = app.current_clinic_id() OR app.is_platform_admin());

ALTER TABLE "Allergy" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Allergy" FORCE ROW LEVEL SECURITY;
CREATE POLICY "Allergy_tenant_isolation" ON "Allergy"
  USING ("clinicId" = app.current_clinic_id() OR app.is_platform_admin())
  WITH CHECK ("clinicId" = app.current_clinic_id() OR app.is_platform_admin());

ALTER TABLE "Vital" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Vital" FORCE ROW LEVEL SECURITY;
CREATE POLICY "Vital_tenant_isolation" ON "Vital"
  USING ("clinicId" = app.current_clinic_id() OR app.is_platform_admin())
  WITH CHECK ("clinicId" = app.current_clinic_id() OR app.is_platform_admin());

ALTER TABLE "Diagnosis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Diagnosis" FORCE ROW LEVEL SECURITY;
CREATE POLICY "Diagnosis_tenant_isolation" ON "Diagnosis"
  USING ("clinicId" = app.current_clinic_id() OR app.is_platform_admin())
  WITH CHECK ("clinicId" = app.current_clinic_id() OR app.is_platform_admin());

ALTER TABLE "LabReport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LabReport" FORCE ROW LEVEL SECURITY;
CREATE POLICY "LabReport_tenant_isolation" ON "LabReport"
  USING ("clinicId" = app.current_clinic_id() OR app.is_platform_admin())
  WITH CHECK ("clinicId" = app.current_clinic_id() OR app.is_platform_admin());

ALTER TABLE "Vaccination" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Vaccination" FORCE ROW LEVEL SECURITY;
CREATE POLICY "Vaccination_tenant_isolation" ON "Vaccination"
  USING ("clinicId" = app.current_clinic_id() OR app.is_platform_admin())
  WITH CHECK ("clinicId" = app.current_clinic_id() OR app.is_platform_admin());

ALTER TABLE "InsurancePolicy" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InsurancePolicy" FORCE ROW LEVEL SECURITY;
CREATE POLICY "InsurancePolicy_tenant_isolation" ON "InsurancePolicy"
  USING ("clinicId" = app.current_clinic_id() OR app.is_platform_admin())
  WITH CHECK ("clinicId" = app.current_clinic_id() OR app.is_platform_admin());

ALTER TABLE "FollowUp" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FollowUp" FORCE ROW LEVEL SECURITY;
CREATE POLICY "FollowUp_tenant_isolation" ON "FollowUp"
  USING ("clinicId" = app.current_clinic_id() OR app.is_platform_admin())
  WITH CHECK ("clinicId" = app.current_clinic_id() OR app.is_platform_admin());

ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" FORCE ROW LEVEL SECURITY;
CREATE POLICY "Payment_tenant_isolation" ON "Payment"
  USING ("clinicId" = app.current_clinic_id() OR app.is_platform_admin())
  WITH CHECK ("clinicId" = app.current_clinic_id() OR app.is_platform_admin());

ALTER TABLE "DoctorAvailability" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DoctorAvailability" FORCE ROW LEVEL SECURITY;
CREATE POLICY "DoctorAvailability_tenant_isolation" ON "DoctorAvailability"
  USING ("clinicId" = app.current_clinic_id() OR app.is_platform_admin())
  WITH CHECK ("clinicId" = app.current_clinic_id() OR app.is_platform_admin());

ALTER TABLE "DoctorTimeOff" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DoctorTimeOff" FORCE ROW LEVEL SECURITY;
CREATE POLICY "DoctorTimeOff_tenant_isolation" ON "DoctorTimeOff"
  USING ("clinicId" = app.current_clinic_id() OR app.is_platform_admin())
  WITH CHECK ("clinicId" = app.current_clinic_id() OR app.is_platform_admin());

INSERT INTO "RolePermission" ("role", "permissionKey")
VALUES ('RECEPTIONIST', 'patient_record.write')
ON CONFLICT DO NOTHING;
