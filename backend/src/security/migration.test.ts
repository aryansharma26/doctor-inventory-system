import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../../prisma/migrations/20260725123000_initial_secure_schema/migration.sql", import.meta.url), "utf8");
const roleMigration = readFileSync(new URL("../../prisma/migrations/20260725143000_merge_clinic_admin_into_owner/migration.sql", import.meta.url), "utf8");
const practiceMigration = readFileSync(new URL("../../prisma/migrations/20260725233000_non_dental_practice_management/migration.sql", import.meta.url), "utf8");
const patient360Migration = readFileSync(new URL("../../prisma/migrations/20260726114500_patient_360_core/migration.sql", import.meta.url), "utf8");

describe("database defense in depth", () => {
  it("forces RLS on high-risk tenant tables", () => {
    for (const table of ["InventoryLot", "StockMovement", "Supplier", "PurchaseOrder", "Invoice", "AuditLog", "Document"]) {
      expect(migration).toContain(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`);
    }
  });

  it("makes audit records append-only", () => {
    expect(migration).toContain('CREATE TRIGGER "AuditLog_immutable"');
    expect(migration).toContain("RAISE EXCEPTION 'AuditLog is append-only'");
  });

  it("preserves former clinic administrators as clinic owners", () => {
    expect(roleMigration).toContain(`SET "role" = 'CLINIC_OWNER'`);
    expect(roleMigration).toContain(`WHERE "role" = 'CLINIC_ADMIN'`);
    const newRoleDefinition = roleMigration.slice(
      roleMigration.indexOf('CREATE TYPE "Role"'),
      roleMigration.indexOf('ALTER TABLE "UserClinic"')
    );
    expect(newRoleDefinition).not.toContain("CLINIC_ADMIN");
  });

  it("forces tenant isolation on every clinical practice table", () => {
    for (const table of ["Appointment", "PatientNote", "Prescription", "PrescriptionItem"]) {
      expect(practiceMigration).toContain(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`);
      expect(practiceMigration).toContain(`CREATE POLICY "${table}_tenant_isolation"`);
    }
  });

  it("does not introduce dental charting entities", () => {
    expect(practiceMigration).not.toMatch(/\b(tooth|teeth|dental|odontogram)\b/i);
  });

  it("forces tenant isolation on Patient 360 and doctor scheduling tables", () => {
    for (const table of [
      "MedicalHistory",
      "Allergy",
      "Vital",
      "Diagnosis",
      "LabReport",
      "Vaccination",
      "InsurancePolicy",
      "FollowUp",
      "Payment",
      "DoctorAvailability",
      "DoctorTimeOff"
    ]) {
      expect(patient360Migration).toContain(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`);
      expect(patient360Migration).toContain(`CREATE POLICY "${table}_tenant_isolation"`);
    }
  });

  it("enforces patient and appointment clinic boundaries with composite foreign keys", () => {
    expect(patient360Migration).toContain('REFERENCES "Patient"("id", "clinicId")');
    expect(patient360Migration).toContain('REFERENCES "Appointment"("id", "clinicId")');
    expect(patient360Migration).toContain('REFERENCES "Invoice"("id", "clinicId")');
  });
});
