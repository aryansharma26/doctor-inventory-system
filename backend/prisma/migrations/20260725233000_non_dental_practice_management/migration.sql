CREATE TYPE "AppointmentStatus" AS ENUM (
  'BOOKED',
  'CONFIRMED',
  'CHECKED_IN',
  'IN_CONSULTATION',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW'
);

CREATE TYPE "AppointmentType" AS ENUM (
  'CONSULTATION',
  'FOLLOW_UP',
  'PROCEDURE',
  'VACCINATION',
  'OTHER'
);

CREATE TYPE "PrescriptionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

CREATE TABLE "Appointment" (
  "id" UUID NOT NULL,
  "clinicId" UUID NOT NULL,
  "patientId" UUID NOT NULL,
  "doctorMembershipId" UUID NOT NULL,
  "createdById" UUID NOT NULL,
  "type" "AppointmentType" NOT NULL DEFAULT 'CONSULTATION',
  "status" "AppointmentStatus" NOT NULL DEFAULT 'BOOKED',
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "reason" TEXT,
  "notes" TEXT,
  "color" TEXT NOT NULL DEFAULT '#2563eb',
  "checkedInAt" TIMESTAMP(3),
  "consultationStartedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "reminderAt" TIMESTAMP(3),
  "reminderSentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Appointment_valid_time_range" CHECK ("endsAt" > "startsAt")
);

CREATE TABLE "PatientNote" (
  "id" UUID NOT NULL,
  "clinicId" UUID NOT NULL,
  "patientId" UUID NOT NULL,
  "authorId" UUID NOT NULL,
  "noteType" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "details" JSONB NOT NULL DEFAULT '{}',
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PatientNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Prescription" (
  "id" UUID NOT NULL,
  "clinicId" UUID NOT NULL,
  "patientId" UUID NOT NULL,
  "doctorMembershipId" UUID NOT NULL,
  "appointmentId" UUID,
  "prescriptionNumber" TEXT NOT NULL,
  "status" "PrescriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "diagnosis" TEXT,
  "notes" TEXT,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Prescription_expiry_after_issue" CHECK ("expiresAt" IS NULL OR "expiresAt" > "issuedAt")
);

CREATE TABLE "PrescriptionItem" (
  "id" UUID NOT NULL,
  "prescriptionId" UUID NOT NULL,
  "medicineId" UUID,
  "medicineName" TEXT NOT NULL,
  "dosage" TEXT NOT NULL,
  "frequency" TEXT NOT NULL,
  "durationDays" INTEGER,
  "quantity" DECIMAL(14,3),
  "instructions" TEXT,
  CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PrescriptionItem_duration_positive" CHECK ("durationDays" IS NULL OR "durationDays" > 0),
  CONSTRAINT "PrescriptionItem_quantity_positive" CHECK ("quantity" IS NULL OR "quantity" > 0)
);

CREATE UNIQUE INDEX "Appointment_id_clinicId_key" ON "Appointment"("id", "clinicId");
CREATE INDEX "Appointment_clinicId_startsAt_idx" ON "Appointment"("clinicId", "startsAt");
CREATE INDEX "Appointment_clinicId_doctorMembershipId_startsAt_idx" ON "Appointment"("clinicId", "doctorMembershipId", "startsAt");
CREATE INDEX "Appointment_clinicId_status_startsAt_idx" ON "Appointment"("clinicId", "status", "startsAt");
CREATE INDEX "Appointment_clinicId_patientId_startsAt_idx" ON "Appointment"("clinicId", "patientId", "startsAt");
CREATE INDEX "PatientNote_clinicId_patientId_recordedAt_idx" ON "PatientNote"("clinicId", "patientId", "recordedAt");
CREATE INDEX "PatientNote_clinicId_noteType_recordedAt_idx" ON "PatientNote"("clinicId", "noteType", "recordedAt");
CREATE UNIQUE INDEX "Prescription_clinicId_prescriptionNumber_key" ON "Prescription"("clinicId", "prescriptionNumber");
CREATE INDEX "Prescription_clinicId_issuedAt_idx" ON "Prescription"("clinicId", "issuedAt");
CREATE INDEX "Prescription_clinicId_patientId_issuedAt_idx" ON "Prescription"("clinicId", "patientId", "issuedAt");
CREATE INDEX "Prescription_clinicId_doctorMembershipId_issuedAt_idx" ON "Prescription"("clinicId", "doctorMembershipId", "issuedAt");
CREATE INDEX "PrescriptionItem_prescriptionId_idx" ON "PrescriptionItem"("prescriptionId");
CREATE INDEX "PrescriptionItem_medicineId_idx" ON "PrescriptionItem"("medicineId");

ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Appointment_doctorMembershipId_clinicId_fkey" FOREIGN KEY ("doctorMembershipId", "clinicId") REFERENCES "UserClinic"("id", "clinicId") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "Appointment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PatientNote"
  ADD CONSTRAINT "PatientNote_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "PatientNote_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "PatientNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Prescription"
  ADD CONSTRAINT "Prescription_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Prescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Prescription_doctorMembershipId_clinicId_fkey" FOREIGN KEY ("doctorMembershipId", "clinicId") REFERENCES "UserClinic"("id", "clinicId") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "Prescription_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PrescriptionItem"
  ADD CONSTRAINT "PrescriptionItem_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "PrescriptionItem_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" FORCE ROW LEVEL SECURITY;
