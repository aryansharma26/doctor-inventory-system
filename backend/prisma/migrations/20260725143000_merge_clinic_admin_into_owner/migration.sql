-- Preserve every existing Clinic Admin membership by promoting it to Clinic Owner.
-- Role permissions for Clinic Admin are redundant because Clinic Owner already
-- owns the full clinic permission set.
DELETE FROM "RolePermission"
WHERE "role" = 'CLINIC_ADMIN';

UPDATE "UserClinic"
SET "role" = 'CLINIC_OWNER'
WHERE "role" = 'CLINIC_ADMIN';

ALTER TYPE "Role" RENAME TO "Role_legacy";

CREATE TYPE "Role" AS ENUM (
  'SUPER_ADMIN',
  'CLINIC_OWNER',
  'DOCTOR',
  'RECEPTIONIST',
  'INVENTORY_MANAGER',
  'PHARMACIST',
  'NURSE',
  'ACCOUNTANT',
  'STAFF',
  'AUDITOR'
);

ALTER TABLE "UserClinic"
  ALTER COLUMN "role" TYPE "Role"
  USING ("role"::text::"Role");

ALTER TABLE "RolePermission"
  ALTER COLUMN "role" TYPE "Role"
  USING ("role"::text::"Role");

DROP TYPE "Role_legacy";

UPDATE "Announcement"
SET "audience" = 'CLINIC_OWNERS'
WHERE "audience" = 'CLINIC_ADMINS';

ALTER TYPE "AnnouncementAudience" RENAME TO "AnnouncementAudience_legacy";

CREATE TYPE "AnnouncementAudience" AS ENUM (
  'ALL_CLINICS',
  'CLINIC_OWNERS',
  'ALL_USERS'
);

ALTER TABLE "Announcement"
  ALTER COLUMN "audience" TYPE "AnnouncementAudience"
  USING ("audience"::text::"AnnouncementAudience");

DROP TYPE "AnnouncementAudience_legacy";
