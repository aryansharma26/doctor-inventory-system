CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CREDIT', 'SPLIT');

ALTER TABLE "Invoice"
  ADD COLUMN "patientId" UUID,
  ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
  ADD COLUMN "paymentDetails" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "notes" TEXT;

CREATE TABLE "Patient" (
  "id" UUID NOT NULL,
  "clinicId" UUID NOT NULL,
  "patientCode" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "email" TEXT,
  "dateOfBirth" TIMESTAMP(3),
  "gender" TEXT,
  "address" JSONB,
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Expense" (
  "id" UUID NOT NULL,
  "clinicId" UUID NOT NULL,
  "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
  "reference" TEXT,
  "notes" TEXT,
  "createdById" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Patient_clinicId_patientCode_key" ON "Patient"("clinicId", "patientCode");
CREATE INDEX "Patient_clinicId_name_idx" ON "Patient"("clinicId", "name");
CREATE INDEX "Patient_clinicId_phone_idx" ON "Patient"("clinicId", "phone");
CREATE INDEX "Expense_clinicId_expenseDate_idx" ON "Expense"("clinicId", "expenseDate");
CREATE INDEX "Expense_clinicId_category_idx" ON "Expense"("clinicId", "category");
CREATE INDEX "Invoice_clinicId_patientId_idx" ON "Invoice"("clinicId", "patientId");

ALTER TABLE "Patient" ADD CONSTRAINT "Patient_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Expense" ADD CONSTRAINT "Expense_amount_positive" CHECK ("amount" > 0);

ALTER TABLE "Patient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Patient" FORCE ROW LEVEL SECURITY;
CREATE POLICY "Patient_tenant_isolation" ON "Patient"
  USING ("clinicId" = app.current_clinic_id() OR app.is_platform_admin())
  WITH CHECK ("clinicId" = app.current_clinic_id() OR app.is_platform_admin());

ALTER TABLE "Expense" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Expense" FORCE ROW LEVEL SECURITY;
CREATE POLICY "Expense_tenant_isolation" ON "Expense"
  USING ("clinicId" = app.current_clinic_id() OR app.is_platform_admin())
  WITH CHECK ("clinicId" = app.current_clinic_id() OR app.is_platform_admin());