CREATE POLICY "Appointment_tenant_isolation" ON "Appointment"
  USING ("clinicId" = app.current_clinic_id() OR app.is_platform_admin())
  WITH CHECK ("clinicId" = app.current_clinic_id() OR app.is_platform_admin());

ALTER TABLE "PatientNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PatientNote" FORCE ROW LEVEL SECURITY;
CREATE POLICY "PatientNote_tenant_isolation" ON "PatientNote"
  USING ("clinicId" = app.current_clinic_id() OR app.is_platform_admin())
  WITH CHECK ("clinicId" = app.current_clinic_id() OR app.is_platform_admin());

ALTER TABLE "Prescription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Prescription" FORCE ROW LEVEL SECURITY;
CREATE POLICY "Prescription_tenant_isolation" ON "Prescription"
  USING ("clinicId" = app.current_clinic_id() OR app.is_platform_admin())
  WITH CHECK ("clinicId" = app.current_clinic_id() OR app.is_platform_admin());

ALTER TABLE "PrescriptionItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PrescriptionItem" FORCE ROW LEVEL SECURITY;
CREATE POLICY "PrescriptionItem_tenant_isolation" ON "PrescriptionItem"
  USING (
    EXISTS (
      SELECT 1
      FROM "Prescription" p
      WHERE p.id = "PrescriptionItem"."prescriptionId"
        AND (p."clinicId" = app.current_clinic_id() OR app.is_platform_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM "Prescription" p
      WHERE p.id = "PrescriptionItem"."prescriptionId"
        AND (p."clinicId" = app.current_clinic_id() OR app.is_platform_admin())
    )
  );

INSERT INTO "Permission" ("key", "description", "category", "createdAt") VALUES
  ('appointment.read', 'View clinic appointments and daily queue', 'Practice', CURRENT_TIMESTAMP),
  ('appointment.manage', 'Create appointments and update queue status', 'Practice', CURRENT_TIMESTAMP),
  ('patient_record.read', 'View patient clinical records', 'Clinical', CURRENT_TIMESTAMP),
  ('patient_record.write', 'Create and update patient clinical records', 'Clinical', CURRENT_TIMESTAMP),
  ('prescription.read', 'View prescriptions', 'Clinical', CURRENT_TIMESTAMP),
  ('prescription.issue', 'Issue and manage prescriptions', 'Clinical', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE
SET "description" = EXCLUDED."description", "category" = EXCLUDED."category";

INSERT INTO "RolePermission" ("role", "permissionKey")
SELECT 'CLINIC_OWNER'::"Role", p."key"
FROM "Permission" p
WHERE p."key" IN (
  'appointment.read',
  'appointment.manage',
  'patient_record.read',
  'patient_record.write',
  'prescription.read',
  'prescription.issue'
)
ON CONFLICT DO NOTHING;

INSERT INTO "RolePermission" ("role", "permissionKey") VALUES
  ('DOCTOR', 'appointment.read'),
  ('DOCTOR', 'appointment.manage'),
  ('DOCTOR', 'patient_record.read'),
  ('DOCTOR', 'patient_record.write'),
  ('DOCTOR', 'prescription.read'),
  ('DOCTOR', 'prescription.issue'),
  ('RECEPTIONIST', 'appointment.read'),
  ('RECEPTIONIST', 'appointment.manage'),
  ('RECEPTIONIST', 'patient_record.read'),
  ('NURSE', 'appointment.read'),
  ('NURSE', 'patient_record.read'),
  ('NURSE', 'patient_record.write'),
  ('PHARMACIST', 'prescription.read')
ON CONFLICT DO NOTHING;
