-- Online booking and OPD queue tokens.

CREATE TYPE "BookingChannel" AS ENUM ('WALK_IN', 'ONLINE', 'PHONE');

ALTER TABLE "Appointment"
  ADD COLUMN "tokenNumber" INTEGER,
  ADD COLUMN "tokenDate" DATE,
  ADD COLUMN "channel" "BookingChannel" NOT NULL DEFAULT 'WALK_IN',
  ADD COLUMN "fee" DECIMAL(12,2),
  ADD COLUMN "isPaid" BOOLEAN NOT NULL DEFAULT false;

-- One token number per doctor per day.
CREATE UNIQUE INDEX "Appointment_clinicId_doctorMembershipId_tokenDate_tokenNumb_key"
  ON "Appointment"("clinicId", "doctorMembershipId", "tokenDate", "tokenNumber");

-- A doctor's time slot can hold only one active (non-cancelled) appointment.
CREATE UNIQUE INDEX "Appointment_active_doctor_slot_key"
  ON "Appointment"("clinicId", "doctorMembershipId", "startsAt")
  WHERE "status" <> 'CANCELLED';
