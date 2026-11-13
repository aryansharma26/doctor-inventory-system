-- Remediates databases originally created with `prisma db push`, which creates
-- Prisma objects but does not execute the security SQL embedded in migrations.
CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.current_clinic_id()
RETURNS uuid LANGUAGE sql STABLE
AS $$ SELECT NULLIF(current_setting('app.clinic_id', true), '')::uuid $$;

CREATE OR REPLACE FUNCTION app.is_platform_admin()
RETURNS boolean LANGUAGE sql STABLE
AS $$ SELECT COALESCE(NULLIF(current_setting('app.is_platform_admin', true), '')::boolean, false) $$;

DO $$ BEGIN
  ALTER TABLE "InventoryLot" ADD CONSTRAINT "InventoryLot_quantity_nonnegative" CHECK ("quantity" >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "InventoryLot" ADD CONSTRAINT "InventoryLot_reserved_nonnegative" CHECK ("reserved" >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "InventoryLot" ADD CONSTRAINT "InventoryLot_reserved_within_quantity" CHECK ("reserved" <= "quantity");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "InventoryLot" ADD CONSTRAINT "InventoryLot_purchase_price_nonnegative" CHECK ("purchasePrice" >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_quantity_positive" CHECK ("quantity" > 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_balance_nonnegative" CHECK ("balanceAfter" >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ClinicMedicine" ADD CONSTRAINT "ClinicMedicine_reorder_nonnegative" CHECK ("reorderLevel" >= 0 AND "reorderQuantity" >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ClinicMedicine" ADD CONSTRAINT "ClinicMedicine_sale_price_nonnegative" CHECK ("salePrice" >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Document" ADD CONSTRAINT "Document_path_tenant_prefix" CHECK (split_part("objectPath", '/', 1) = "clinicId"::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Document" ADD CONSTRAINT "Document_size_limit" CHECK ("sizeBytes" IS NULL OR ("sizeBytes" > 0 AND "sizeBytes" <= 26214400));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "InventoryLot_fefo_idx" ON "InventoryLot" ("clinicId", "medicineId", "expiryDate") WHERE "quantity" > 0;

ALTER TABLE "Location" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Location" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Location_tenant_isolation" ON "Location";
CREATE POLICY "Location_tenant_isolation" ON "Location" USING ("clinicId" = app.current_clinic_id() OR app.is_platform_admin()) WITH CHECK ("clinicId" = app.current_clinic_id() OR app.is_platform_admin());

ALTER TABLE "ClinicMedicine" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClinicMedicine" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ClinicMedicine_tenant_isolation" ON "ClinicMedicine";
CREATE POLICY "ClinicMedicine_tenant_isolation" ON "ClinicMedicine" USING ("clinicId" = app.current_clinic_id() OR app.is_platform_admin()) WITH CHECK ("clinicId" = app.current_clinic_id() OR app.is_platform_admin());

ALTER TABLE "InventoryLot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventoryLot" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "InventoryLot_tenant_isolation" ON "InventoryLot";
CREATE POLICY "InventoryLot_tenant_isolation" ON "InventoryLot" USING ("clinicId" = app.current_clinic_id() OR app.is_platform_admin()) WITH CHECK ("clinicId" = app.current_clinic_id() OR app.is_platform_admin());

ALTER TABLE "StockMovement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockMovement" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "StockMovement_tenant_isolation" ON "StockMovement";
CREATE POLICY "StockMovement_tenant_isolation" ON "StockMovement" USING ("clinicId" = app.current_clinic_id() OR app.is_platform_admin()) WITH CHECK ("clinicId" = app.current_clinic_id() OR app.is_platform_admin());

ALTER TABLE "Supplier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Supplier" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Supplier_tenant_isolation" ON "Supplier";
CREATE POLICY "Supplier_tenant_isolation" ON "Supplier" USING ("clinicId" = app.current_clinic_id() OR app.is_platform_admin()) WITH CHECK ("clinicId" = app.current_clinic_id() OR app.is_platform_admin());

ALTER TABLE "PurchaseOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PurchaseOrder" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "PurchaseOrder_tenant_isolation" ON "PurchaseOrder";
CREATE POLICY "PurchaseOrder_tenant_isolation" ON "PurchaseOrder" USING ("clinicId" = app.current_clinic_id() OR app.is_platform_admin()) WITH CHECK ("clinicId" = app.current_clinic_id() OR app.is_platform_admin());

ALTER TABLE "PurchaseOrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PurchaseOrderItem" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "PurchaseOrderItem_tenant_isolation" ON "PurchaseOrderItem";
CREATE POLICY "PurchaseOrderItem_tenant_isolation" ON "PurchaseOrderItem"
USING (EXISTS (SELECT 1 FROM "PurchaseOrder" po WHERE po.id = "PurchaseOrderItem"."purchaseOrderId" AND (po."clinicId" = app.current_clinic_id() OR app.is_platform_admin())))
WITH CHECK (EXISTS (SELECT 1 FROM "PurchaseOrder" po WHERE po.id = "PurchaseOrderItem"."purchaseOrderId" AND (po."clinicId" = app.current_clinic_id() OR app.is_platform_admin())));

ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Invoice_tenant_isolation" ON "Invoice";
CREATE POLICY "Invoice_tenant_isolation" ON "Invoice" USING ("clinicId" = app.current_clinic_id() OR app.is_platform_admin()) WITH CHECK ("clinicId" = app.current_clinic_id() OR app.is_platform_admin());

ALTER TABLE "InvoiceItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InvoiceItem" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "InvoiceItem_tenant_isolation" ON "InvoiceItem";
CREATE POLICY "InvoiceItem_tenant_isolation" ON "InvoiceItem"
USING (EXISTS (SELECT 1 FROM "Invoice" i WHERE i.id = "InvoiceItem"."invoiceId" AND (i."clinicId" = app.current_clinic_id() OR app.is_platform_admin())))
WITH CHECK (EXISTS (SELECT 1 FROM "Invoice" i WHERE i.id = "InvoiceItem"."invoiceId" AND (i."clinicId" = app.current_clinic_id() OR app.is_platform_admin())));

ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "AuditLog_tenant_isolation" ON "AuditLog";
CREATE POLICY "AuditLog_tenant_isolation" ON "AuditLog" USING ("clinicId" = app.current_clinic_id() OR app.is_platform_admin()) WITH CHECK ("clinicId" = app.current_clinic_id() OR app.is_platform_admin());

ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Document_tenant_isolation" ON "Document";
CREATE POLICY "Document_tenant_isolation" ON "Document" USING ("clinicId" = app.current_clinic_id() OR app.is_platform_admin()) WITH CHECK ("clinicId" = app.current_clinic_id() OR app.is_platform_admin());

ALTER TABLE "IdempotencyKey" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IdempotencyKey" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "IdempotencyKey_tenant_isolation" ON "IdempotencyKey";
CREATE POLICY "IdempotencyKey_tenant_isolation" ON "IdempotencyKey" USING ("clinicId" = app.current_clinic_id() OR app.is_platform_admin()) WITH CHECK ("clinicId" = app.current_clinic_id() OR app.is_platform_admin());

ALTER TABLE "StorageUsage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StorageUsage" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "StorageUsage_tenant_isolation" ON "StorageUsage";
CREATE POLICY "StorageUsage_tenant_isolation" ON "StorageUsage" USING ("clinicId" = app.current_clinic_id() OR app.is_platform_admin()) WITH CHECK ("clinicId" = app.current_clinic_id() OR app.is_platform_admin());

CREATE OR REPLACE FUNCTION app.reject_audit_mutation()
RETURNS trigger LANGUAGE plpgsql
AS $$ BEGIN RAISE EXCEPTION 'AuditLog is append-only'; END; $$;

DROP TRIGGER IF EXISTS "AuditLog_immutable" ON "AuditLog";
CREATE TRIGGER "AuditLog_immutable" BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION app.reject_audit_mutation();
